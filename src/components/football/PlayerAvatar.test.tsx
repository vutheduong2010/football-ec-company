import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PlayerAvatar } from './PlayerAvatar'

describe('PlayerAvatar', () => {
  it('dùng ảnh mặc định khi chưa có ảnh riêng', () => {
    render(<PlayerAvatar alt="Avatar cầu thủ" />)
    expect(screen.getByRole('img', { name: 'Avatar cầu thủ' }).getAttribute('src')).toMatch(
      /\/default-avatar\.svg$/,
    )
  })

  it('fallback về ảnh mặc định nếu ảnh riêng bị lỗi', () => {
    render(<PlayerAvatar src="https://example.com/avatar.jpg" alt="Avatar cầu thủ" />)
    const image = screen.getByRole('img', { name: 'Avatar cầu thủ' })
    fireEvent.error(image)
    expect(image.getAttribute('src')).toMatch(/\/default-avatar\.svg$/)
  })
})
