import { getPlayerDisplayName } from '../../features/players/playerDisplay'
import { POSITION_GROUPS, type Player, type Position } from '../../types/player'
import { PlayerAvatar } from './PlayerAvatar'

const FORMATION: Array<{ position: Position; left: string; top: string }> = [
  { position: 'GK', left: '50%', top: '87%' },
  { position: 'LB', left: '22%', top: '67%' },
  { position: 'CB', left: '50%', top: '72%' },
  { position: 'RB', left: '78%', top: '67%' },
  { position: 'CM', left: '32%', top: '40%' },
  { position: 'CM', left: '68%', top: '40%' },
  { position: 'ST', left: '50%', top: '14%' },
]

function arrangeLineup(players: Player[]) {
  const arranged: Array<{ player: Player; slot: (typeof FORMATION)[number] }> = []
  const used = new Set<string>()

  for (const slot of FORMATION) {
    const available = players.filter((player) => !used.has(player.id))
    const player =
      available.find((candidate) => candidate.primaryPosition === slot.position) ??
      available.find((candidate) => candidate.secondaryPositions.includes(slot.position)) ??
      available.find((candidate) => candidate.positionGroup === POSITION_GROUPS[slot.position]) ??
      available[0]

    if (player) {
      arranged.push({ player, slot })
      used.add(player.id)
    }
  }

  return arranged
}

export function Pitch7({ players, team }: { players: Player[]; team: 'A' | 'B' | 'C' }) {
  const accent =
    team === 'A' ? 'ring-brand-400' : team === 'B' ? 'ring-blue-400' : 'ring-orange-400'
  const lineup = arrangeLineup(players)

  return (
    <div
      className="pitch relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl border border-white/10"
      aria-label={`Sơ đồ sân 7 đội ${team}`}
    >
      <div className="absolute inset-x-[8%] top-1/2 border-t border-white/25" />
      <div className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
      <div className="absolute inset-x-[24%] top-0 h-[14%] rounded-b-xl border-x border-b border-white/25" />
      <div className="absolute inset-x-[24%] bottom-0 h-[14%] rounded-t-xl border-x border-t border-white/25" />
      {lineup.map(({ player, slot }) => (
        <div
          key={player.id}
          className="absolute w-20 -translate-x-1/2 -translate-y-1/2 text-center"
          style={{ left: slot.left, top: slot.top }}
          title={`${getPlayerDisplayName(player)} — ${player.primaryPosition}`}
        >
          <PlayerAvatar className={`mx-auto size-9 rounded-full shadow-lg ring-4 ${accent}`} />
          <span className="mt-1 block truncate rounded-md bg-ink-950/80 px-1.5 py-0.5 text-[9px] font-black text-white backdrop-blur-sm">
            {getPlayerDisplayName(player)}
          </span>
          <span className="mt-0.5 block text-[8px] font-black text-white/65">{slot.position}</span>
        </div>
      ))}
    </div>
  )
}
