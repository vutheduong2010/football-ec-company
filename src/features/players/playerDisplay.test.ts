import { describe, expect, it } from 'vitest'

import { getPlayerDisplayName } from './playerDisplay'

describe('playerDisplay', () => {
  it('ưu tiên biệt danh và dùng tên khi biệt danh rỗng', () => {
    expect(getPlayerDisplayName({ name: 'Nguyễn Văn A', nickname: '  Tí  ' })).toBe('Tí')
    expect(getPlayerDisplayName({ name: ' Nguyễn Văn A ', nickname: '   ' })).toBe('Nguyễn Văn A')
  })
})
