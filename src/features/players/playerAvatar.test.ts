import { describe, expect, it } from 'vitest'

import {
  avatarFileExtension,
  calculateAvatarDimensions,
  MAX_AVATAR_FILE_SIZE,
  validateAvatarFile,
} from './playerAvatar'

describe('playerAvatar', () => {
  it('chấp nhận JPG, PNG và WebP trong giới hạn 5 MB', () => {
    expect(
      validateAvatarFile(new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })),
    ).toBeNull()
    expect(validateAvatarFile(new File(['avatar'], 'avatar.png', { type: 'image/png' }))).toBeNull()
    expect(
      validateAvatarFile(new File(['avatar'], 'avatar.webp', { type: 'image/webp' })),
    ).toBeNull()
  })

  it('từ chối sai định dạng hoặc vượt giới hạn', () => {
    expect(validateAvatarFile(new File(['avatar'], 'avatar.gif', { type: 'image/gif' }))).toMatch(
      /JPG/,
    )
    expect(
      validateAvatarFile(
        new File([new Uint8Array(MAX_AVATAR_FILE_SIZE + 1)], 'large.png', { type: 'image/png' }),
      ),
    ).toMatch(/5 MB/)
  })

  it('chuẩn hóa phần mở rộng theo MIME type', () => {
    expect(avatarFileExtension(new File([], 'photo.jpeg', { type: 'image/jpeg' }))).toBe('jpg')
    expect(avatarFileExtension(new File([], 'photo.png', { type: 'image/png' }))).toBe('png')
    expect(avatarFileExtension(new File([], 'photo.webp', { type: 'image/webp' }))).toBe('webp')
  })

  it('thu nhỏ đúng tỉ lệ trong khung 512 px và không phóng lớn ảnh nhỏ', () => {
    expect(calculateAvatarDimensions(2000, 1000)).toEqual({ width: 512, height: 256 })
    expect(calculateAvatarDimensions(800, 1200)).toEqual({ width: 341, height: 512 })
    expect(calculateAvatarDimensions(240, 160)).toEqual({ width: 240, height: 160 })
  })
})
