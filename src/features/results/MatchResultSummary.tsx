import { Medal } from 'lucide-react'

import type { PublishedDraw } from '../../types/draw'

const rankingLabels = ['1ST', '2ND', '3RD'] as const

function outcomeFor(scores: [number, number], teamIndex: number) {
  if (scores[0] === scores[1]) return { label: 'D', className: 'bg-slate-500/15 text-slate-300' }
  const won = teamIndex === (scores[0] > scores[1] ? 0 : 1)
  return won
    ? { label: 'W', className: 'bg-brand-400/15 text-brand-300' }
    : { label: 'L', className: 'bg-red-400/15 text-red-300' }
}

export function MatchResultSummary({ draw }: { draw: PublishedDraw }) {
  if (draw.teamCount === 2) {
    if (!draw.teamScores) {
      return <p className="text-sm font-bold text-slate-500">Chưa nhập tỉ số</p>
    }

    return (
      <div
        className="flex items-center gap-3"
        aria-label={`Tỉ số ${draw.teamScores[0]} - ${draw.teamScores[1]}`}
      >
        {[0, 1].map((teamIndex) => {
          const outcome = outcomeFor(draw.teamScores!, teamIndex)
          return (
            <div key={teamIndex} className="flex items-center gap-2">
              <div className="text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Đội {String.fromCharCode(65 + teamIndex)}
                </p>
                <p className="text-2xl font-black tabular-nums text-white">
                  {draw.teamScores![teamIndex]}
                </p>
              </div>
              <span
                className={`grid size-7 place-items-center rounded-lg text-xs font-black ${outcome.className}`}
                aria-label={
                  outcome.label === 'W' ? 'Thắng' : outcome.label === 'L' ? 'Thua' : 'Hòa'
                }
              >
                {outcome.label}
              </span>
              {teamIndex === 0 && <span className="text-lg font-black text-slate-700">–</span>}
            </div>
          )
        })}
      </div>
    )
  }

  if (!draw.teamRankings) {
    return <p className="text-sm font-bold text-slate-500">Chưa nhập BXH</p>
  }

  return (
    <div className="flex items-center gap-2" aria-label="Bảng xếp hạng ba đội">
      {draw.teamRankings.map((teamIndex, rankIndex) => (
        <div
          key={teamIndex}
          className="flex min-w-20 items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-2.5 py-2"
        >
          <Medal className={`size-4 ${rankIndex === 0 ? 'text-amber-300' : 'text-slate-500'}`} />
          <span>
            <span className="block text-[10px] font-black text-brand-300">
              {rankingLabels[rankIndex]}
            </span>
            <span className="block text-xs font-extrabold text-white">
              Đội {String.fromCharCode(65 + teamIndex)}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}
