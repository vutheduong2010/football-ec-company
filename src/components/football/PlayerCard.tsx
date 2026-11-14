import { Check, Circle } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Player } from '../../types/player'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

export function PlayerCard({
  player,
  selected,
  onToggle,
  actions,
}: {
  player: Player
  selected?: boolean
  onToggle?: () => void
  actions?: ReactNode
}) {
  const card = (
    <Card
      className={`flex min-h-20 items-center gap-3 p-3.5 transition ${!player.isActive ? 'opacity-60' : ''} ${selected ? 'border-brand-400/30 bg-brand-400/8' : 'hover:border-white/14'}`}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 text-sm font-black text-white ring-1 ring-white/10">
        {player.id.slice(-2)}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-extrabold text-white">{player.name}</span>
          <Badge tone={player.seed === 1 ? 'green' : 'slate'}>H{player.seed}</Badge>
          {!player.isActive && <Badge tone="red">Đã ẩn</Badge>}
        </span>
        <span className="mt-1 block truncate text-xs text-slate-500">
          {player.nickname} • {player.primaryPosition}
          {player.secondaryPositions.length > 0
            ? ` / ${player.secondaryPositions.join(' / ')}`
            : ''}
        </span>
      </span>
      {onToggle && (
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-full border ${selected ? 'border-brand-400 bg-brand-400 text-ink-950' : 'border-white/15 text-transparent'}`}
        >
          {selected ? <Check className="size-4" strokeWidth={3} /> : <Circle className="size-3" />}
        </span>
      )}
      {actions}
    </Card>
  )

  if (!onToggle) return card

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full rounded-2xl focus-ring"
      aria-pressed={selected}
    >
      {card}
    </button>
  )
}
