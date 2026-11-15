import { describe, expect, it } from 'vitest'

import type { Database } from '../../types/database'
import { normalizeLiveDrawRow } from './liveDrawService'

type LiveDrawRow = Database['public']['Tables']['live_draw_state']['Row']

function makeRow(state: LiveDrawRow['state']): LiveDrawRow {
  return {
    id: 1,
    state,
    updated_by: null,
    updated_at: '2026-11-15T00:00:00.000Z',
  }
}

describe('liveDrawService', () => {
  it('chuẩn hóa snapshot hợp lệ từ Supabase', () => {
    const state = normalizeLiveDrawRow(
      makeRow({
        version: 1,
        selectedPlayerIds: ['player-a', 'player-b'],
        teamCount: 3,
        preview: null,
        wheel: { status: 'paused', revealedCount: 4 },
        matchTitle: 'Kèo trực tiếp',
        matchDate: '2026-11-15',
      }),
    )

    expect(state).toEqual({
      version: 1,
      selectedPlayerIds: ['player-a', 'player-b'],
      teamCount: 3,
      preview: null,
      wheel: { status: 'paused', revealedCount: 4 },
      matchTitle: 'Kèo trực tiếp',
      matchDate: '2026-11-15',
    })
  })

  it('loại bỏ dữ liệu realtime không hợp lệ', () => {
    const state = normalizeLiveDrawRow(
      makeRow({
        selectedPlayerIds: ['valid', 42],
        teamCount: 9,
        preview: { drawSeed: 12 },
        wheel: { status: 'unknown', revealedCount: -1 },
      }),
    )

    expect(state.selectedPlayerIds).toEqual(['valid'])
    expect(state.teamCount).toBe(2)
    expect(state.preview).toBeNull()
    expect(state.wheel).toEqual({ status: 'idle', revealedCount: 0 })
  })
})
