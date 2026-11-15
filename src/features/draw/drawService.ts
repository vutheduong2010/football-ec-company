import { scoreBalance } from '../../algorithms/scoreBalance'
import type { BalanceResult } from '../../algorithms/balanceTeams'
import { requireSupabase } from '../../lib/supabaseClient'
import type { Database, Json } from '../../types/database'
import type { PublishedAssignment, PublishedDraw } from '../../types/draw'
import {
  POSITION_GROUPS,
  POSITIONS,
  SEEDS,
  type Player,
  type Position,
  type Seed,
} from '../../types/player'

type SessionRow = Database['public']['Tables']['draw_sessions']['Row']
type AssignmentRow = Database['public']['Tables']['draw_assignments']['Row']

export interface PublishDrawInput {
  title: string
  matchDate: string
  result: BalanceResult
  players: readonly Player[]
}

function normalizeSnapshotPosition(value: string): Position | null {
  if (POSITIONS.includes(value as Position)) return value as Position
  if (value === 'CAM' || value === 'LM' || value === 'RM') return 'CM'
  return null
}

function toSnapshotPlayer(assignment: PublishedAssignment): Player {
  return {
    id: assignment.playerId,
    name: assignment.playerName,
    seed: assignment.seed,
    primaryPosition: assignment.position,
    secondaryPositions: assignment.secondaryPositions,
    positionGroup: POSITION_GROUPS[assignment.position],
    isActive: true,
  }
}

function mapAssignment(row: AssignmentRow): PublishedAssignment {
  const position = normalizeSnapshotPosition(row.position_snapshot)
  if (!position) {
    throw new Error('Kết quả đã lưu chứa vị trí không hợp lệ.')
  }
  if (!SEEDS.includes(row.seed_snapshot as Seed)) {
    throw new Error('Kết quả đã lưu chứa hạt giống không hợp lệ.')
  }
  const secondaryPositions = [
    ...new Set(row.secondary_positions_snapshot.map(normalizeSnapshotPosition)),
  ]
    .filter((secondary): secondary is Position => Boolean(secondary))
    .filter((secondary) => secondary !== position)

  return {
    id: row.id,
    sessionId: row.session_id,
    playerId: row.player_id,
    teamIndex: row.team_index,
    isStarting: row.is_starting,
    revealOrder: row.reveal_order,
    playerName: row.player_name_snapshot,
    seed: row.seed_snapshot as Seed,
    position,
    secondaryPositions,
  }
}

export function buildPublishedDraw(
  session: SessionRow,
  assignmentRows: readonly AssignmentRow[],
): PublishedDraw {
  if (session.status !== 'published' || !session.published_at) {
    throw new Error('Phiên chia đội chưa được công bố.')
  }
  if (session.team_count !== 2 && session.team_count !== 3) {
    throw new Error('Số đội trong phiên đã lưu không hợp lệ.')
  }

  const assignments = assignmentRows
    .filter((assignment) => assignment.session_id === session.id)
    .map(mapAssignment)
    .sort((left, right) => left.revealOrder - right.revealOrder)
  const teams = Array.from({ length: session.team_count }, (_, teamIndex) => {
    const teamAssignments = assignments.filter((assignment) => assignment.teamIndex === teamIndex)
    return {
      teamIndex,
      players: teamAssignments.map(toSnapshotPlayer),
      startingPlayerIds: teamAssignments
        .filter((assignment) => assignment.isStarting)
        .map((assignment) => assignment.playerId),
      reservePlayerIds: teamAssignments
        .filter((assignment) => !assignment.isStarting)
        .map((assignment) => assignment.playerId),
    }
  })
  const qualityMetrics = scoreBalance(
    teams.map((team) => team.players),
    teams.map((team) => team.players.length),
  )

  return {
    id: session.id,
    title: session.title,
    matchDate: session.match_date,
    teamCount: session.team_count,
    fieldSize: 7,
    status: 'published',
    algorithmVersion: session.algorithm_version,
    drawSeed: session.draw_seed,
    createdAt: session.created_at,
    publishedAt: session.published_at,
    assignments,
    teams,
    qualityMetrics,
  }
}

async function loadAssignments(sessionIds: string[]) {
  if (sessionIds.length === 0) return []
  const client = requireSupabase()
  const { data, error } = await client
    .from('draw_assignments')
    .select('*')
    .in('session_id', sessionIds)
    .order('reveal_order', { ascending: true })
  if (error) throw error
  return data
}

export async function listPublishedDraws() {
  const client = requireSupabase()
  const { data: sessions, error } = await client
    .from('draw_sessions')
    .select('*')
    .eq('status', 'published')
    .order('match_date', { ascending: false })
    .order('published_at', { ascending: false })
  if (error) throw error

  const assignments = await loadAssignments(sessions.map((session) => session.id))
  return sessions.map((session) => buildPublishedDraw(session, assignments))
}

export async function getPublishedDraw(id: string) {
  const client = requireSupabase()
  const { data: session, error } = await client
    .from('draw_sessions')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw error
  if (!session) return null

  const assignments = await loadAssignments([session.id])
  return buildPublishedDraw(session, assignments)
}

export async function deletePublishedDraw(id: string) {
  const client = requireSupabase()
  const { data, error } = await client.rpc('delete_published_draw', { p_session_id: id })
  if (error) throw error
  if (data !== true) throw new Error('Không thể xác nhận kết quả đã được xóa.')
}

export async function publishDraw(input: PublishDrawInput) {
  const title = input.title.trim()
  if (!title) throw new Error('Hãy nhập tên buổi đá.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.matchDate)) {
    throw new Error('Ngày thi đấu không hợp lệ.')
  }

  const playerById = new Map(input.players.map((player) => [player.id, player]))
  const assignments: Json = input.result.assignments.map((assignment) => {
    if (!playerById.has(assignment.playerId)) {
      throw new Error(`Không tìm thấy cầu thủ ${assignment.playerId} trong danh sách hiện tại.`)
    }
    return {
      player_id: assignment.playerId,
      team_index: assignment.teamIndex,
      is_starting: assignment.isStarting,
      reveal_order: assignment.revealOrder,
    }
  })

  const client = requireSupabase()
  const { data, error } = await client.rpc('publish_draw', {
    p_title: title,
    p_match_date: input.matchDate,
    p_team_count: input.result.teamCount,
    p_algorithm_version: input.result.algorithmVersion,
    p_draw_seed: input.result.drawSeed,
    p_assignments: assignments,
  })
  if (error) throw error
  return data
}
