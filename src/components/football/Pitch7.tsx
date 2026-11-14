import type { Player } from '../../types/player'

const positions = [
  { left: '50%', top: '86%' },
  { left: '24%', top: '67%' },
  { left: '50%', top: '70%' },
  { left: '76%', top: '67%' },
  { left: '30%', top: '39%' },
  { left: '70%', top: '39%' },
  { left: '50%', top: '14%' },
]

function arrangeLineup(players: Player[]) {
  const ordered: Player[] = []
  const used = new Set<string>()
  const take = (group: Player['positionGroup'], amount: number) => {
    for (const player of players) {
      if (ordered.filter((item) => item.positionGroup === group).length >= amount) break
      if (!used.has(player.id) && player.positionGroup === group) {
        ordered.push(player)
        used.add(player.id)
      }
    }
  }

  take('GK', 1)
  take('DEF', 3)
  take('MID', 2)
  take('ATT', 1)
  for (const player of players) {
    if (ordered.length >= 7) break
    if (!used.has(player.id)) ordered.push(player)
  }
  return ordered
}

export function Pitch7({ players, team }: { players: Player[]; team: 'A' | 'B' | 'C' }) {
  const accent = team === 'A' ? 'bg-brand-400' : team === 'B' ? 'bg-blue-400' : 'bg-orange-400'
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
      {lineup.slice(0, 7).map((player, index) => (
        <div
          key={player.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
          style={positions[index]}
        >
          <span
            className={`mx-auto grid size-9 place-items-center rounded-full ${accent} text-xs font-black text-ink-950 shadow-lg ring-4 ring-ink-950/45`}
          >
            {player.id.slice(-2)}
          </span>
          <span className="mt-1 block rounded-md bg-ink-950/75 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
            {player.primaryPosition}
          </span>
        </div>
      ))}
    </div>
  )
}
