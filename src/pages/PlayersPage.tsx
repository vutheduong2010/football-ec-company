import {
  LockKeyhole,
  Pencil,
  Power,
  PowerOff,
  Search,
  SlidersHorizontal,
  UserPlus,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PlayerCard } from '../components/football/PlayerCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonStyles'
import { Card } from '../components/ui/Card'
import { Notice } from '../components/ui/Notice'
import { PageHeader } from '../components/ui/PageHeader'
import { StatusState } from '../components/ui/StatusState'
import { PlayerFormDialog } from '../features/players/PlayerFormDialog'
import { useAuth } from '../hooks/useAuth'
import { usePlayers } from '../hooks/usePlayers'
import type { Player, PlayerInput, PositionGroup } from '../types/player'

type SeedFilter = 'all' | '1' | '2'
type GroupFilter = 'all' | PositionGroup
type StatusFilter = 'all' | 'active' | 'inactive'

const controlClass =
  'min-h-11 w-full rounded-xl border border-white/9 bg-white/5 px-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 hover:border-white/15 focus:border-brand-400/50 focus:ring-4 focus:ring-brand-400/10'

export function PlayersPage() {
  const { isAdmin, isConfigured } = useAuth()
  const {
    players,
    isLoading,
    isMutating,
    error,
    isDemo,
    refresh,
    createPlayer,
    updatePlayer,
    setPlayerActive,
    deletePlayerPermanently,
  } = usePlayers()
  const [query, setQuery] = useState('')
  const [seed, setSeed] = useState<SeedFilter>('all')
  const [group, setGroup] = useState<GroupFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const filteredPlayers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    return players.filter((player) => {
      if (!isAdmin && !player.isActive) return false
      const matchesQuery =
        !normalized ||
        `${player.name} ${player.nickname ?? ''}`.toLocaleLowerCase('vi').includes(normalized)
      const matchesSeed = seed === 'all' || String(player.seed) === seed
      const matchesGroup = group === 'all' || player.positionGroup === group
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && player.isActive) ||
        (status === 'inactive' && !player.isActive)
      return matchesQuery && matchesSeed && matchesGroup && matchesStatus
    })
  }, [group, isAdmin, players, query, seed, status])

  const openCreate = () => {
    setEditingPlayer(null)
    setDialogOpen(true)
    setSuccess(null)
  }

  const openEdit = (player: Player) => {
    setEditingPlayer(player)
    setDialogOpen(true)
    setSuccess(null)
  }

  const handleSubmit = async (input: PlayerInput) => {
    if (editingPlayer) {
      await updatePlayer(editingPlayer.id, input)
      setSuccess(`Đã cập nhật ${input.name.trim()}.`)
    } else {
      await createPlayer(input)
      setSuccess(`Đã thêm ${input.name.trim()}.`)
    }
    setDialogOpen(false)
  }

  const handlePermanentDelete = async () => {
    if (!editingPlayer) return
    await deletePlayerPermanently(editingPlayer.id)
    setSuccess(`Đã xóa vĩnh viễn ${editingPlayer.name}.`)
    setDialogOpen(false)
  }

  const handleToggleActive = async (player: Player) => {
    const action = player.isActive ? 'vô hiệu hóa' : 'kích hoạt lại'
    if (!window.confirm(`Xác nhận ${action} ${player.name}?`)) return
    try {
      await setPlayerActive(player.id, !player.isActive)
      setSuccess(`Đã ${action} ${player.name}.`)
    } catch {
      // usePlayers already exposes the request error to the page.
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={isDemo ? 'Dữ liệu mẫu' : 'Dữ liệu Supabase'}
        title="Thành viên"
        description="Danh sách cầu thủ, hạt giống và vị trí. Viewer có thể xem; chỉ admin được cập nhật dữ liệu."
        action={
          isAdmin ? (
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <UserPlus className="size-4" /> Thêm cầu thủ
            </Button>
          ) : (
            <Link to="/admin/login" className={buttonClass('secondary', 'w-full sm:w-auto')}>
              <LockKeyhole className="size-4" /> Đăng nhập để quản lý
            </Link>
          )
        }
      />

      {!isConfigured && (
        <div className="mb-4">
          <Notice tone="warning">
            Chưa cấu hình Supabase. Ứng dụng đang hiển thị dữ liệu mẫu ở chế độ chỉ đọc; không có
            mutation giả được thực hiện.
          </Notice>
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Notice tone="success">{success}</Notice>
        </div>
      )}
      {error && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Notice tone="error">{error}</Notice>
          </div>
          <Button variant="secondary" onClick={() => void refresh()}>
            Thử lại
          </Button>
        </div>
      )}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Tìm tên hoặc biệt danh</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={`${controlClass} pl-10`}
              placeholder="Tìm tên hoặc biệt danh..."
              type="search"
            />
          </label>
          <div
            className={`grid gap-3 ${isAdmin ? 'grid-cols-1 min-[420px]:grid-cols-3 lg:w-[560px]' : 'grid-cols-2 lg:w-[360px]'}`}
          >
            <label>
              <span className="sr-only">Lọc hạt giống</span>
              <select
                value={seed}
                onChange={(event) => setSeed(event.target.value as SeedFilter)}
                className={controlClass}
              >
                <option value="all">Mọi hạt giống</option>
                <option value="1">Hạt giống 1</option>
                <option value="2">Hạt giống 2</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Lọc nhóm vị trí</span>
              <select
                value={group}
                onChange={(event) => setGroup(event.target.value as GroupFilter)}
                className={controlClass}
              >
                <option value="all">Mọi vị trí</option>
                <option value="GK">Thủ môn</option>
                <option value="DEF">Hậu vệ</option>
                <option value="MID">Tiền vệ</option>
                <option value="ATT">Tiền đạo</option>
              </select>
            </label>
            {isAdmin && (
              <label>
                <span className="sr-only">Lọc trạng thái</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as StatusFilter)}
                  className={controlClass}
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Đã vô hiệu hóa</option>
                  <option value="all">Mọi trạng thái</option>
                </select>
              </label>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/7 pt-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <SlidersHorizontal className="size-4" /> Hiển thị {filteredPlayers.length}/
            {players.length} cầu thủ
          </div>
          <div className="flex gap-2">
            <Badge tone="green">
              H1: {players.filter((player) => player.isActive && player.seed === 1).length}
            </Badge>
            <Badge>
              H2: {players.filter((player) => player.isActive && player.seed === 2).length}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="mt-5">
        {isLoading ? (
          <StatusState type="loading" />
        ) : filteredPlayers.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {filteredPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                actions={
                  isAdmin ? (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(player)}
                        aria-label={`Sửa ${player.name}`}
                        className="grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-white/7 hover:text-white focus-ring"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(player)}
                        aria-label={
                          player.isActive
                            ? `Vô hiệu hóa ${player.name}`
                            : `Kích hoạt ${player.name}`
                        }
                        className="grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-white/7 hover:text-white focus-ring"
                      >
                        {player.isActive ? (
                          <PowerOff className="size-4" />
                        ) : (
                          <Power className="size-4" />
                        )}
                      </button>
                    </div>
                  ) : undefined
                }
              />
            ))}
          </div>
        ) : (
          <StatusState type="empty" />
        )}
      </div>

      <PlayerFormDialog
        key={`${dialogOpen ? 'open' : 'closed'}:${editingPlayer?.id ?? 'new'}`}
        open={dialogOpen && isAdmin}
        player={editingPlayer}
        isSaving={isMutating}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editingPlayer ? handlePermanentDelete : undefined}
      />
    </div>
  )
}
