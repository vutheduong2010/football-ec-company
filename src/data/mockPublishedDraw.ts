import { balanceTeams } from '../algorithms/balanceTeams'
import { buildPublishedDraw } from '../features/draw/drawService'
import { getPlayerDisplayName } from '../features/players/playerDisplay'
import type { Database } from '../types/database'
import { mockPlayers } from './mockData'

type SessionRow = Database['public']['Tables']['draw_sessions']['Row']
type AssignmentRow = Database['public']['Tables']['draw_assignments']['Row']

const session: SessionRow = {
  id: 'demo-1211',
  title: 'Kèo tối thứ Năm',
  match_date: '2026-11-12',
  team_count: 2,
  field_size: 7,
  status: 'published',
  created_by: 'demo-admin',
  algorithm_version: 'balanced-candidates-v5',
  draw_seed: 'demo-phase-6',
  created_at: '2026-11-12T12:00:00.000Z',
  published_at: '2026-11-12T12:05:00.000Z',
}

const balanced = balanceTeams(
  mockPlayers,
  mockPlayers.map((player) => player.id),
  2,
  'demo-phase-6',
  { candidateCount: 200 },
)

const assignments: AssignmentRow[] = balanced.assignments.map((assignment) => {
  const player = mockPlayers.find((item) => item.id === assignment.playerId)!
  return {
    id: `demo-assignment-${assignment.revealOrder + 1}`,
    session_id: session.id,
    player_id: player.id,
    team_index: assignment.teamIndex,
    is_starting: assignment.isStarting,
    reveal_order: assignment.revealOrder,
    player_name_snapshot: getPlayerDisplayName(player),
    seed_snapshot: player.seed,
    position_snapshot: player.primaryPosition,
    secondary_positions_snapshot: player.secondaryPositions,
  }
})

export const mockPublishedDraw = buildPublishedDraw(session, assignments)
