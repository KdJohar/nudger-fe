import { getNudgerConfig } from '../config'

export class ProfileImageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProfileImageError'
  }
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new ProfileImageError('This image could not be read. Please choose another file.'))
    }
    image.src = objectUrl
  })
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new ProfileImageError('Your browser could not convert this image to WebP.'))
        return
      }
      resolve(blob)
    }, 'image/webp', quality)
  })
}

export async function convertProfileImage(file: File): Promise<Blob> {
  const config = getNudgerConfig()
  if (!file.type.startsWith('image/')) {
    throw new ProfileImageError('Choose an image file to use as your profile picture.')
  }
  if (file.size > config.profileImageSourceMaxBytes) {
    throw new ProfileImageError(`The source image must be ${formatBytes(config.profileImageSourceMaxBytes)} or smaller.`)
  }

  const image = await loadImage(file)
  if (!image.naturalWidth || !image.naturalHeight) {
    throw new ProfileImageError('This image has no usable dimensions.')
  }

  const scale = Math.min(1, config.profileImageMaxDimension / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) {
    throw new ProfileImageError('Your browser could not prepare this image.')
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const webp = await canvasToWebp(canvas, config.profileImageWebpQuality)
  if (webp.size > config.profileImageFinalMaxBytes) {
    throw new ProfileImageError(`The converted image must be ${formatBytes(config.profileImageFinalMaxBytes)} or smaller.`)
  }
  return webp
}

export function uploadProfileImage(
  uploadUrl: string,
  blob: Blob,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', uploadUrl)
    request.setRequestHeader('Content-Type', 'image/webp')
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
      }
    })
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100)
        resolve()
        return
      }
      reject(new ProfileImageError('The profile image upload could not be completed. Please try again.'))
    })
    request.addEventListener('error', () => reject(new ProfileImageError('The profile image upload could not be completed. Please try again.')))
    request.addEventListener('abort', () => reject(new ProfileImageError('The profile image upload was cancelled.')))
    request.send(blob)
  })
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`
  }
  return `${Math.round(bytes / 1024)} KB`
}
