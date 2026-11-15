import { ArrowLeft, CalendarDays, Download, Share2, ShieldCheck, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ExportResultCard } from '../components/football/ExportResultCard'
import { Pitch7 } from '../components/football/Pitch7'
import { TeamPanel } from '../components/football/TeamPanel'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonStyles'
import { Card } from '../components/ui/Card'
import { Notice } from '../components/ui/Notice'
import { StatusState } from '../components/ui/StatusState'
import { mockPublishedDraw } from '../data/mockPublishedDraw'
import { TEAM_LABELS, formatMatchDate } from '../features/draw/drawFormat'
import { deletePublishedDraw } from '../features/draw/drawService'
import { useAuth } from '../hooks/useAuth'
import { usePublishedDraw } from '../hooks/usePublishedDraw'

function safeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export function ResultDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { draw: remoteDraw, isLoading, error, isDemo } = usePublishedDraw(id)
  const draw = isDemo ? mockPublishedDraw : remoteDraw
  const [activeTeamIndex, setActiveTeamIndex] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  if (isLoading) return <StatusState type="loading" />

  if (error) {
    return (
      <Card className="p-5">
        <Notice tone="error">{error}</Notice>
        <Link to="/results" className={buttonClass('secondary', 'mt-4')}>
          Quay lại lịch sử
        </Link>
      </Card>
    )
  }

  if (!draw) {
    return (
      <Card className="px-5 py-12 text-center">
        <h1 className="text-xl font-black text-white">Không tìm thấy kết quả</h1>
        <p className="mt-2 text-sm text-slate-500">
          Phiên này chưa được công bố hoặc bạn không có quyền xem.
        </p>
        <Link to="/results" className={buttonClass('secondary', 'mt-5')}>
          <ArrowLeft className="size-4" /> Quay lại lịch sử
        </Link>
      </Card>
    )
  }

  const safeTeamIndex = Math.min(activeTeamIndex, draw.teams.length - 1)
  const activeTeam = draw.teams[safeTeamIndex]
  const activeTeamLabel = TEAM_LABELS[safeTeamIndex]
  const startingSet = new Set(activeTeam.startingPlayerIds)
  const startingPlayers = activeTeam.players.filter((player) => startingSet.has(player.id))

  const handleExport = async () => {
    if (!exportRef.current || isExporting) return
    setIsExporting(true)
    setActionMessage(null)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: '#070d17',
        cacheBust: true,
        pixelRatio: 2,
      })
      const link = document.createElement('a')
      link.download = `${safeFileName(draw.title) || 'football-ec-company'}-${draw.matchDate}.png`
      link.href = dataUrl
      link.click()
      setActionMessage('Đã tạo ảnh PNG chất lượng cao.')
    } catch (exportError) {
      setActionMessage(
        exportError instanceof Error ? exportError.message : 'Không thể xuất ảnh PNG.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = async () => {
    setActionMessage(null)
    const shareData = {
      title: draw.title,
      text: `Đội hình ${draw.title} • Football EC Company`,
      url: window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        setActionMessage('Đã mở bảng chia sẻ của thiết bị.')
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setActionMessage('Đã sao chép đường dẫn kết quả.')
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return
      setActionMessage('Không thể chia sẻ tự động. Hãy sao chép URL trên thanh địa chỉ.')
    }
  }

  const handleDelete = async () => {
    if (!isAdmin || isDemo || isDeleting) return
    if (!window.confirm(`Xóa vĩnh viễn kết quả “${draw.title}”? Thao tác này không thể hoàn tác.`))
      return

    setIsDeleting(true)
    setActionMessage(null)
    setActionError(null)
    try {
      await deletePublishedDraw(draw.id)
      navigate('/results', { replace: true })
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error ? deleteError.message : 'Không thể xóa kết quả đã công bố.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <Link to="/results" className={buttonClass('ghost', 'mb-4 -ml-2 px-2')}>
        <ArrowLeft className="size-4" /> Quay lại lịch sử
      </Link>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">Đã công bố</Badge>
            <Badge>{isDemo ? 'Dữ liệu mẫu' : 'Snapshot bất biến'}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl lg:text-4xl">
            {draw.title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="size-4" /> {formatMatchDate(draw.matchDate)} • Sân 7 •{' '}
            {draw.assignments.length} người
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Button
            variant="danger"
            className="col-span-2 disabled:opacity-40 sm:order-first sm:flex-none"
            disabled={!isAdmin || isDemo || isDeleting}
            onClick={() => void handleDelete()}
            title={isAdmin ? 'Xóa kết quả đã công bố' : 'Chỉ admin mới có quyền xóa kết quả'}
          >
            <Trash2 className="size-4" /> {isDeleting ? 'Đang xóa…' : 'Xóa kết quả'}
          </Button>
          <Button
            variant="secondary"
            className="flex-1 sm:flex-none"
            onClick={() => void handleShare()}
          >
            <Share2 className="size-4" /> Chia sẻ
          </Button>
          <Button
            className="flex-1 sm:flex-none"
            disabled={isExporting}
            onClick={() => void handleExport()}
          >
            <Download className="size-4" /> {isExporting ? 'Đang tạo…' : 'Tải PNG'}
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="mt-4">
          <Notice tone="info">{actionMessage}</Notice>
        </div>
      )}
      {actionError && (
        <div className="mt-4">
          <Notice tone="error">{actionError}</Notice>
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-4 sm:p-5">
          <div
            className={`mb-4 grid rounded-xl bg-ink-950/70 p-1 ring-1 ring-white/8 ${draw.teamCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
          >
            {draw.teams.map((team) => {
              const teamLabel = TEAM_LABELS[team.teamIndex]
              const active = safeTeamIndex === team.teamIndex
              const activeClass =
                team.teamIndex === 0
                  ? 'bg-brand-400 text-ink-950'
                  : team.teamIndex === 1
                    ? 'bg-blue-400 text-ink-950'
                    : 'bg-orange-400 text-ink-950'
              return (
                <button
                  key={team.teamIndex}
                  type="button"
                  onClick={() => setActiveTeamIndex(team.teamIndex)}
                  className={`min-h-11 rounded-lg text-sm font-black transition focus-ring ${active ? activeClass : 'text-slate-500 hover:text-white'}`}
                  aria-pressed={active}
                >
                  Đội {teamLabel}
                </button>
              )
            })}
          </div>
          <Pitch7 players={startingPlayers} team={activeTeamLabel} />
          <p className="mt-4 text-center text-[11px] leading-5 text-slate-600">
            Sơ đồ ưu tiên vị trí chính, sau đó đến vị trí phụ; phần còn lại được xếp linh hoạt.
          </p>
        </Card>

        <div className="space-y-5">
          <TeamPanel
            team={activeTeamLabel}
            players={activeTeam.players}
            startingPlayerIds={activeTeam.startingPlayerIds}
          />

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-brand-300" />
                <h2 className="text-sm font-black text-white">Chất lượng cân bằng</h2>
              </div>
              <span className="text-2xl font-black text-brand-300">
                {draw.qualityMetrics.qualityScore}%
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Quân số', draw.qualityMetrics.sizeRange === 0 ? 'Cân tuyệt đối' : 'Lệch 1'],
                ['Ba hạt giống', `Lệch tối đa ${draw.qualityMetrics.maxSeedRange}`],
                ['Thủ môn', `Lệch ${draw.qualityMetrics.goalkeeperRange}`],
                ['Phiên bản', draw.algorithmVersion],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-white/4 p-3 text-center">
                  <p className="truncate text-sm font-black text-white">{value}</p>
                  <p className="mt-1 text-[10px] font-bold text-slate-600">{label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="pointer-events-none fixed left-[-10000px] top-0" aria-hidden="true">
        <ExportResultCard ref={exportRef} draw={draw} />
      </div>
    </div>
  )
}
