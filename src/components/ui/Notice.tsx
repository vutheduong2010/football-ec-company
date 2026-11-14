import { AlertTriangle, CheckCircle2, Info, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'

type NoticeTone = 'info' | 'success' | 'warning' | 'error'

const toneStyles = {
  info: { icon: Info, className: 'border-blue-400/20 bg-blue-400/8 text-blue-200' },
  success: { icon: CheckCircle2, className: 'border-brand-400/20 bg-brand-400/8 text-brand-200' },
  warning: {
    icon: AlertTriangle,
    className: 'border-orange-400/20 bg-orange-400/8 text-orange-200',
  },
  error: { icon: WifiOff, className: 'border-red-400/20 bg-red-400/8 text-red-200' },
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: NoticeTone }) {
  const style = toneStyles[tone]
  const Icon = style.icon
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs leading-5 ${style.className}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
