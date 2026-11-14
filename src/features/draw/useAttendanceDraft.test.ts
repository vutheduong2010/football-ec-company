import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { mockPlayers } from '../../data/mockData'
import { useAttendanceDraft } from './useAttendanceDraft'

describe('useAttendanceDraft', () => {
  beforeEach(() => localStorage.clear())

  it('mặc định chọn mọi cầu thủ đang hoạt động', async () => {
    const { result } = renderHook(() => useAttendanceDraft(mockPlayers))

    await waitFor(() => expect(result.current.initialized).toBe(true))
    expect(result.current.selectedPlayerIds).toHaveLength(mockPlayers.length)
  })

  it('lưu lựa chọn và số đội vào localStorage', async () => {
    const { result } = renderHook(() => useAttendanceDraft(mockPlayers))
    await waitFor(() => expect(result.current.initialized).toBe(true))

    act(() => {
      result.current.togglePlayer(mockPlayers[0].id)
      result.current.setTeamCount(3)
    })

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('football-ec-company:attendance:v1') ?? '{}')
      expect(saved.teamCount).toBe(3)
      expect(saved.selectedPlayerIds).not.toContain(mockPlayers[0].id)
    })
  })
})
