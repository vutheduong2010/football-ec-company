import type { HTMLAttributes, ReactNode } from 'react'

export function Card({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-white/8 bg-panel/88 shadow-card backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
