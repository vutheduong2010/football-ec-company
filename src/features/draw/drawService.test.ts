import { beforeEach, describe, expect, it, vi } from 'vitest'

import { balanceTeams } from '../../algorithms/balanceTeams'
import type { Database } from '../../types/database'
import { POSITION_GROUPS, type Player, type Position, type Seed } from '../../types/player'
import { buildPublishedDraw, publishDraw } from './drawService'

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }))

vi.mock('../../lib/supabaseClient', () => ({
  requireSupabase: () => ({ rpc: rpcMock }),
}))

type SessionRow = Database['public']['Tables']['draw_sessions']['Row']
type AssignmentRow = Database['public']['Tables']['draw_assignments']['Row']

const positions: Position[] = ['GK', 'CB', 'LB', 'RB', 'CM', 'ST']

function makePlayers(count = 14): Player[] {
  return Array.from({ length: count }, (_, index) => {
    const primaryPosition = positions[index % positions.length]
    return {
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      name: `Cầu thủ ${index + 1}`,
      nickname: index === 0 ? 'Người gác đền' : undefined,
      seed: ((index % 3) + 1) as Seed,
      primaryPosition,
      secondaryPositions: [],
      positionGroup: POSITION_GROUPS[primaryPosition],
      isActive: true,
    }
  })
}

function makeSession(): SessionRow {
  return {
    id: '10000000-0000-4000-8000-000000000001',
    title: 'Kèo kiểm thử',
    match_date: '2026-11-14',
    team_count: 2,
    field_size: 7,
    status: 'published',
    created_by: '20000000-0000-4000-8000-000000000001',
    algorithm_version: 'balanced-candidates-v2',
    draw_seed: 'test-seed',
    created_at: '2026-11-14T10:00:00.000Z',
    published_at: '2026-11-14T10:05:00.000Z',
  }
}

describe('drawService', () => {
  beforeEach(() => rpcMock.mockReset())

  it('dựng lại đội hình và metrics từ snapshot bất biến', () => {
    const players = makePlayers()
    const rows: AssignmentRow[] = players.map((player, index) => ({
      id: `30000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      session_id: makeSession().id,
      player_id: player.id,
      team_index: index % 2,
      is_starting: index < 12,
      reveal_order: index,
      player_name_snapshot: player.nickname ?? player.name,
      seed_snapshot: player.seed,
      position_snapshot: player.primaryPosition,
    }))

    const draw = buildPublishedDraw(makeSession(), rows)

    expect(draw.teams.map((team) => team.players.length)).toEqual([7, 7])
    expect(draw.assignments).toHaveLength(14)
    expect(draw.teams[0].reservePlayerIds).toHaveLength(1)
    expect(draw.teams[1].reservePlayerIds).toHaveLength(1)
    expect(draw.qualityMetrics.sizeRange).toBe(0)
    expect(draw.teams[0].players[0].name).toBe('Người gác đền')
  })

  it('gọi RPC publish_draw đúng một lần với assignments đã khóa', async () => {
    const players = makePlayers()
    const result = balanceTeams(
      players,
      players.map((player) => player.id),
      2,
      'publish-test',
      { candidateCount: 20 },
    )
    rpcMock.mockResolvedValue({
      data: '40000000-0000-4000-8000-000000000001',
      error: null,
    })

    const sessionId = await publishDraw({
      title: '  Kèo thứ Bảy  ',
      matchDate: '2026-11-14',
      result,
      players,
    })

    expect(sessionId).toBe('40000000-0000-4000-8000-000000000001')
    expect(rpcMock).toHaveBeenCalledTimes(1)
    expect(rpcMock).toHaveBeenCalledWith(
      'publish_draw',
      expect.objectContaining({
        p_title: 'Kèo thứ Bảy',
        p_team_count: 2,
        p_draw_seed: 'publish-test',
        p_assignments: expect.arrayContaining([
          expect.objectContaining({ player_id: players[0].id }),
        ]),
      }),
    )
  })
})
