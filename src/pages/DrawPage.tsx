import {
  AlertTriangle,
  Check,
  ChevronRight,
  CircleGauge,
  Dices,
  Goal,
  Info,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { balanceTeams, type BalanceResult } from '../algorithms/balanceTeams'
import { PlayerCard } from '../components/football/PlayerCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Notice } from '../components/ui/Notice'
import { PageHeader } from '../components/ui/PageHeader'
import { StatusState } from '../components/ui/StatusState'
import { DrawExperience } from '../features/draw/DrawExperience'
import { defaultMatchTitle } from '../features/draw/drawFormat'
import type { LiveDrawExperienceState, LiveDrawState } from '../features/draw/liveDrawTypes'
import { useAttendanceDraft } from '../features/draw/useAttendanceDraft'
import { useLiveDrawRoom, type LiveConnectionStatus } from '../features/draw/useLiveDrawRoom'
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

function DrawWorkspace({
  players,
  isAdmin,
  liveState,
  liveStatus,
  liveError,
  publishLiveState,
}: {
  players: Player[]
  isAdmin: boolean
  liveState: LiveDrawState
  liveStatus: LiveConnectionStatus
  liveError: string | null
  publishLiveState: (state: LiveDrawState) => Promise<void>
}) {
  const [preview, setPreview] = useState<DrawPreview | null>(null)
  const [previewError, setPreviewError] = useState<PreviewError | null>(null)
  const [initialDate] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [experienceState, setExperienceState] = useState<LiveDrawExperienceState>(() => ({
    wheel: { status: 'idle', revealedCount: 0 },
    matchDate: initialDate,
    matchTitle: defaultMatchTitle(initialDate),
  }))
  const activePlayers = useMemo(() => players.filter((player) => player.isActive), [players])
  const attendance = useAttendanceDraft(activePlayers)
  const selectedPlayerIds = isAdmin ? attendance.selectedPlayerIds : liveState.selectedPlayerIds
  const teamCount = isAdmin ? attendance.teamCount : liveState.teamCount

  const selectedPlayers = useMemo(
    () => activePlayers.filter((player) => selectedPlayerIds.includes(player.id)),
    [activePlayers, selectedPlayerIds],
  )
  const estimated = Math.floor(selectedPlayerIds.length / teamCount)
  const remainder = selectedPlayerIds.length % teamCount
  const gkCount = selectedPlayers.filter((player) => player.positionGroup === 'GK').length
  const previewSignature = `${teamCount}:${[...selectedPlayerIds].sort().join(',')}`
  const activePreview = isAdmin
    ? preview?.signature === previewSignature
      ? preview.result
      : null
    : liveState.preview
  const activeError =
    isAdmin && previewError?.signature === previewSignature ? previewError.message : null
  const playerById = useMemo(
    () => new Map(activePlayers.map((player) => [player.id, player])),
    [activePlayers],
  )

  const runPreview = () => {
    if (!isAdmin) return
    try {
      const result = balanceTeams(activePlayers, selectedPlayerIds, teamCount, createDrawSeed())
      setExperienceState((current) => ({
        ...current,
        wheel: { status: 'idle', revealedCount: 0 },
      }))
      setPreview({ signature: previewSignature, result })
      setPreviewError(null)
    } catch (error) {
      setPreviewError({
        signature: previewSignature,
        message: error instanceof Error ? error.message : 'Không thể tạo phương án chia đội.',
      })
    }
  }

  const handleExperienceStateChange = useCallback((nextState: LiveDrawExperienceState) => {
    setExperienceState((current) =>
      current.wheel.status === nextState.wheel.status &&
      current.wheel.revealedCount === nextState.wheel.revealedCount &&
      current.matchTitle === nextState.matchTitle &&
      current.matchDate === nextState.matchDate
        ? current
        : nextState,
    )
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    void publishLiveState({
      version: 1,
      selectedPlayerIds,
      teamCount,
      preview: activePreview,
      wheel: activePreview ? experienceState.wheel : { status: 'idle', revealedCount: 0 },
      matchTitle: experienceState.matchTitle,
      matchDate: experienceState.matchDate,
    })
  }, [activePreview, experienceState, isAdmin, publishLiveState, selectedPlayerIds, teamCount])

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
        <Notice tone={liveStatus === 'error' ? 'warning' : 'info'}>
          <span className="inline-flex items-start gap-2">
            <Radio
              className={`mt-0.5 size-4 shrink-0 ${liveStatus === 'live' ? 'text-brand-300' : ''}`}
            />
            {isAdmin
              ? 'Mọi thao tác điểm danh, tạo phương án và quay đang được đồng bộ trực tiếp cho viewer.'
              : liveStatus === 'live'
                ? 'Bạn đang xem trực tiếp thao tác của admin. Tất cả chức năng chỉnh sửa đã bị khóa.'
                : 'Đang kết nối phòng chia đội trực tiếp. Dữ liệu trên màn hình chỉ có thể xem.'}
          </span>
        </Notice>
        {liveError && <p className="mt-2 text-xs text-orange-300">{liveError}</p>}
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
              <Button
                variant="ghost"
                className="px-3 text-xs"
                onClick={attendance.clearSelection}
                disabled={!isAdmin}
              >
                Bỏ chọn
              </Button>
              <Button
                variant="secondary"
                className="px-3 text-xs"
                onClick={attendance.selectAll}
                disabled={!isAdmin}
              >
                Chọn tất cả
              </Button>
              <Button
                variant="ghost"
                className="px-3 text-xs"
                onClick={attendance.clearDraft}
                disabled={!isAdmin}
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
                onToggle={() => attendance.togglePlayer(player.id)}
                disabled={!isAdmin}
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
                    onClick={() => attendance.setTeamCount(count as 2 | 3)}
                    disabled={!isAdmin}
                    className={`min-h-11 rounded-lg text-sm font-extrabold transition focus-ring ${teamCount === count ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    aria-pressed={teamCount === count}
                  >
                    {count} đội
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                ['Mỗi đội', `${estimated}${remainder ? `–${estimated + 1}` : ''}`],
                ['Mạnh · H1', selectedPlayers.filter((player) => player.seed === 1).length],
                ['TB · H2', selectedPlayers.filter((player) => player.seed === 2).length],
                ['Yếu · H3', selectedPlayers.filter((player) => player.seed === 3).length],
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
              disabled={!isAdmin || selectedPlayerIds.length < teamCount}
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
                  ['Ba hạt giống', `Lệch tối đa ${activePreview.qualityMetrics.maxSeedRange}`],
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
                readOnly={!isAdmin}
                liveState={
                  isAdmin
                    ? experienceState
                    : {
                        wheel: liveState.wheel,
                        matchTitle: liveState.matchTitle,
                        matchDate: liveState.matchDate,
                      }
                }
                onStateChange={isAdmin ? handleExperienceStateChange : undefined}
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
  const liveRoom = useLiveDrawRoom()

  const liveBadge = {
    live: {
      tone: 'green' as const,
      label: isAdmin ? 'Admin · Đang phát trực tiếp' : 'Viewer · Trực tiếp',
    },
    connecting: { tone: 'blue' as const, label: 'Đang kết nối trực tiếp' },
    error: { tone: 'orange' as const, label: 'Mất kết nối trực tiếp' },
    offline: { tone: 'slate' as const, label: isConfigured ? 'Ngoại tuyến' : 'Chế độ minh họa' },
  }[liveRoom.status]

  return (
    <div>
      <PageHeader
        eyebrow={isAdmin ? 'Phòng điều khiển' : 'Chế độ chỉ xem'}
        title="Chia đội"
        description="Admin điều khiển điểm danh và vòng quay; viewer theo dõi cùng trạng thái theo thời gian thực."
        action={
          <Badge tone={liveBadge.tone}>
            <Radio className="size-3" /> {liveBadge.label}
          </Badge>
        }
      />

      {authLoading ? (
        <StatusState type="loading" />
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
        <DrawWorkspace
          players={players}
          isAdmin={isAdmin}
          liveState={liveRoom.state}
          liveStatus={liveRoom.status}
          liveError={liveRoom.error}
          publishLiveState={liveRoom.publish}
        />
      )}
    </div>
  )
}
