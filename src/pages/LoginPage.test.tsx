import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginPage } from './LoginPage'

const authMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAdmin: false,
    isConfigured: true,
    isLoading: false,
    user: null,
    signIn: authMocks.signIn,
    signOut: authMocks.signOut,
  }),
}))

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hiển thị thông báo tiếng Việt khi lỗi mạng', async () => {
    const user = userEvent.setup()
    authMocks.signIn.mockRejectedValue(new TypeError('Failed to fetch'))
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Email quản trị'), 'admin@example.com')
    await user.type(screen.getByLabelText('Mật khẩu'), 'password')
    await user.click(screen.getByRole('button', { name: /Đăng nhập an toàn/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể kết nối Supabase. Hãy kiểm tra mạng và thử lại.',
    )
  })

  it('giải thích rõ khi project Supabase bị tạm dừng', async () => {
    const user = userEvent.setup()
    authMocks.signIn.mockRejectedValue(new Error('Project is paused'))
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Email quản trị'), 'admin@example.com')
    await user.type(screen.getByLabelText('Mật khẩu'), 'password')
    await user.click(screen.getByRole('button', { name: /Đăng nhập an toàn/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Supabase đang tạm dừng. Hãy mở project trong Dashboard rồi thử lại.',
    )
  })
})
