import type { Player } from '../../types/player'
import { getPlayerDisplayName } from '../../features/players/playerDisplay'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { PlayerAvatar } from './PlayerAvatar'

const teamStyles = {
  A: { tone: 'green' as const, dot: 'bg-brand-400', border: 'border-brand-400/20' },
  B: { tone: 'blue' as const, dot: 'bg-blue-400', border: 'border-blue-400/20' },
  C: { tone: 'orange' as const, dot: 'bg-orange-400', border: 'border-orange-400/20' },
}

export function TeamPanel({
  team,
  players,
  compact = false,
  startingPlayerIds,
  enablePlayerSwap = false,
  draggedPlayerId,
  dropTargetPlayerId,
  emptyMessage = 'Chưa có cầu thủ được hiển thị.',
}: {
  team: 'A' | 'B' | 'C'
  players: Player[]
  compact?: boolean
  startingPlayerIds?: readonly string[]
  enablePlayerSwap?: boolean
  draggedPlayerId?: string | null
  dropTargetPlayerId?: string | null
  emptyMessage?: string
}) {
  const style = teamStyles[team]
  const seedOne = players.filter((player) => player.seed === 1).length
  const seedTwo = players.filter((player) => player.seed === 2).length
  const seedThree = players.filter((player) => player.seed === 3).length
  const startingSet = new Set(startingPlayerIds)
  const reserveCount = startingPlayerIds ? players.length - startingPlayerIds.length : 0
  const orderedPlayers = startingPlayerIds
    ? [...players].sort((left, right) => {
        const startingRank = Number(!startingSet.has(left.id)) - Number(!startingSet.has(right.id))
        return startingRank || left.seed - right.seed
      })
    : players

  return (
    <Card className={`overflow-hidden ${style.border}`}>
      <div className="flex items-center justify-between border-b border-white/7 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className={`size-2.5 rounded-full ${style.dot}`} />
          <h3 className="text-sm font-black">Đội {team}</h3>
        </div>
        <Badge tone={style.tone}>{players.length} người</Badge>
      </div>
      <div className={`divide-y divide-white/6 ${compact ? '' : 'p-1'}`}>
        {players.length === 0 && (
          <div className="px-3 py-8 text-center text-[11px] font-bold text-slate-600">
            {emptyMessage}
          </div>
        )}
        {orderedPlayers.map((player) => (
          <div
            key={player.id}
            className={`flex items-center gap-3 px-3 py-2.5 transition ${
              dropTargetPlayerId === player.id ? 'bg-white/8 ring-1 ring-inset ring-white/25' : ''
            } ${draggedPlayerId === player.id ? 'opacity-55' : ''}`}
            data-lineup-drop-player-id={enablePlayerSwap ? player.id : undefined}
          >
            <span
              className={`inline-flex shrink-0 ${enablePlayerSwap ? 'touch-none cursor-grab select-none active:cursor-grabbing' : ''}`}
              data-lineup-drag-player-id={enablePlayerSwap ? player.id : undefined}
              title={
                enablePlayerSwap ? `Kéo ${getPlayerDisplayName(player)} để đổi vị trí` : undefined
              }
            >
              <PlayerAvatar className="size-8 rounded-lg ring-1 ring-white/10" />
            </span>
            <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-200">
              {getPlayerDisplayName(player)}
            </span>
            {startingPlayerIds && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${startingSet.has(player.id) ? 'bg-brand-400/10 text-brand-300' : 'bg-orange-400/10 text-orange-300'}`}
              >
                {startingSet.has(player.id) ? 'Chính' : 'Dự bị'}
              </span>
            )}
            <span className="text-[11px] font-bold text-slate-500">{player.primaryPosition}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 border-t border-white/7 bg-white/[0.02] px-4 py-3 text-[11px] font-bold text-slate-500">
        <span>H1: {seedOne}</span>
        <span>H2: {seedTwo}</span>
        <span>H3: {seedThree}</span>
        <span>GK: {players.filter((player) => player.positionGroup === 'GK').length}</span>
        {startingPlayerIds && reserveCount > 0 && <span>Dự bị: {reserveCount}</span>}
      </div>
    </Card>
  )
}
