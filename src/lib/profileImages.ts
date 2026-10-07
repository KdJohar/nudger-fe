import { getNudgerConfig } from '../config'

export interface ConvertedProfileImage {
  blob: Blob
  previewUrl: string
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export async function convertProfileImage(file: File): Promise<ConvertedProfileImage> {
  const config = getNudgerConfig()
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file to continue.')
  if (file.size > config.profileImageSourceMaxBytes) throw new Error(`Image must be smaller than ${formatBytes(config.profileImageSourceMaxBytes)}.`)

  const sourceUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('That image could not be read.'))
      element.src = sourceUrl
    })
    const scale = Math.min(1, config.profileImageMaxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Your browser cannot process this image.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error('The image could not be prepared.')), 'image/webp', config.profileImageWebpQuality)
    })
    if (blob.size > config.profileImageFinalMaxBytes) throw new Error(`Processed image must be smaller than ${formatBytes(config.profileImageFinalMaxBytes)}.`)
    return { blob, previewUrl: URL.createObjectURL(blob) }
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

export function uploadProfileImage(uploadUrl: string, blob: Blob, onProgress?: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', 'image/webp')
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Image upload failed.'))
    xhr.onerror = () => reject(new Error('Image upload failed.'))
    xhr.send(blob)
  })
}
