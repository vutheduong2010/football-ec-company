import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockPlayers } from '../data/mockData'
import { DrawPage } from './DrawPage'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAdmin: true,
    isLoading: false,
    isConfigured: true,
  }),
}))

vi.mock('../hooks/usePlayers', () => ({
  usePlayers: () => ({
    players: mockPlayers,
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
}))

describe('DrawPage', () => {
  beforeEach(() => localStorage.clear())

  it('tạo preview và điều khiển vòng quay mà không thay đổi phương án', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <DrawPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Xem trước chia đội' }))

    expect(await screen.findByText('Đội hình đã được cố định')).toBeInTheDocument()
    expect(screen.getByText('Điểm cân bằng')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Đội A' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Đội B' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Bắt đầu quay tự động' }))
    await user.click(screen.getByRole('button', { name: 'Tạm dừng' }))
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Bỏ qua hoạt ảnh' }))
    expect(screen.getByText('Đã reveal đủ 14 người')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xác nhận và công bố' })).toBeEnabled()
    expect(screen.getByRole('progressbar', { name: 'Tiến độ vòng quay' })).toHaveAttribute(
      'aria-valuenow',
      '14',
    )

    await user.click(screen.getByRole('button', { name: 'Đặt lại vòng quay' }))
    expect(screen.getByRole('button', { name: 'Bắt đầu quay tự động' })).toBeInTheDocument()
  })
})
