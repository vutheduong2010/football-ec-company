import { arrangeLineup } from '../../algorithms/arrangeLineup'
import { getPlayerDisplayName } from '../../features/players/playerDisplay'
import type { Player } from '../../types/player'
import { PlayerAvatar } from './PlayerAvatar'

export function Pitch7({ players, team }: { players: readonly Player[]; team: 'A' | 'B' | 'C' }) {
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
      {lineup.map(({ player, slot, preference }) => (
        <div
          key={player.id}
          className="absolute w-20 -translate-x-1/2 -translate-y-1/2 text-center"
          style={{ left: slot.left, top: slot.top }}
          title={`${getPlayerDisplayName(player)} — ${slot.position} (${preference === 'primary' ? 'vị trí chính' : preference === 'secondary' ? 'vị trí phụ' : 'xếp linh hoạt'})`}
          data-position-preference={preference}
        >
          <PlayerAvatar className={`mx-auto size-9 rounded-full shadow-lg ring-4 ${accent}`} />
          <span className="mt-1 block truncate rounded-md bg-ink-950/80 px-1.5 py-0.5 text-[9px] font-black text-white backdrop-blur-sm">
            {getPlayerDisplayName(player)}
          </span>
          <span
            className={`mt-0.5 inline-flex rounded px-1 py-0.5 text-[8px] font-black ${
              preference === 'primary'
                ? 'bg-brand-400/15 text-brand-200'
                : preference === 'secondary'
                  ? 'bg-blue-400/15 text-blue-200'
                  : 'bg-white/8 text-white/55'
            }`}
          >
            {slot.position} ·{' '}
            {preference === 'primary'
              ? 'VT chính'
              : preference === 'secondary'
                ? 'VT phụ'
                : 'Linh hoạt'}
          </span>
        </div>
      ))}
    </div>
  )
}
