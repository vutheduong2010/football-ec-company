import { CalendarDays, ChevronRight, Clock3, PencilLine, Trash2, Trophy, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Notice } from '../components/ui/Notice'
import { PageHeader } from '../components/ui/PageHeader'
import { StatusState } from '../components/ui/StatusState'
import { mockPublishedDraw } from '../data/mockPublishedDraw'
import { formatMatchDate } from '../features/draw/drawFormat'
import {
  deletePublishedDraw,
  setPublishedDrawResult,
  type PostMatchResultInput,
} from '../features/draw/drawService'
import { MatchResultDialog } from '../features/results/MatchResultDialog'
import { MatchResultSummary } from '../features/results/MatchResultSummary'
import { useAuth } from '../hooks/useAuth'
import { usePublishedDraws } from '../hooks/usePublishedDraws'
import type { PublishedDraw } from '../types/draw'

export function ResultsPage() {
  const { isAdmin } = useAuth()
  const { draws: remoteDraws, isLoading, error, refresh, isDemo } = usePublishedDraws()
  const draws = useMemo(
    () =>
      [...(isDemo ? [mockPublishedDraw] : remoteDraws)].sort(
        (left, right) =>
          right.matchDate.localeCompare(left.matchDate) ||
          right.publishedAt.localeCompare(left.publishedAt),
      ),
    [isDemo, remoteDraws],
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [editingDraw, setEditingDraw] = useState<PublishedDraw | null>(null)
  const [isSavingResult, setIsSavingResult] = useState(false)
  const [resultError, setResultError] = useState<string | null>(null)

  const openResultDialog = (draw: PublishedDraw) => {
    if (!isAdmin || isDemo) return
    setResultError(null)
    setEditingDraw(draw)
  }

  const handleSaveResult = async (result: PostMatchResultInput) => {
    if (!editingDraw || !isAdmin || isDemo) return
    setIsSavingResult(true)
    setResultError(null)
    try {
      await setPublishedDrawResult(editingDraw.id, result)
      await refresh()
      setEditingDraw(null)
    } catch (requestError) {
      setResultError(
        requestError instanceof Error ? requestError.message : 'Không thể lưu kết quả sau trận.',
      )
    } finally {
      setIsSavingResult(false)
    }
  }

  const handleDelete = async (drawId: string, title: string) => {
    if (!isAdmin || isDemo) return
    if (!window.confirm(`Xóa vĩnh viễn kết quả “${title}”? Thao tác này không thể hoàn tác.`))
      return

    setDeletingId(drawId)
    setDeleteError(null)
    try {
      await deletePublishedDraw(drawId)
      await refresh()
    } catch (requestError) {
      setDeleteError(
        requestError instanceof Error ? requestError.message : 'Không thể xóa kết quả đã công bố.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={isDemo ? 'Dữ liệu minh họa' : 'Đồng bộ Supabase'}
        title="Lịch sử thi đấu"
        description="Theo dõi tỉ số hai đội hoặc bảng xếp hạng ba đội theo từng ngày thi đấu."
      />

      {deleteError && (
        <div className="mb-4">
          <Notice tone="error">{deleteError}</Notice>
        </div>
      )}

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
          <h2 className="mt-4 text-lg font-black text-white">Chưa có trận đấu nào</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Kết quả sẽ xuất hiện tại đây sau khi admin hoàn tất vòng quay và công bố đội hình.
          </p>
          <Link
            to="/draw"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-400 px-4 text-sm font-black text-ink-950"
          >
            Đi tới chia đội
          </Link>
        </Card>
      ) : (
        <div
          className="max-h-[540px] space-y-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]"
          aria-label="Danh sách lịch sử thi đấu"
        >
          {draws.map((draw) => (
            <Card key={draw.id} className="overflow-hidden">
              <div className="overflow-x-auto overscroll-x-contain">
                <article className="grid min-w-[820px] grid-cols-[minmax(210px,1.1fr)_minmax(280px,1.3fr)_170px_250px] items-center divide-x divide-white/7 lg:min-w-0 lg:grid-cols-[minmax(200px,1.1fr)_minmax(270px,1.3fr)_160px_auto]">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-2">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-400/10 text-brand-300">
                        <Trophy className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-black text-white">{draw.title}</h2>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays className="size-3.5" /> {formatMatchDate(draw.matchDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-h-24 items-center px-5 py-4">
                    <MatchResultSummary draw={draw} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 px-4 py-4 text-center lg:grid-cols-1 lg:text-left">
                    <p className="text-xs text-slate-500">
                      <span className="block font-black text-white lg:inline">
                        {draw.teamCount}
                      </span>{' '}
                      đội
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="block font-black text-white lg:inline">
                        {draw.assignments.length}
                      </span>{' '}
                      cầu thủ
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="block font-black text-brand-300 lg:inline">
                        {draw.qualityMetrics.qualityScore}%
                      </span>{' '}
                      cân bằng
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-4">
                    <Link
                      to={`/results/${draw.id}`}
                      className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/6 px-3 text-xs font-extrabold text-white transition hover:bg-white/10 focus-ring"
                    >
                      Chi tiết <ChevronRight className="size-3.5" />
                    </Link>
                    <Button
                      variant="secondary"
                      className="px-3 text-xs disabled:opacity-40"
                      disabled={!isAdmin || isDemo}
                      onClick={() => openResultDialog(draw)}
                      title={
                        isAdmin ? 'Nhập kết quả sau trận' : 'Chỉ admin mới có quyền nhập kết quả'
                      }
                      aria-label={`Nhập kết quả ${draw.title}`}
                    >
                      <PencilLine className="size-3.5" />
                      {draw.teamCount === 2 ? 'Tỉ số' : 'BXH'}
                    </Button>
                    <Button
                      variant="danger"
                      className="px-3 text-xs disabled:opacity-40"
                      disabled={!isAdmin || isDemo || deletingId === draw.id}
                      onClick={() => void handleDelete(draw.id, draw.title)}
                      title={
                        isAdmin ? 'Xóa kết quả đã công bố' : 'Chỉ admin mới có quyền xóa kết quả'
                      }
                      aria-label={`Xóa kết quả ${draw.title}`}
                    >
                      <Trash2 className="size-3.5" />
                      {deletingId === draw.id ? 'Đang xóa…' : 'Xóa'}
                    </Button>
                  </div>
                </article>
              </div>
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
            <p className="text-sm font-extrabold text-white">Lịch sử theo ngày thi đấu</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Mặc định thấy tối đa khoảng 5 trận; cuộn dọc để xem thêm và cuộn ngang từng dòng trên
              màn hình hẹp.
            </p>
          </div>
        </div>
        <Badge>
          <Users className="size-3" /> {isAdmin ? 'Admin được cập nhật và xóa' : 'Viewer chỉ đọc'}
        </Badge>
      </Card>

      {editingDraw && (
        <MatchResultDialog
          key={editingDraw.id}
          draw={editingDraw}
          open
          isSaving={isSavingResult}
          error={resultError}
          onClose={() => {
            if (isSavingResult) return
            setEditingDraw(null)
            setResultError(null)
          }}
          onSubmit={handleSaveResult}
        />
      )}
    </div>
  )
}
