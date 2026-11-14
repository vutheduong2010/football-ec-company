import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Player } from '../../types/player'

const STORAGE_KEY = 'football-ec-company:attendance:v1'

interface AttendanceDraft {
  version: 1
  selectedPlayerIds: string[]
  teamCount: 2 | 3
  updatedAt: string
}

function readDraft(): AttendanceDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<AttendanceDraft>
    if (
      value.version !== 1 ||
      !Array.isArray(value.selectedPlayerIds) ||
      !value.selectedPlayerIds.every((id) => typeof id === 'string') ||
      (value.teamCount !== 2 && value.teamCount !== 3)
    ) {
      return null
    }
    return value as AttendanceDraft
  } catch {
    return null
  }
}

export function useAttendanceDraft(players: Player[]) {
  const [initialDraft] = useState(readDraft)
  const [selectionOverride, setSelectionOverride] = useState<string[] | null>(
    initialDraft?.selectedPlayerIds ?? null,
  )
  const [teamCount, setTeamCount] = useState<2 | 3>(initialDraft?.teamCount ?? 2)

  const activeIds = useMemo(
    () => players.filter((player) => player.isActive).map((player) => player.id),
    [players],
  )
  const selectedPlayerIds = useMemo(() => {
    if (selectionOverride === null) return activeIds
    const activeSet = new Set(activeIds)
    return selectionOverride.filter((id) => activeSet.has(id))
  }, [activeIds, selectionOverride])
  const initialized = players.length > 0

  useEffect(() => {
    if (!initialized) return
    const draft: AttendanceDraft = {
      version: 1,
      selectedPlayerIds,
      teamCount,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [initialized, selectedPlayerIds, teamCount])

  const togglePlayer = useCallback(
    (id: string) => {
      setSelectionOverride((current) => {
        const base = current ?? activeIds
        return base.includes(id) ? base.filter((playerId) => playerId !== id) : [...base, id]
      })
    },
    [activeIds],
  )

  const selectAll = useCallback(() => setSelectionOverride(activeIds), [activeIds])
  const clearSelection = useCallback(() => setSelectionOverride([]), [])
  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSelectionOverride(activeIds)
    setTeamCount(2)
  }, [activeIds])

  return {
    selectedPlayerIds,
    teamCount,
    setTeamCount,
    togglePlayer,
    selectAll,
    clearSelection,
    clearDraft,
    initialized,
  }
}
