import { ArrowLeft, Eye, EyeOff, LockKeyhole, LogOut, Mail, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonStyles'
import { Card } from '../components/ui/Card'
import { Notice } from '../components/ui/Notice'
import { useAuth } from '../hooks/useAuth'

function friendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  const normalizedMessage = message.toLocaleLowerCase()
  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Email hoặc mật khẩu không đúng.'
  }
  if (normalizedMessage.includes('email not confirmed')) {
    return 'Email admin chưa được xác nhận trong Supabase.'
  }
  if (normalizedMessage.includes('project is paused')) {
    return 'Supabase đang tạm dừng. Hãy mở project trong Dashboard rồi thử lại.'
  }
  if (
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('network') ||
    normalizedMessage.includes('fetch failed')
  ) {
    return 'Không thể kết nối Supabase. Hãy kiểm tra mạng và thử lại.'
  }
  return message || 'Không thể đăng nhập. Vui lòng thử lại.'
}

export function LoginPage() {
  const navigate = useNavigate()
  const { isAdmin, isConfigured, isLoading: authLoading, user, signIn, signOut } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Nhập đầy đủ email và mật khẩu admin.')
      return
    }

    setIsSubmitting(true)
    try {
      await signIn(email.trim(), password)
      navigate('/players', { replace: true })
    } catch (signInError) {
      setError(friendlyAuthError(signInError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setError(null)
    try {
      await signOut()
    } catch (signOutError) {
      setError(friendlyAuthError(signOutError))
    }
  }

  return (
    <div className="mx-auto max-w-md py-4 sm:py-10">
      <Link to="/" className={buttonClass('ghost', 'mb-5 -ml-2 px-2')}>
        <ArrowLeft className="size-4" /> Về trang chủ
      </Link>

      <Card className="overflow-hidden">
        <div className="border-b border-white/7 bg-brand-400/[0.035] px-5 py-6 text-center sm:px-7 sm:py-8">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-400/10 text-brand-300 ring-1 ring-brand-400/20">
            <LockKeyhole className="size-6" />
          </span>
          <div className="mt-4">
            <Badge tone="green">Khu vực riêng tư</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-white">Đăng nhập quản trị</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
            Chỉ tài khoản đã có trong bảng allow-list `app_admins` mới được giữ phiên đăng nhập.
          </p>
        </div>

        {isAdmin ? (
          <div className="p-5 text-center sm:p-7">
            <Notice tone="success">Đã xác thực admin: {user?.email}</Notice>
            {error && (
              <div className="mt-3">
                <Notice tone="error">{error}</Notice>
              </div>
            )}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link to="/draw" className={buttonClass('primary')}>
                Đi tới chia đội
              </Link>
              <Button variant="secondary" onClick={() => void handleSignOut()}>
                <LogOut className="size-4" /> Đăng xuất
              </Button>
            </div>
          </div>
        ) : (
          <form className="space-y-4 p-5 sm:p-7" onSubmit={handleSubmit}>
            {!isConfigured && (
              <Notice tone="warning">
                Chưa có `.env.local`. Hãy cấu hình Supabase URL và publishable/anon key trước khi
                đăng nhập.
              </Notice>
            )}
            {error && <Notice tone="error">{error}</Notice>}

            <label className="block">
              <span className="mb-2 block text-xs font-extrabold text-slate-300">
                Email quản trị
              </span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="username"
                  placeholder="admin@example.com"
                  disabled={!isConfigured || isSubmitting || authLoading}
                  className="min-h-12 w-full rounded-xl border border-white/9 bg-ink-950/60 px-4 pl-10 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-brand-400/50 focus:ring-4 focus:ring-brand-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-extrabold text-slate-300">Mật khẩu</span>
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  disabled={!isConfigured || isSubmitting || authLoading}
                  className="min-h-12 w-full rounded-xl border border-white/9 bg-ink-950/60 px-10 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-brand-400/50 focus:ring-4 focus:ring-brand-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={!isConfigured}
                  className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white focus-ring disabled:opacity-40"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>

            <Button
              type="submit"
              className="w-full"
              disabled={!isConfigured || isSubmitting || authLoading}
            >
              <ShieldCheck className="size-4" />{' '}
              {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập an toàn'}
            </Button>
            <p className="text-center text-[11px] leading-5 text-slate-600">
              Không có signup công khai. Session được SDK Supabase quản lý và xóa khi đăng xuất.
            </p>
          </form>
        )}
      </Card>
    </div>
  )
}
