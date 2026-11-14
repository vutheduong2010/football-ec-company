import type { Session } from '@supabase/supabase-js'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '../hooks/useAuth'
import { AuthProvider } from './AuthProvider'

const authMocks = vi.hoisted(() => ({
  listener: undefined as ((event: string, session: unknown) => void) | undefined,
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  rpc: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
}))

vi.mock('../lib/supabaseClient', () => {
  const client = {
    auth: {
      getSession: authMocks.getSession,
      onAuthStateChange: authMocks.onAuthStateChange,
      signInWithPassword: authMocks.signInWithPassword,
      signOut: authMocks.signOut,
    },
    rpc: authMocks.rpc,
  }

  return {
    isSupabaseConfigured: true,
    requireSupabase: () => client,
    supabase: client,
  }
})

const adminSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: { id: 'admin-user-id', email: 'admin@example.com' },
} as Session

function AuthHarness() {
  const { isAdmin, isLoading, signIn, signOut, user } = useAuth()

  return (
    <div>
      <p>{isLoading ? 'Đang tải' : isAdmin ? `Admin ${user?.email}` : 'Viewer'}</p>
      <button type="button" onClick={() => void signIn('admin@example.com', 'password')}>
        Đăng nhập test
      </button>
      <button type="button" onClick={() => void signOut()}>
        Đăng xuất test
      </button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.listener = undefined
    authMocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
    authMocks.onAuthStateChange.mockImplementation(
      (listener: (event: string, session: unknown) => void) => {
        authMocks.listener = listener
        return { data: { subscription: { unsubscribe: authMocks.unsubscribe } } }
      },
    )
    authMocks.rpc.mockResolvedValue({ data: true, error: null })
    authMocks.signInWithPassword.mockResolvedValue({
      data: { session: adminSession, user: adminSession.user },
      error: null,
    })
    authMocks.signOut.mockResolvedValue({ error: null })
  })

  it('đăng nhập admin và xóa phiên khi đăng xuất', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    )

    await screen.findByText('Viewer')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập test' }))
    await screen.findByText('Admin admin@example.com')

    await user.click(screen.getByRole('button', { name: 'Đăng xuất test' }))
    await screen.findByText('Viewer')
    expect(authMocks.signOut).toHaveBeenCalledTimes(1)
  })

  it('hạ quyền ngay khi Supabase báo phiên đã hết hạn', async () => {
    authMocks.getSession.mockResolvedValue({ data: { session: adminSession }, error: null })
    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    )

    await screen.findByText('Admin admin@example.com')
    act(() => authMocks.listener?.('SIGNED_OUT', null))

    await screen.findByText('Viewer')
  })

  it('về chế độ viewer an toàn khi Supabase không thể khôi phục session', async () => {
    authMocks.getSession.mockRejectedValue(new TypeError('Failed to fetch'))
    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('Viewer')).toBeVisible())
    expect(screen.queryByText(/Admin/)).not.toBeInTheDocument()
  })
})
