import { supabase } from '../../lib/supabaseClient'

export const PLAYER_AVATAR_BUCKET = 'player-avatars'
export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024
export const MAX_OPTIMIZED_AVATAR_SIZE = 400 * 1024
export const AVATAR_MAX_DIMENSION = 512
export const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

const WEBP_QUALITIES = [0.82, 0.72, 0.62, 0.52]
const AVATAR_DIMENSIONS = [AVATAR_MAX_DIMENSION, 448, 384]

export function getPlayerAvatarUrl(path?: string | null) {
  if (!path || !supabase) return undefined
  return supabase.storage.from(PLAYER_AVATAR_BUCKET).getPublicUrl(path).data.publicUrl
}

export function validateAvatarFile(file: File) {
  if (!AVATAR_MIME_TYPES.includes(file.type as (typeof AVATAR_MIME_TYPES)[number])) {
    return 'Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.'
  }
  if (file.size > MAX_AVATAR_FILE_SIZE) return 'Ảnh đại diện phải nhỏ hơn hoặc bằng 5 MB.'
  return null
}

export function avatarFileExtension(file: File) {
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

export function calculateAvatarDimensions(
  width: number,
  height: number,
  maxDimension = AVATAR_MAX_DIMENSION,
) {
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function loadAvatarImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Không thể đọc ảnh đại diện. Vui lòng chọn ảnh khác.'))
    }
    image.src = objectUrl
  })
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Trình duyệt không thể tối ưu ảnh đại diện.'))
      },
      'image/webp',
      quality,
    )
  })
}

export async function optimizeAvatarFile(file: File) {
  const validationError = validateAvatarFile(file)
  if (validationError) throw new Error(validationError)

  const image = await loadAvatarImage(file)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Trình duyệt không hỗ trợ tối ưu ảnh đại diện.')

  let smallestBlob: Blob | null = null
  for (const maxDimension of AVATAR_DIMENSIONS) {
    const dimensions = calculateAvatarDimensions(
      image.naturalWidth,
      image.naturalHeight,
      maxDimension,
    )
    canvas.width = dimensions.width
    canvas.height = dimensions.height
    context.clearRect(0, 0, dimensions.width, dimensions.height)
    context.drawImage(image, 0, 0, dimensions.width, dimensions.height)

    for (const quality of WEBP_QUALITIES) {
      const blob = await canvasToWebp(canvas, quality)
      if (!smallestBlob || blob.size < smallestBlob.size) smallestBlob = blob
      if (blob.size <= MAX_OPTIMIZED_AVATAR_SIZE) {
        return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'avatar'}.webp`, {
          type: 'image/webp',
          lastModified: Date.now(),
        })
      }
    }
  }

  if (!smallestBlob) throw new Error('Không thể tối ưu ảnh đại diện.')
  return new File([smallestBlob], `${file.name.replace(/\.[^.]+$/, '') || 'avatar'}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}
