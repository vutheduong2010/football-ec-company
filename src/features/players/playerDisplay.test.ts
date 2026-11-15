import { describe, expect, it } from 'vitest'

import { getPlayerDisplayName, getPlayerInitials } from './playerDisplay'

describe('playerDisplay', () => {
  it('ưu tiên biệt danh và dùng tên khi biệt danh rỗng', () => {
    expect(getPlayerDisplayName({ name: 'Nguyễn Văn A', nickname: '  Tí  ' })).toBe('Tí')
    expect(getPlayerDisplayName({ name: ' Nguyễn Văn A ', nickname: '   ' })).toBe('Nguyễn Văn A')
  })

  it('tạo tối đa hai ký tự đại diện từ tên hiển thị', () => {
    expect(getPlayerInitials({ name: 'Nguyễn Văn A', nickname: undefined })).toBe('VA')
    expect(getPlayerInitials({ name: 'Nguyễn Văn A', nickname: 'Tí' })).toBe('T')
  })
})
