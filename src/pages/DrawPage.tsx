import {
  AlertTriangle,
  Check,
  ChevronRight,
  CircleGauge,
  Dices,
  Goal,
  Info,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { balanceTeams, type BalanceResult } from '../algorithms/balanceTeams'
import { PlayerCard } from '../components/football/PlayerCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonStyles'
import { Card } from '../components/ui/Card'
import { Notice } from '../components/ui/Notice'
import { PageHeader } from '../components/ui/PageHeader'
import { StatusState } from '../components/ui/StatusState'
import { DrawExperience } from '../features/draw/DrawExperience'
import { useAttendanceDraft } from '../features/draw/useAttendanceDraft'
import { useAuth } from '../hooks/useAuth'
import { usePlayers } from '../hooks/usePlayers'
import type { Player } from '../types/player'

const steps = ['Điểm danh', 'Cấu hình', 'Quay']

interface DrawPreview {
  signature: string
  result: BalanceResult
}

interface PreviewError {
  signature: string
  message: string
}

function createDrawSeed() {
  return crypto.randomUUID()
}

function AdminDrawWorkspace({ players }: { players: Player[] }) {
  const [preview, setPreview] = useState<DrawPreview | null>(null)
  const [previewError, setPreviewError] = useState<PreviewError | null>(null)
  const activePlayers = useMemo(() => players.filter((player) => player.isActive), [players])
  const {
    selectedPlayerIds,
    teamCount,
    setTeamCount,
    togglePlayer,
    selectAll,
    clearSelection,
    clearDraft,
  } = useAttendanceDraft(activePlayers)

  const selectedPlayers = useMemo(
    () => activePlayers.filter((player) => selectedPlayerIds.includes(player.id)),
    [activePlayers, selectedPlayerIds],
  )
  const estimated = Math.floor(selectedPlayerIds.length / teamCount)
  const remainder = selectedPlayerIds.length % teamCount
  const gkCount = selectedPlayers.filter((player) => player.positionGroup === 'GK').length
  const previewSignature = `${teamCount}:${[...selectedPlayerIds].sort().join(',')}`
  const activePreview = preview?.signature === previewSignature ? preview.result : null
  const activeError = previewError?.signature === previewSignature ? previewError.message : null
  const playerById = useMemo(
    () => new Map(activePlayers.map((player) => [player.id, player])),
    [activePlayers],
  )

  const runPreview = () => {
    try {
      const result = balanceTeams(activePlayers, selectedPlayerIds, teamCount, createDrawSeed())
      setPreview({ signature: previewSignature, result })
      setPreviewError(null)
    } catch (error) {
      setPreviewError({
        signature: previewSignature,
        message: error instanceof Error ? error.message : 'Không thể tạo phương án chia đội.',
      })
    }
  }

  return (
    <>
      <ol className="mb-5 grid grid-cols-3 gap-2" aria-label="Tiến trình chia đội">
        {steps.map((step, index) => (
          <li
            key={step}
            className={`flex min-h-12 items-center gap-2 rounded-xl border px-2.5 sm:px-4 ${index === (activePreview ? 2 : 0) ? 'border-brand-400/25 bg-brand-400/10 text-brand-300' : 'border-white/7 bg-white/[0.025] text-slate-600'}`}
          >
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-black ${index === (activePreview ? 2 : 0) ? 'bg-brand-400 text-ink-950' : 'bg-white/6'}`}
            >
              {index + 1}
            </span>
            <span className="truncate text-[11px] font-extrabold sm:text-xs">{step}</span>
            {index < steps.length - 1 && (
              <ChevronRight className="ml-auto hidden size-3 sm:block" />
            )}
          </li>
        ))}
      </ol>

      <div className="mb-5">
        <Notice tone="info">
          Điểm danh và cấu hình đang được lưu cục bộ trên thiết bị này. Dữ liệu server chỉ được tạo
          sau khi hoàn tất thuật toán và admin xác nhận publish.
        </Notice>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/7 px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-sm font-black text-white">1. Ai có mặt hôm nay?</h2>
              <p className="mt-1 text-xs text-slate-500">
                Đã chọn {selectedPlayerIds.length}/{activePlayers.length} người
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" className="px-3 text-xs" onClick={clearSelection}>
                Bỏ chọn
              </Button>
              <Button variant="secondary" className="px-3 text-xs" onClick={selectAll}>
                Chọn tất cả
              </Button>
              <Button
                variant="ghost"
                className="px-3 text-xs"
                onClick={clearDraft}
                aria-label="Đặt lại bản nháp điểm danh"
              >
                <RotateCcw className="size-3.5" /> Đặt lại
              </Button>
            </div>
          </div>
          <div className="grid max-h-[540px] gap-2 overflow-y-auto p-3 sm:grid-cols-2 sm:p-4">
            {activePlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                selected={selectedPlayerIds.includes(player.id)}
                onToggle={() => togglePlayer(player.id)}
              />
            ))}
          </div>
        </Card>

        <div className="space-y-5 xl:sticky xl:top-8 xl:self-start">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-400/10 text-blue-300">
                <Goal className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-black text-white">2. Cấu hình trận</h2>
                <p className="text-xs text-slate-500">Sân 7 • {selectedPlayerIds.length} người</p>
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className="mb-2 text-xs font-bold text-slate-400">Số đội</legend>
              <div className="grid grid-cols-2 rounded-xl bg-ink-950/70 p-1 ring-1 ring-white/8">
                {[2, 3].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTeamCount(count as 2 | 3)}
                    className={`min-h-11 rounded-lg text-sm font-extrabold transition focus-ring ${teamCount === count ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    aria-pressed={teamCount === count}
                  >
                    {count} đội
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ['Mỗi đội', `${estimated}${remainder ? `–${estimated + 1}` : ''}`],
                ['Hạt giống 1', selectedPlayers.filter((player) => player.seed === 1).length],
                ['Thủ môn', gkCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-white/4 p-3 text-center">
                  <p className="text-lg font-black text-white">{value}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CircleGauge className="size-5 text-brand-300" />
                <h2 className="text-sm font-black">Xem trước đầu vào</h2>
              </div>
              <Badge tone={selectedPlayerIds.length >= teamCount * 7 ? 'green' : 'orange'}>
                {selectedPlayerIds.length >= teamCount * 7 ? 'Đủ quân' : 'Thiếu quân'}
              </Badge>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="size-4 text-brand-300" /> Mọi cầu thủ chỉ được vào một đội
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="size-4 text-brand-300" /> Cân bằng hạt giống và nhóm vị trí
              </div>
              {gkCount < teamCount && (
                <div className="flex items-start gap-2 rounded-xl border border-orange-400/15 bg-orange-400/7 p-3 text-orange-200">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Chỉ có {gkCount} thủ môn cho{' '}
                  {teamCount} đội. Hệ thống vẫn chia và sẽ hiển thị cảnh báo.
                </div>
              )}
              {selectedPlayerIds.length < teamCount * 7 && (
                <div className="flex items-start gap-2 rounded-xl border border-blue-400/15 bg-blue-400/7 p-3 text-blue-200">
                  <Info className="mt-0.5 size-4 shrink-0" /> Mỗi đội sẽ có ít hơn 7 người. Bạn vẫn
                  có thể chia đội và quay bình thường.
                </div>
              )}
            </div>

            {activeError && (
              <div className="mt-4">
                <Notice tone="error">{activeError}</Notice>
              </div>
            )}

            <Button
              className="mt-5 w-full"
              disabled={selectedPlayerIds.length < teamCount}
              onClick={runPreview}
            >
              <Dices className="size-4" />
              {activePreview ? 'Tạo phương án khác' : 'Xem trước chia đội'}
            </Button>
            <p className="mt-3 text-center text-[11px] leading-5 text-slate-600">
              Tạo 600 phương án deterministic, chấm cân bằng rồi chọn ngẫu nhiên trong nhóm tốt
              nhất.
            </p>
          </Card>

          <Card className="flex items-center gap-3 p-4">
            <Users className="size-5 shrink-0 text-slate-500" />
            <p className="text-xs leading-5 text-slate-500">
              Cầu thủ đã vô hiệu hóa không xuất hiện trong danh sách điểm danh.
            </p>
          </Card>
        </div>
      </div>

      {activePreview && (
        <section className="mt-8" aria-labelledby="preview-title">
          <Card className="overflow-hidden border-brand-400/20">
            <div className="border-b border-white/7 bg-gradient-to-r from-brand-400/10 via-transparent to-blue-400/8 px-4 py-5 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-brand-300">
                    <Sparkles className="size-4" />
                    <span className="text-[11px] font-black uppercase tracking-[0.16em]">
                      Phương án cân bằng
                    </span>
                  </div>
                  <h2 id="preview-title" className="mt-2 text-xl font-black text-white sm:text-2xl">
                    Đội hình đã được cố định
                  </h2>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
                    Vòng quay chỉ reveal theo thứ tự đã tạo và không thể thay đổi kết quả này.
                  </p>
                </div>
                <div className="rounded-2xl border border-brand-400/20 bg-ink-950/60 px-4 py-3 text-center">
                  <p className="text-3xl font-black text-brand-300">
                    {activePreview.qualityMetrics.qualityScore}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Điểm cân bằng
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  [
                    'Số lượng',
                    activePreview.qualityMetrics.sizeRange === 0 ? 'Cân tuyệt đối' : 'Lệch 1',
                  ],
                  ['Hạt giống 1', `Lệch ${activePreview.qualityMetrics.seedOneRange}`],
                  ['Thủ môn', `Lệch ${activePreview.qualityMetrics.goalkeeperRange}`],
                  ['Thuật toán', activePreview.algorithmVersion],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/7 bg-white/[0.035] p-3"
                  >
                    <p className="truncate text-xs font-black text-slate-200">{value}</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-600">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {activePreview.warnings.length > 0 ? (
                <div className="mb-5 grid gap-2 lg:grid-cols-2">
                  {activePreview.warnings.map((warning) => (
                    <Notice key={warning.code} tone="warning">
                      {warning.message}
                    </Notice>
                  ))}
                </div>
              ) : (
                <div className="mb-5">
                  <Notice tone="success">Đầu vào đủ tốt, không có cảnh báo phân đội.</Notice>
                </div>
              )}

              <DrawExperience
                key={activePreview.drawSeed}
                result={activePreview}
                players={[...playerById.values()]}
              />
            </div>
          </Card>
        </section>
      )}
    </>
  )
}

export function DrawPage() {
  const { isAdmin, isLoading: authLoading, isConfigured } = useAuth()
  const { players, isLoading, error, refresh } = usePlayers()

  return (
    <div>
      <PageHeader
        eyebrow={isAdmin ? 'Bản nháp cục bộ' : 'Quyền quản trị'}
        title="Chia đội"
        description="Điểm danh, khóa phương án cân bằng rồi tự động reveal toàn bộ cầu thủ bằng vòng quay tương tác."
        action={
          isAdmin ? (
            <Badge tone="green">Admin đã xác thực</Badge>
          ) : (
            <Badge tone="orange">Chỉ admin được thực hiện</Badge>
          )
        }
      />

      {authLoading ? (
        <StatusState type="loading" />
      ) : !isAdmin ? (
        <Card className="mx-auto max-w-2xl px-5 py-10 text-center sm:px-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-400/10 text-orange-300 ring-1 ring-orange-400/20">
            <LockKeyhole className="size-6" />
          </span>
          <h2 className="mt-5 text-xl font-black text-white">Cần quyền quản trị để chia đội</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Viewer vẫn xem được cầu thủ và kết quả đã công bố. Điểm danh, quay và lưu kết quả chỉ
            dành cho admin duy nhất.
          </p>
          {!isConfigured && (
            <div className="mt-5">
              <Notice tone="warning">
                Supabase chưa được cấu hình nên chưa thể xác thực admin.
              </Notice>
            </div>
          )}
          <Link to="/admin/login" className={buttonClass('primary', 'mt-6')}>
            <LockKeyhole className="size-4" /> Đăng nhập admin
          </Link>
        </Card>
      ) : isLoading ? (
        <StatusState type="loading" />
      ) : error ? (
        <Card className="p-6 text-center">
          <Notice tone="error">{error}</Notice>
          <Button variant="secondary" className="mt-4" onClick={() => void refresh()}>
            Thử tải lại
          </Button>
        </Card>
      ) : (
        <AdminDrawWorkspace players={players} />
      )}
    </div>
  )
}
