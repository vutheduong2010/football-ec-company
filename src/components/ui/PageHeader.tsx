import type { ReactNode } from 'react'

import { Badge } from './Badge'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="mb-3">
            <Badge tone="green">{eyebrow}</Badge>
          </div>
        )}
        <h1 className="text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">{description}</p>
      </div>
      {action}
    </header>
  )
}
