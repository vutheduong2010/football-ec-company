import { forwardRef } from 'react'

import { TEAM_LABELS, formatMatchDate } from '../../features/draw/drawFormat'
import { getPlayerDisplayName } from '../../features/players/playerDisplay'
import type { PublishedDraw } from '../../types/draw'

const TEAM_ACCENTS = [
  { border: '#22c55e', soft: '#0d2d20', text: '#86efac' },
  { border: '#60a5fa', soft: '#102640', text: '#93c5fd' },
  { border: '#fb923c', soft: '#35200f', text: '#fdba74' },
] as const

export const ExportResultCard = forwardRef<HTMLDivElement, { draw: PublishedDraw }>(
  function ExportResultCard({ draw }, ref) {
    return (
      <div
        ref={ref}
        style={{ width: 720, background: '#070d17', color: '#f8fafc' }}
        className="overflow-hidden rounded-[28px] border border-white/10 p-8 font-sans"
      >
        <div className="rounded-[22px] border border-white/10 bg-[#111c2e] p-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6ee7a0]">
            Football EC Company
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{draw.title}</h1>
          <div className="mt-3 flex items-center justify-between text-sm font-bold text-slate-400">
            <span>{formatMatchDate(draw.matchDate)} • Sân 7</span>
            <span>{draw.assignments.length} cầu thủ</span>
          </div>
        </div>

        <div className={`mt-5 grid gap-4 ${draw.teamCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {draw.teams.map((team) => {
            const accent = TEAM_ACCENTS[team.teamIndex]
            const startingSet = new Set(team.startingPlayerIds)
            return (
              <div
                key={team.teamIndex}
                className="overflow-hidden rounded-[20px] border bg-[#111c2e]"
                style={{ borderColor: `${accent.border}55` }}
              >
                <div
                  className="flex items-center justify-between border-b px-5 py-4"
                  style={{ borderColor: `${accent.border}33`, background: accent.soft }}
                >
                  <span className="text-lg font-black" style={{ color: accent.text }}>
                    Đội {TEAM_LABELS[team.teamIndex]}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {team.players.length} người
                  </span>
                </div>
                <div className="p-3">
                  {team.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2 border-b border-white/6 px-2 py-2.5 last:border-0"
                    >
                      <span
                        className="grid size-7 shrink-0 place-items-center rounded-lg text-[10px] font-black"
                        style={{ background: accent.soft, color: accent.text }}
                      >
                        {player.primaryPosition}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-100">
                        {getPlayerDisplayName(player)}
                      </span>
                      {!startingSet.has(player.id) && (
                        <span className="text-[9px] font-black uppercase text-orange-300">
                          Dự bị
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3">
          {[
            ['Cân bằng', `${draw.qualityMetrics.qualityScore}%`],
            ['Quân số', draw.qualityMetrics.sizeRange === 0 ? 'Cân tuyệt đối' : 'Lệch 1'],
            ['Hạt giống', `Lệch ${draw.qualityMetrics.maxSeedRange}`],
            ['Thủ môn', `Lệch ${draw.qualityMetrics.goalkeeperRange}`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/8 bg-white/4 p-3 text-center"
            >
              <p className="text-sm font-black text-white">{value}</p>
              <p className="mt-1 text-[10px] font-bold text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
          Chia ngẫu nhiên trong các phương án cân bằng • {draw.algorithmVersion}
        </p>
      </div>
    )
  },
)
