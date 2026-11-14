import { LockKeyhole, LogOut, Menu, ShieldCheck } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { navigation } from './navigation'

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    'group flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-brand-400/12 text-brand-300 ring-1 ring-inset ring-brand-400/20'
      : 'text-slate-400 hover:bg-white/5 hover:text-white',
  ].join(' ')

export function AppShell() {
  const { isAdmin, user, signOut } = useAuth()

  return (
    <div className="min-h-dvh bg-ink-950 text-slate-50">
      <div className="pointer-events-none fixed inset-0 bg-app-glow" aria-hidden="true" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/7 bg-ink-950/90 px-5 py-6 backdrop-blur-xl lg:flex lg:flex-col">
        <NavLink to="/" className="flex items-center gap-3 rounded-xl focus-ring">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-400 text-ink-950 shadow-glow">
            <img src={`${import.meta.env.BASE_URL}football.svg`} alt="" className="size-8" />
          </span>
          <span>
            <span className="block text-sm font-extrabold tracking-tight">Football EC</span>
            <span className="block text-xs text-slate-500">Company dashboard</span>
          </span>
        </NavLink>

        <div className="mt-8 rounded-2xl border border-brand-400/15 bg-brand-400/6 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-300">
            <ShieldCheck className="size-4" />
            Sân 7 nội bộ
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Chia ngẫu nhiên trong các phương án cân bằng.
          </p>
        </div>

        <nav className="mt-6 space-y-1" aria-label="Điều hướng chính">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navClass}>
                <Icon className="size-5 transition-transform group-hover:scale-105" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-white/7 pt-5">
          {isAdmin ? (
            <div className="rounded-xl border border-brand-400/15 bg-brand-400/6 p-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-brand-300">
                <ShieldCheck className="size-4" /> Admin đã xác thực
              </div>
              <p className="mt-1 truncate text-[11px] text-slate-500">{user?.email}</p>
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-2 flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-xs font-bold text-slate-400 transition hover:bg-white/6 hover:text-white focus-ring"
              >
                <LogOut className="size-4" /> Đăng xuất
              </button>
            </div>
          ) : (
            <NavLink
              to="/admin/login"
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-slate-500 transition hover:bg-white/5 hover:text-slate-200 focus-ring"
            >
              <LockKeyhole className="size-4" />
              Khu vực quản trị
            </NavLink>
          )}
          <p className="mt-4 px-3 text-[11px] leading-5 text-slate-600">
            Supabase + chia đội cân bằng • Production
          </p>
        </div>
      </aside>

      <div className="relative lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/7 bg-ink-950/80 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
          <NavLink to="/" className="flex items-center gap-2.5 rounded-lg focus-ring">
            <img
              src={`${import.meta.env.BASE_URL}football.svg`}
              alt=""
              className="size-9 rounded-lg"
            />
            <span className="text-sm font-extrabold tracking-tight">Football EC</span>
          </NavLink>
          <NavLink
            to="/admin/login"
            aria-label={isAdmin ? 'Quản lý phiên admin' : 'Đăng nhập quản trị'}
            className={`grid size-11 place-items-center rounded-xl border transition focus-ring ${isAdmin ? 'border-brand-400/25 bg-brand-400/10 text-brand-300' : 'border-white/8 bg-white/4 text-slate-400 hover:text-white'}`}
          >
            {isAdmin ? <ShieldCheck className="size-5" /> : <Menu className="size-5" />}
          </NavLink>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:px-8 lg:pb-10 lg:pt-8">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-ink-950/92 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
        aria-label="Điều hướng di động"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition focus-ring ${
                    isActive
                      ? 'bg-brand-400/12 text-brand-300'
                      : 'text-slate-500 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="size-5" />
                {item.shortLabel}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
