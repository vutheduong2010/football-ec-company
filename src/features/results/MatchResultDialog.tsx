import { Save, Trophy, X } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { Button } from '../../components/ui/Button'
import type { PostMatchResultInput } from '../draw/drawService'
import type { PublishedDraw } from '../../types/draw'

const inputClass =
  'min-h-12 w-full rounded-xl border border-white/9 bg-ink-950/70 px-3 text-center text-lg font-black text-white outline-none transition focus:border-brand-400/50 focus:ring-4 focus:ring-brand-400/10'
const rankingLabels = ['1ST', '2ND', '3RD'] as const

export function MatchResultDialog({
  draw,
  open,
  isSaving,
  error,
  onClose,
  onSubmit,
}: {
  draw: PublishedDraw | null
  open: boolean
  isSaving: boolean
  error: string | null
  onClose: () => void
  onSubmit: (result: PostMatchResultInput) => Promise<void>
}) {
  const [scores, setScores] = useState<[string, string]>(() =>
    draw?.teamScores ? (draw.teamScores.map(String) as [string, string]) : ['', ''],
  )
  const [rankings, setRankings] = useState<[number, number, number]>(
    () => draw?.teamRankings ?? [0, 1, 2],
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, onClose, open])

  if (!open || !draw) return null

  const updateRanking = (rankIndex: number, nextTeamIndex: number) => {
    setRankings((current) => {
      const next = [...current] as [number, number, number]
      const previousTeamIndex = next[rankIndex]
      const occupiedRankIndex = next.indexOf(nextTeamIndex)
      next[rankIndex] = nextTeamIndex
      if (occupiedRankIndex !== -1 && occupiedRankIndex !== rankIndex) {
        next[occupiedRankIndex] = previousTeamIndex
      }
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setValidationError(null)

    if (draw.teamCount === 2) {
      const parsed = scores.map(Number) as [number, number]
      if (
        scores.some((score) => score.trim() === '') ||
        parsed.some((score) => !Number.isInteger(score) || score < 0 || score > 99)
      ) {
        setValidationError('Mỗi tỉ số phải là số nguyên từ 0 đến 99.')
        return
      }
      await onSubmit({ teamScores: parsed, teamRankings: null })
      return
    }

    if (new Set(rankings).size !== 3) {
      setValidationError('Mỗi đội chỉ được xuất hiện một lần trong bảng xếp hạng.')
      return
    }
    await onSubmit({ teamScores: null, teamRankings: rankings })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && !isSaving && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-result-dialog-title"
        className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-panel shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-white/7 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-400/10 text-brand-300">
              <Trophy className="size-5" />
            </span>
            <div>
              <h2 id="match-result-dialog-title" className="text-lg font-black text-white">
                {draw.teamCount === 2 ? 'Tỉ số sau trận' : 'Bảng xếp hạng'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">{draw.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Đóng biểu mẫu kết quả"
            className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-white/6 hover:text-white focus-ring"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {(validationError || error) && (
            <p
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-400/8 p-3 text-xs leading-5 text-red-200"
            >
              {validationError ?? error}
            </p>
          )}

          {draw.teamCount === 2 ? (
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              {[0, 1]
                .map((teamIndex) => (
                  <label key={teamIndex} className="text-center">
                    <span className="mb-2 block text-xs font-extrabold text-slate-300">
                      Đội {String.fromCharCode(65 + teamIndex)}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      inputMode="numeric"
                      autoFocus={teamIndex === 0}
                      value={scores[teamIndex]}
                      onChange={(event) =>
                        setScores((current) => {
                          const next = [...current] as [string, string]
                          next[teamIndex] = event.target.value
                          return next
                        })
                      }
                      className={inputClass}
                      aria-label={`Tỉ số đội ${String.fromCharCode(65 + teamIndex)}`}
                    />
                  </label>
                ))
                .reduce<ReactNode[]>((items, field, index) => {
                  if (index === 1)
                    items.push(
                      <span key="separator" className="pb-3 text-xl font-black text-slate-600">
                        –
                      </span>,
                    )
                  items.push(field)
                  return items
                }, [])}
            </div>
          ) : (
            <div className="space-y-3">
              {rankings.map((teamIndex, rankIndex) => (
                <label key={rankIndex} className="grid grid-cols-[4rem_1fr] items-center gap-3">
                  <span
                    className={`text-center text-sm font-black ${rankIndex === 0 ? 'text-amber-300' : 'text-slate-400'}`}
                  >
                    {rankingLabels[rankIndex]}
                  </span>
                  <select
                    value={teamIndex}
                    onChange={(event) => updateRanking(rankIndex, Number(event.target.value))}
                    className={`${inputClass} text-left text-sm`}
                    aria-label={`${rankingLabels[rankIndex]} thuộc về đội`}
                  >
                    {[0, 1, 2].map((index) => (
                      <option key={index} value={index}>
                        Đội {String.fromCharCode(65 + index)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}

          <p className="rounded-xl border border-white/7 bg-white/3 p-3 text-xs leading-5 text-slate-500">
            Kết quả được lưu vào lịch sử thi đấu và có thể cập nhật lại bởi tài khoản admin.
          </p>

          <div className="flex gap-3 border-t border-white/7 pt-5">
            <Button variant="secondary" onClick={onClose} disabled={isSaving} className="flex-1">
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1">
              <Save className="size-4" /> {isSaving ? 'Đang lưu…' : 'Lưu kết quả'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
