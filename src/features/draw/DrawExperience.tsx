import {
  CheckCircle2,
  FastForward,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  Send,
  Volume2,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import type { BalanceResult } from '../../algorithms/balanceTeams'
import { DrawWheel } from '../../components/football/DrawWheel'
import { TeamPanel } from '../../components/football/TeamPanel'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Notice } from '../../components/ui/Notice'
import type { Player } from '../../types/player'
import { defaultMatchTitle } from './drawFormat'
import { publishDraw } from './drawService'
import { useDrawWheel } from './useDrawWheel'

const TEAM_LABELS = ['A', 'B', 'C'] as const

export function DrawExperience({ result, players }: { result: BalanceResult; players: Player[] }) {
  const navigate = useNavigate()
  const wheel = useDrawWheel(result.revealSequence)
  const [initialDate] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [matchDate, setMatchDate] = useState(initialDate)
  const [title, setTitle] = useState(() => defaultMatchTitle(initialDate))
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const playerById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players])
  const assignmentByPlayerId = useMemo(
    () => new Map(result.assignments.map((assignment) => [assignment.playerId, assignment])),
    [result.assignments],
  )
  const wheelPlayers = useMemo(
    () =>
      result.revealSequence.flatMap((playerId) => {
        const player = playerById.get(playerId)
        const assignment = assignmentByPlayerId.get(playerId)
        return player && assignment ? [{ player, teamIndex: assignment.teamIndex }] : []
      }),
    [assignmentByPlayerId, playerById, result.revealSequence],
  )
  const revealedSet = new Set(wheel.revealedIds)
  const currentWheelPlayer = wheel.currentPlayerId
    ? (wheelPlayers.find(({ player }) => player.id === wheel.currentPlayerId) ?? null)
    : null
  const latestWheelPlayer = wheel.latestPlayerId
    ? (wheelPlayers.find(({ player }) => player.id === wheel.latestPlayerId) ?? null)
    : null
  const latestTeam = latestWheelPlayer ? TEAM_LABELS[latestWheelPlayer.teamIndex] : null
  const statusLabel = {
    idle: 'Chưa bắt đầu',
    spinning: 'Đang tự động quay',
    paused: 'Đã tạm dừng',
    completed: 'Đã hoàn tất',
  }[wheel.status]

  const handlePublish = async (event: FormEvent) => {
    event.preventDefault()
    if (wheel.status !== 'completed' || isPublishing) return
    setIsPublishing(true)
    setPublishError(null)
    try {
      const sessionId = await publishDraw({ title, matchDate, result, players })
      await navigate(`/results/${sessionId}`, { replace: true })
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Không thể công bố kết quả.')
      setIsPublishing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 rounded-2xl border border-white/7 bg-ink-950/45 p-4 lg:grid-cols-[0.8fr_1.2fr] lg:p-6">
        <div className="self-center">
          <DrawWheel
            players={wheelPlayers}
            status={wheel.status}
            currentPlayer={currentWheelPlayer}
            latestPlayer={latestWheelPlayer}
          />
        </div>

        <div className="flex min-w-0 flex-col justify-center">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Vòng quay tự động
              </p>
              <h3 className="mt-1 text-lg font-black text-white">Reveal toàn bộ trong một lần</h3>
            </div>
            <Badge
              tone={
                wheel.status === 'completed'
                  ? 'green'
                  : wheel.status === 'paused'
                    ? 'orange'
                    : 'blue'
              }
            >
              {statusLabel}
            </Badge>
          </div>

          <div className="mt-5 rounded-2xl border border-white/7 bg-white/[0.035] p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-black text-white">
                  {wheel.revealedCount}
                  <span className="text-sm text-slate-600">/{result.revealSequence.length}</span>
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">Cầu thủ đã reveal</p>
              </div>
              <p className="text-right text-[11px] font-bold text-slate-500">
                Còn {wheel.remainingCount} người
              </p>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-white/6"
              role="progressbar"
              aria-label="Tiến độ vòng quay"
              aria-valuemin={0}
              aria-valuemax={result.revealSequence.length}
              aria-valuenow={wheel.revealedCount}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-blue-400 transition-[width] duration-300"
                style={{ width: `${wheel.progress * 100}%` }}
              />
            </div>
          </div>

          {latestWheelPlayer ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-brand-400/15 bg-brand-400/7 p-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-400/12 text-sm font-black text-brand-300">
                {latestTeam}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">
                  {latestWheelPlayer.player.name}
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-slate-500">
                  Vừa vào Đội {latestTeam} • {latestWheelPlayer.player.primaryPosition}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/7 bg-white/[0.025] p-3.5 text-xs text-slate-500">
              <Volume2 className="size-4 shrink-0" /> Nhấn bắt đầu để hệ thống lần lượt công bố từng
              người.
            </div>
          )}

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {wheel.status === 'idle' && (
              <Button className="w-full sm:col-span-2" onClick={wheel.start}>
                <Play className="size-4 fill-current" /> Bắt đầu quay tự động
              </Button>
            )}
            {wheel.status === 'spinning' && (
              <Button variant="secondary" className="w-full" onClick={wheel.pause}>
                <Pause className="size-4 fill-current" /> Tạm dừng
              </Button>
            )}
            {wheel.status === 'paused' && (
              <Button className="w-full" onClick={wheel.resume}>
                <Play className="size-4 fill-current" /> Tiếp tục
              </Button>
            )}
            {wheel.status !== 'completed' && wheel.status !== 'idle' && (
              <Button variant="ghost" className="w-full" onClick={wheel.skip}>
                <FastForward className="size-4" /> Bỏ qua hoạt ảnh
              </Button>
            )}
            {wheel.status === 'completed' && (
              <div className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-400/10 text-sm font-black text-brand-300 sm:col-span-2">
                <CheckCircle2 className="size-4" /> Đã reveal đủ {result.revealSequence.length}{' '}
                người
              </div>
            )}
            {wheel.status !== 'idle' && (
              <Button variant="ghost" className="w-full sm:col-span-2" onClick={wheel.reset}>
                <RotateCcw className="size-4" /> Đặt lại vòng quay
              </Button>
            )}
          </div>

          {wheel.reducedMotion && (
            <p className="mt-3 text-center text-[10px] font-bold text-slate-600">
              Chế độ giảm chuyển động đang bật; mỗi lượt được rút ngắn.
            </p>
          )}
        </div>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {latestWheelPlayer
          ? `${latestWheelPlayer.player.name} vào Đội ${latestTeam}. Đã reveal ${wheel.revealedCount} trên ${result.revealSequence.length} cầu thủ.`
          : statusLabel}
      </div>

      {wheel.status === 'completed' ? (
        <Notice tone="success">
          Vòng quay đã hoàn tất. Kiểm tra tên buổi đá và ngày thi đấu trước khi công bố kết quả bất
          biến.
        </Notice>
      ) : (
        <Notice tone="info">
          <span className="inline-flex items-start gap-2">
            <LockKeyhole className="mt-0.5 size-3.5 shrink-0" /> Tạm dừng, tiếp tục hoặc bỏ qua hoạt
            ảnh không làm thay đổi đội đã khóa.
          </span>
        </Notice>
      )}

      <div className={`grid gap-4 ${result.teamCount === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {result.teams.map((team) => {
          const visiblePlayers = team.playerIds
            .filter((playerId) => revealedSet.has(playerId))
            .map((playerId) => playerById.get(playerId))
            .filter((player): player is Player => Boolean(player))
          const visibleStartingIds = team.startingPlayerIds.filter((playerId) =>
            revealedSet.has(playerId),
          )
          return (
            <TeamPanel
              key={team.teamIndex}
              team={TEAM_LABELS[team.teamIndex]}
              players={visiblePlayers}
              startingPlayerIds={visibleStartingIds}
              emptyMessage="Đang chờ vòng quay công bố."
            />
          )
        })}
      </div>

      {wheel.status === 'completed' && (
        <form
          onSubmit={(event) => void handlePublish(event)}
          className="rounded-2xl border border-brand-400/20 bg-brand-400/[0.055] p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-400/12 text-brand-300">
              <Send className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-white">Công bố kết quả</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                RPC sẽ lưu session và toàn bộ assignments trong một transaction. Kết quả đã công bố
                không thể sửa hoặc xóa từ client.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
            <label className="block text-xs font-bold text-slate-300">
              Tên buổi đá
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                required
                className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-ink-950/65 px-3 text-sm text-white placeholder:text-slate-700"
                placeholder="Ví dụ: Kèo tối thứ Năm"
              />
            </label>
            <label className="block text-xs font-bold text-slate-300">
              Ngày thi đấu
              <input
                type="date"
                value={matchDate}
                onChange={(event) => setMatchDate(event.target.value)}
                required
                className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-ink-950/65 px-3 text-sm text-white"
              />
            </label>
          </div>

          {publishError && (
            <div className="mt-3">
              <Notice tone="error">{publishError}</Notice>
            </div>
          )}

          <Button type="submit" className="mt-4 w-full" disabled={isPublishing || !title.trim()}>
            <Send className="size-4" />
            {isPublishing ? 'Đang công bố…' : 'Xác nhận và công bố'}
          </Button>
        </form>
      )}

      <div className="rounded-2xl border border-white/7 bg-ink-950/50 p-4">
        <p className="text-xs font-black text-slate-300">Mã tái hiện kết quả</p>
        <p className="mt-1 truncate font-mono text-[10px] text-slate-600">{result.drawSeed}</p>
      </div>
    </div>
  )
}
