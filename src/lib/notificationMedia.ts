import type { AuthenticatedRequest } from './api'
import { safeNotificationUrl } from './notificationContent'
import type { NotificationCapabilities } from '../types/notification'

export const NOTIFICATION_PATH = '/v1/app-nudger/nudge'
const positive = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0

// Validate the source before canvas conversion, which would otherwise flatten animation.
export function validateNotificationImageBytes(bytes: Uint8Array, mime: string): void {
  const text = (offset: number, length: number) => String.fromCharCode(...bytes.slice(offset, offset + length))
  const invalid = () => { throw new Error('That image could not be read. Choose a JPEG, PNG or WebP image.') }
  const animated = () => { throw new Error('Choose a static image. Animated images are not supported.') }
  if (mime === 'image/jpeg') {
    if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) invalid()
    return
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (mime === 'image/png') {
    if (bytes.length < 20 || ![137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) invalid()
    for (let offset = 8; offset < bytes.length;) {
      if (offset + 12 > bytes.length) invalid()
      const length = view.getUint32(offset)
      if (offset + length + 12 > bytes.length) invalid()
      if (text(offset + 4, 4) === 'acTL') animated()
      offset += length + 12
    }
    return
  }
  if (mime !== 'image/webp' || bytes.length < 20 || text(0, 4) !== 'RIFF' || text(8, 4) !== 'WEBP' || view.getUint32(4, true) + 8 !== bytes.length) invalid()
  for (let offset = 12; offset < bytes.length;) {
    if (offset + 8 > bytes.length) invalid()
    const length = view.getUint32(offset + 4, true), type = text(offset, 4)
    if (offset + length + 8 > bytes.length) invalid()
    if (type === 'ANIM' || type === 'ANMF' || (type === 'VP8X' && Boolean(bytes[offset + 8]! & 2))) animated()
    offset += length + 8 + (length % 2)
  }
}

export async function getNotificationCapabilities(request: AuthenticatedRequest, signal?: AbortSignal): Promise<NotificationCapabilities> {
  const response = await request<{ data: NotificationCapabilities }>(`${NOTIFICATION_PATH}/capabilities`, { signal })
  const caps = response?.data
  if (!caps || !Array.isArray(caps.allowed_formats) || !caps.allowed_formats.length || caps.allowed_formats.some(item => !['basic', 'rich'].includes(item)) ||
    !Array.isArray(caps.delivery_types) || !caps.delivery_types.length || caps.delivery_types.some(item => !['broadcast', 'transactional'].includes(item)) ||
    !Array.isArray(caps.cta_presets) || !caps.cta_presets.length || caps.cta_presets.some(item => !item || !['watch_now', 'learn_more'].includes(item.value)) || caps.media_optional_for_rich !== true ||
    !['message_max_characters', 'title_max_characters', 'url_max_characters', 'source_max_bytes', 'final_max_bytes', 'max_dimension', 'notification_day_limit', 'media_cleanup_days'].every(key => positive(caps[key as keyof NotificationCapabilities]))) {
    throw new Error('Notification options could not be read. Try loading them again.')
  }
  return caps
}

export async function prepareNotificationImage(file: File, caps: NotificationCapabilities): Promise<Blob> {
  if (!['image/webp', 'image/png', 'image/jpeg'].includes(file.type)) throw new Error('Choose a JPEG, PNG or WebP image.')
  if (!file.size || file.size > caps.source_max_bytes) throw new Error(`Choose an image up to ${(caps.source_max_bytes / 1048576).toFixed(1)} MB.`)
  validateNotificationImageBytes(new Uint8Array(await file.arrayBuffer()), file.type)
  const sourceUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('That image could not be read. Choose another image.'))
      element.src = sourceUrl
    })
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 16_000_000 || Math.max(image.naturalWidth, image.naturalHeight) > 16000) throw new Error('Choose an image with smaller dimensions.')
    const scale = Math.min(1, caps.max_dimension / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('This browser cannot prepare images.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.86, 0.72, 0.56, 0.4]) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', quality))
      if (blob?.type === 'image/webp' && blob.size > 0 && blob.size <= caps.final_max_bytes) return blob
      // Safari may decode WebP but only encode PNG. The existing finalize API
      // accepts this resized, metadata-free staging image and publishes WebP.
      if (blob?.type === 'image/png' && blob.size > 0 && blob.size <= caps.source_max_bytes) return blob
    }
    throw new Error('The image is too large after processing. Choose a smaller image.')
  } finally { URL.revokeObjectURL(sourceUrl) }
}

export function putNotificationImage(url: string, headers: Record<string, string>, blob: Blob, signal: AbortSignal, progress: (value: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const handleAbort = () => xhr.abort()
    const finish = (error?: Error) => { signal.removeEventListener('abort', handleAbort); error ? reject(error) : resolve() }
    xhr.open('PUT', url)
    xhr.timeout = 30_000
    // Signed storage requests are anonymous; session/merchant tokens never leave the API origin.
    xhr.withCredentials = false
    for (const [key, value] of Object.entries(headers)) {
      if (['authorization', 'cookie', 'host', 'content-length'].includes(key.toLowerCase())) {
        if (key.toLowerCase() === 'content-length') continue // Browser supplies the actual Blob length.
        finish(new Error('The upload headers are invalid.')); return
      }
      xhr.setRequestHeader(key, value)
    }
    xhr.upload.onprogress = event => { if (event.lengthComputable) progress(Math.round(event.loaded / event.total * 100)) }
    xhr.onload = () => finish(xhr.status >= 200 && xhr.status < 300 ? undefined : new Error('Image upload failed. Retry or remove the image.'))
    xhr.onerror = xhr.ontimeout = () => finish(new Error('Image upload did not finish. Retry or remove the image.'))
    xhr.onabort = () => finish(new Error('Image upload cancelled.'))
    signal.addEventListener('abort', handleAbort, { once: true })
    if (signal.aborted) { finish(new Error('Image upload cancelled.')); return }
    xhr.send(blob)
  })
}

interface MediaFinal { data: { asset_id: string; media_url: string; content_type: string; size_bytes: number; width: number; height: number } }
export function finalizedMediaUrl(response: MediaFinal, caps: NotificationCapabilities): string {
  const asset = response?.data
  if (!asset || !asset.asset_id || !safeNotificationUrl(asset.media_url) || asset.content_type !== 'image/webp' || !positive(asset.size_bytes) || asset.size_bytes > caps.final_max_bytes ||
    !positive(asset.width) || !positive(asset.height) || Math.max(asset.width, asset.height) > caps.max_dimension) throw new Error('The finalized image is invalid. Try a new upload.')
  return asset.media_url
}
export async function uploadNotificationMedia(request: AuthenticatedRequest, blob: Blob, caps: NotificationCapabilities, signal: AbortSignal, progress: (value: number) => void): Promise<string> {
  const response = await request<{ data: { asset_id: string; method: string; upload_url: string; headers: Record<string, string> } }>(`${NOTIFICATION_PATH}/media/presign`, {
    method: 'POST', body: JSON.stringify({ content_type: blob.type, size_bytes: blob.size }), signal,
  })
  const upload = response?.data
  if (!upload || !upload.asset_id || upload.method !== 'PUT' || !safeNotificationUrl(upload.upload_url, 16384) || !upload.headers || Object.values(upload.headers).some(value => typeof value !== 'string')) throw new Error('Image upload could not be prepared. Try again.')
  await putNotificationImage(upload.upload_url, upload.headers, blob, signal, progress)
  const finalized = await request<MediaFinal>(`${NOTIFICATION_PATH}/media/finalize`, { method: 'POST', body: JSON.stringify({ asset_id: upload.asset_id }), signal })
  return finalizedMediaUrl(finalized, caps)
}
export async function importYouTubeMedia(request: AuthenticatedRequest, youtubeUrl: string, caps: NotificationCapabilities, signal: AbortSignal): Promise<string> {
  return finalizedMediaUrl(await request<MediaFinal>(`${NOTIFICATION_PATH}/media/youtube`, { method: 'POST', body: JSON.stringify({ youtube_url: youtubeUrl }), signal }), caps)
}
