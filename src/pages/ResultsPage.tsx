import { CalendarDays, ChevronRight, Clock3, Trophy, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Notice } from '../components/ui/Notice'
import { PageHeader } from '../components/ui/PageHeader'
import { StatusState } from '../components/ui/StatusState'
import { mockPublishedDraw } from '../data/mockPublishedDraw'
import { formatMatchDate } from '../features/draw/drawFormat'
import { usePublishedDraws } from '../hooks/usePublishedDraws'

export function ResultsPage() {
  const { draws: remoteDraws, isLoading, error, refresh, isDemo } = usePublishedDraws()
  const draws = isDemo ? [mockPublishedDraw] : remoteDraws

  return (
    <div>
      <PageHeader
        eyebrow={isDemo ? 'Dữ liệu minh họa' : 'Đồng bộ Supabase'}
        title="Kết quả đã công bố"
        description="Mở lại đội hình bất biến, tải ảnh PNG hoặc chia sẻ đường dẫn cho mọi người trong đội."
      />

      {isLoading ? (
        <StatusState type="loading" />
      ) : error ? (
        <Card className="p-5">
          <Notice tone="error">{error}</Notice>
          <Button variant="secondary" className="mt-4" onClick={() => void refresh()}>
            Thử tải lại
          </Button>
        </Card>
      ) : draws.length === 0 ? (
        <Card className="px-5 py-12 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/5 text-slate-500">
            <Trophy className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-black text-white">Chưa có kết quả nào được công bố</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Admin cần hoàn tất vòng quay và xác nhận publish. Viewer không thể thấy bản nháp.
          </p>
          <Link
            to="/draw"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-400 px-4 text-sm font-black text-ink-950"
          >
            Đi tới chia đội
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {draws.map((draw, index) => (
            <Card
              key={draw.id}
              className="group overflow-hidden transition hover:-translate-y-0.5 hover:border-white/14"
            >
              <Link to={`/results/${draw.id}`} className="block rounded-2xl focus-ring">
                <div className="relative border-b border-white/7 p-5">
                  <div className="absolute right-4 top-4 text-5xl font-black text-white/[0.025]">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-400/10 text-brand-300">
                      <Trophy className="size-5" />
                    </span>
                    <Badge tone="green">Đã công bố</Badge>
                  </div>
                  <h2 className="mt-5 text-lg font-black text-white">{draw.title}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays className="size-3.5" /> {formatMatchDate(draw.matchDate)}
                  </p>
                </div>
                <div className="grid grid-cols-3 divide-x divide-white/7 px-2 py-4">
                  <div className="text-center">
                    <p className="text-lg font-black text-white">{draw.teamCount}</p>
                    <p className="text-[10px] font-bold text-slate-600">Đội</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-white">{draw.assignments.length}</p>
                    <p className="text-[10px] font-bold text-slate-600">Cầu thủ</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-brand-300">
                      {draw.qualityMetrics.qualityScore}%
                    </p>
                    <p className="text-[10px] font-bold text-slate-600">Cân bằng</p>
                  </div>
                </div>
                <div className="flex min-h-12 items-center justify-between border-t border-white/7 px-5 text-xs font-extrabold text-slate-400 transition group-hover:text-white">
                  Xem chi tiết
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-slate-500">
            <Clock3 className="size-5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-white">Lịch sử đồng bộ nhiều thiết bị</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Chỉ phiên published mới xuất hiện; dữ liệu snapshot không đổi khi hồ sơ cầu thủ được
              sửa.
            </p>
          </div>
        </div>
        <Badge>
          <Users className="size-3" /> Viewer chỉ đọc
        </Badge>
      </Card>
    </div>
  )
}
