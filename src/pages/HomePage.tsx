import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CircleGauge,
  Dices,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/Badge'
import { buttonClass } from '../components/ui/buttonStyles'
import { Card } from '../components/ui/Card'
import { mockPublishedDraw } from '../data/mockPublishedDraw'
import { TEAM_LABELS, formatMatchDate } from '../features/draw/drawFormat'
import { getPlayerDisplayName } from '../features/players/playerDisplay'
import { usePlayers } from '../hooks/usePlayers'
import { usePublishedDraws } from '../hooks/usePublishedDraws'

const TEAM_STYLES = [
  'border-brand-400/18 bg-brand-400/7 text-brand-300',
  'border-blue-400/18 bg-blue-400/7 text-blue-300',
  'border-orange-400/18 bg-orange-400/7 text-orange-300',
]

export function HomePage() {
  const { players } = usePlayers()
  const { draws, isLoading, isDemo } = usePublishedDraws()
  const latest = isDemo ? mockPublishedDraw : draws[0]
  const activePlayerCount = players.filter((player) => player.isActive).length
  const stats = [
    {
      label: 'Cầu thủ hoạt động',
      value: activePlayerCount,
      helper: isDemo ? 'Dữ liệu minh họa' : 'Đồng bộ Supabase',
      icon: Users,
      color: 'text-brand-300 bg-brand-400/10',
    },
    {
      label: 'Phiên gần nhất',
      value: latest?.assignments.length ?? 0,
      helper: latest ? `${latest.teamCount} đội` : 'Chưa công bố',
      icon: Dices,
      color: 'text-blue-300 bg-blue-400/10',
    },
    {
      label: 'Điểm cân bằng',
      value: latest ? `${latest.qualityMetrics.qualityScore}%` : '—',
      helper: latest ? 'Từ snapshot đã lưu' : 'Chưa có dữ liệu',
      icon: CircleGauge,
      color: 'text-orange-300 bg-orange-400/10',
    },
  ]

  return (
    <div>
      <section className="hero-grid relative overflow-hidden rounded-3xl border border-white/8 bg-panel px-5 py-7 shadow-card sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div
          className="absolute -right-20 -top-24 size-72 rounded-full bg-brand-400/12 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl">
          <Badge tone="green">
            <Sparkles className="size-3" /> {isDemo ? 'Dữ liệu mẫu' : 'Supabase đã kết nối'} •
            Production ready
          </Badge>
          <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
            Ra sân là phải <span className="text-brand-300">cân đội.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
            Chọn người có mặt, chia ngẫu nhiên trong các phương án cân bằng và công bố đội hình bằng
            vòng quay tự động.
          </p>
          <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row">
            <Link to="/draw" className={buttonClass('primary', 'w-full min-[420px]:w-auto')}>
              <Dices className="size-4" /> Chia đội ngay <ArrowRight className="size-4" />
            </Link>
            <Link
              to={latest ? `/results/${latest.id}` : '/results'}
              className={buttonClass('secondary', 'w-full min-[420px]:w-auto')}
            >
              {latest ? 'Xem đội hình mới nhất' : 'Xem lịch sử'}
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-4" aria-label="Thống kê nhanh">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="flex items-center gap-4 p-4 sm:block sm:p-5 xl:flex">
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${stat.color}`}>
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 sm:mt-3 xl:mt-0">
                <p className="text-2xl font-black tracking-tight text-white">
                  {isLoading ? '…' : stat.value}
                </p>
                <p className="text-xs font-bold text-slate-300">{stat.label}</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-600">{stat.helper}</p>
              </div>
            </Card>
          )
        })}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/7 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Kết quả gần nhất
              </p>
              <h2 className="mt-1 text-lg font-black text-white">
                {latest?.title ?? 'Chưa có phiên được công bố'}
              </h2>
            </div>
            {latest && <Badge tone="green">Đã công bố</Badge>}
          </div>

          {latest ? (
            <>
              <div
                className={`grid gap-4 p-5 sm:p-6 ${latest.teamCount === 3 ? 'lg:grid-cols-3' : 'sm:grid-cols-2'}`}
              >
                {latest.teams.map((team) => (
                  <div
                    key={team.teamIndex}
                    className={`rounded-2xl border p-4 ${TEAM_STYLES[team.teamIndex]}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black">Đội {TEAM_LABELS[team.teamIndex]}</span>
                      <span className="text-xs font-bold text-slate-500">
                        {team.players.length} người
                      </span>
                    </div>
                    <div className="mt-4 flex -space-x-2">
                      {team.players.slice(0, 5).map((player) => (
                        <span
                          key={player.id}
                          title={getPlayerDisplayName(player)}
                          className="grid size-9 place-items-center rounded-full border-2 border-panel bg-slate-700 text-[9px] font-black text-white"
                        >
                          {player.primaryPosition}
                        </span>
                      ))}
                      {team.players.length > 5 && (
                        <span className="grid size-9 place-items-center rounded-full border-2 border-panel bg-white/10 text-[10px] font-black text-white">
                          +{team.players.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to={`/results/${latest.id}`}
                className="flex min-h-12 items-center justify-between border-t border-white/7 px-5 text-sm font-extrabold text-slate-300 transition hover:bg-white/4 hover:text-white focus-ring sm:px-6"
              >
                Xem chi tiết đội hình
                <ChevronRight className="size-4" />
              </Link>
            </>
          ) : (
            <div className="p-8 text-center text-sm leading-6 text-slate-500">
              Hoàn tất vòng quay và publish để kết quả xuất hiện tại đây trên mọi thiết bị.
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-400/10 text-brand-300">
            <ShieldCheck className="size-5" />
          </span>
          <h2 className="mt-4 text-lg font-black text-white">Cân bằng có giải thích</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Metrics được tái tính từ snapshot của kết quả đã công bố, không phụ thuộc hồ sơ hiện
            tại.
          </p>
          {latest && (
            <div className="mt-5 space-y-3">
              {[
                ['Quân số', latest.qualityMetrics.sizeRange === 0 ? 'Cân tuyệt đối' : 'Lệch 1'],
                ['Ba hạt giống', `Lệch tối đa ${latest.qualityMetrics.maxSeedRange}`],
                ['Thủ môn', `Lệch ${latest.qualityMetrics.goalkeeperRange}`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-white/6 py-2 text-xs font-bold last:border-0"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-200">{value}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-5 flex items-center gap-2 text-xs text-slate-600">
            <CalendarDays className="size-4" />{' '}
            {latest ? formatMatchDate(latest.matchDate) : 'Đang chờ kết quả đầu tiên'}
          </p>
        </Card>
      </section>
    </div>
  )
}
