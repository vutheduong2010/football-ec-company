import { ImagePlus, Power, Save, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

import { Button } from '../../components/ui/Button'
import { buttonClass } from '../../components/ui/buttonStyles'
import { PlayerAvatar } from '../../components/football/PlayerAvatar'
import {
  MAX_SECONDARY_POSITIONS,
  POSITIONS,
  type Player,
  type PlayerAvatarUpdate,
  type PlayerInput,
  type Position,
  type Seed,
} from '../../types/player'
import { validateAvatarFile } from './playerAvatar'
import { validatePlayerInput, type PlayerValidationErrors } from './playerValidation'

const emptyPlayer: PlayerInput = {
  name: '',
  nickname: '',
  seed: 1,
  primaryPosition: 'CM',
  secondaryPositions: [],
  isActive: true,
}

const inputClass =
  'min-h-11 w-full rounded-xl border border-white/9 bg-ink-950/70 px-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-brand-400/50 focus:ring-4 focus:ring-brand-400/10'

function toInput(player: Player | null): PlayerInput {
  if (!player) return { ...emptyPlayer, secondaryPositions: [] }
  return {
    name: player.name,
    nickname: player.nickname ?? '',
    seed: player.seed,
    primaryPosition: player.primaryPosition,
    secondaryPositions: [...player.secondaryPositions],
    isActive: player.isActive,
  }
}

export function PlayerFormDialog({
  open,
  player,
  isSaving,
  onClose,
  onSubmit,
  onDelete,
}: {
  open: boolean
  player: Player | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (input: PlayerInput, avatar: PlayerAvatarUpdate) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const [input, setInput] = useState<PlayerInput>(() => toInput(player))
  const [errors, setErrors] = useState<PlayerValidationErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const initialInput = useMemo(() => toInput(player), [player])
  const dirty =
    JSON.stringify(input) !== JSON.stringify(initialInput) || Boolean(avatarFile) || avatarRemoved

  const requestClose = useCallback(() => {
    if (dirty && !window.confirm('Bạn có thay đổi chưa lưu. Đóng biểu mẫu?')) return
    onClose()
  }, [dirty, onClose])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) requestClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, open, requestClose])

  useEffect(
    () => () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    },
    [avatarPreviewUrl],
  )

  if (!open) return null

  const toggleSecondary = (position: Position) => {
    setInput((current) => {
      if (current.secondaryPositions.includes(position)) {
        return {
          ...current,
          secondaryPositions: current.secondaryPositions.filter((item) => item !== position),
        }
      }
      if (current.secondaryPositions.length >= MAX_SECONDARY_POSITIONS) return current
      return { ...current, secondaryPositions: [...current.secondaryPositions, position] }
    })
  }

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) return
    const validationError = validateAvatarFile(file)
    setAvatarError(validationError)
    if (validationError) return

    setAvatarFile(file)
    setAvatarRemoved(false)
    setAvatarPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreviewUrl(null)
    setAvatarRemoved(true)
    setAvatarError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationErrors = validatePlayerInput(input)
    setErrors(validationErrors)
    setSubmitError(null)
    if (Object.keys(validationErrors).length > 0 || avatarError) return

    try {
      await onSubmit(input, { file: avatarFile, remove: avatarRemoved })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể lưu cầu thủ.')
    }
  }

  const handleDelete = async () => {
    if (
      !onDelete ||
      !window.confirm('Xóa vĩnh viễn cầu thủ này? Lịch sử có thể khiến thao tác bị từ chối.')
    )
      return
    try {
      await onDelete()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể xóa cầu thủ.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && requestClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-dialog-title"
        className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-panel shadow-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/7 bg-panel/95 px-5 py-4 backdrop-blur-xl">
          <div>
            <h2 id="player-dialog-title" className="text-lg font-black text-white">
              {player ? 'Chỉnh sửa cầu thủ' : 'Thêm cầu thủ'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Tên, hạt giống và vị trí chính là bắt buộc.
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            aria-label="Đóng biểu mẫu"
            className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-white/6 hover:text-white focus-ring"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {submitError && (
            <p
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-400/8 p-3 text-xs leading-5 text-red-200"
            >
              {submitError}
            </p>
          )}

          <section className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.025] p-4 sm:flex-row sm:items-center">
            <PlayerAvatar
              src={avatarPreviewUrl ?? (!avatarRemoved ? player?.avatarUrl : undefined)}
              alt="Ảnh đại diện cầu thủ"
              className="mx-auto size-24 rounded-2xl ring-2 ring-white/10 sm:mx-0"
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-sm font-black text-white">Ảnh đại diện</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                JPG, PNG hoặc WebP · tối đa 5 MB. Ảnh được tự động tối ưu WebP 512 px trước khi tải
                lên; nếu không chọn, hệ thống dùng ảnh mặc định.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <label className={buttonClass('secondary', 'cursor-pointer px-3 text-xs')}>
                  <ImagePlus className="size-4" /> Chọn ảnh
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={isSaving}
                    aria-label="Chọn ảnh đại diện"
                    onChange={(event) => {
                      handleAvatarChange(event.target.files?.[0])
                      event.target.value = ''
                    }}
                  />
                </label>
                {(avatarFile || (!avatarRemoved && player?.avatarPath)) && (
                  <Button
                    variant="ghost"
                    className="px-3 text-xs text-red-300"
                    onClick={handleRemoveAvatar}
                    disabled={isSaving}
                  >
                    <Trash2 className="size-4" /> Xóa ảnh
                  </Button>
                )}
              </div>
              {avatarError && <p className="mt-2 text-xs text-red-300">{avatarError}</p>}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-2 block text-xs font-extrabold text-slate-300">
                Tên cầu thủ *
              </span>
              <input
                autoFocus
                value={input.name}
                onChange={(event) =>
                  setInput((current) => ({ ...current, name: event.target.value }))
                }
                className={inputClass}
                placeholder="Ví dụ: Nguyễn Văn A"
                maxLength={80}
              />
              {errors.name && (
                <span className="mt-1.5 block text-xs text-red-300">{errors.name}</span>
              )}
            </label>

            <label>
              <span className="mb-2 block text-xs font-extrabold text-slate-300">Biệt danh</span>
              <input
                value={input.nickname ?? ''}
                onChange={(event) =>
                  setInput((current) => ({ ...current, nickname: event.target.value }))
                }
                className={inputClass}
                placeholder="Không bắt buộc"
                maxLength={50}
              />
              {errors.nickname && (
                <span className="mt-1.5 block text-xs text-red-300">{errors.nickname}</span>
              )}
            </label>

            <label>
              <span className="mb-2 block text-xs font-extrabold text-slate-300">Hạt giống *</span>
              <select
                value={input.seed}
                onChange={(event) =>
                  setInput((current) => ({ ...current, seed: Number(event.target.value) as Seed }))
                }
                className={inputClass}
              >
                <option value={1}>Hạt giống 1 — mạnh</option>
                <option value={2}>Hạt giống 2 — trung bình</option>
                <option value={3}>Hạt giống 3 — yếu</option>
              </select>
            </label>

            <label className="sm:col-span-2">
              <span className="mb-2 block text-xs font-extrabold text-slate-300">
                Vị trí chính *
              </span>
              <select
                value={input.primaryPosition}
                onChange={(event) => {
                  const primaryPosition = event.target.value as Position
                  setInput((current) => ({
                    ...current,
                    primaryPosition,
                    secondaryPositions: current.secondaryPositions.filter(
                      (position) => position !== primaryPosition,
                    ),
                  }))
                }}
                className={inputClass}
              >
                {POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="text-xs font-extrabold text-slate-300">
              Vị trí phụ — tối đa {MAX_SECONDARY_POSITIONS}
            </legend>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {POSITIONS.filter((position) => position !== input.primaryPosition).map(
                (position) => {
                  const selected = input.secondaryPositions.includes(position)
                  const disabled =
                    !selected && input.secondaryPositions.length >= MAX_SECONDARY_POSITIONS
                  return (
                    <button
                      key={position}
                      type="button"
                      onClick={() => toggleSecondary(position)}
                      disabled={disabled}
                      aria-pressed={selected}
                      className={`min-h-11 rounded-xl border text-xs font-black transition focus-ring disabled:cursor-not-allowed disabled:opacity-35 ${selected ? 'border-brand-400/35 bg-brand-400/12 text-brand-300' : 'border-white/8 bg-white/4 text-slate-500 hover:text-white'}`}
                    >
                      {position}
                    </button>
                  )
                },
              )}
            </div>
            {errors.secondaryPositions && (
              <span className="mt-2 block text-xs text-red-300">{errors.secondaryPositions}</span>
            )}
          </fieldset>

          {player && (
            <label className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/4 px-4">
              <span>
                <span className="block text-xs font-extrabold text-white">Đang hoạt động</span>
                <span className="mt-0.5 block text-[11px] text-slate-500">
                  Tắt để ẩn khỏi danh sách điểm danh.
                </span>
              </span>
              <input
                type="checkbox"
                checked={input.isActive}
                onChange={(event) =>
                  setInput((current) => ({ ...current, isActive: event.target.checked }))
                }
                className="size-5 accent-green-500"
              />
            </label>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-white/7 pt-5 sm:flex-row sm:justify-between">
            {player && onDelete ? (
              <Button variant="danger" onClick={handleDelete} disabled={isSaving}>
                <Trash2 className="size-4" /> Xóa vĩnh viễn
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={requestClose}
                disabled={isSaving}
                className="flex-1 sm:flex-none"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving} className="flex-1 sm:flex-none">
                {player && !input.isActive ? (
                  <Power className="size-4" />
                ) : (
                  <Save className="size-4" />
                )}
                {isSaving ? 'Đang lưu...' : 'Lưu cầu thủ'}
              </Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}
