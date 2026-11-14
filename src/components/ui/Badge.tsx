import type { ReactNode } from 'react'

type BadgeTone = 'green' | 'blue' | 'orange' | 'slate' | 'red'

const toneClasses: Record<BadgeTone, string> = {
  green: 'border-brand-400/20 bg-brand-400/10 text-brand-300',
  blue: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
  orange: 'border-orange-400/20 bg-orange-400/10 text-orange-300',
  slate: 'border-white/10 bg-white/5 text-slate-300',
  red: 'border-red-400/20 bg-red-400/10 text-red-300',
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}
