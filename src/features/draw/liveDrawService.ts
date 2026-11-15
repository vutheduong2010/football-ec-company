import type { BalanceResult } from '../../algorithms/balanceTeams'
import { requireSupabase } from '../../lib/supabaseClient'
import type { Database, Json } from '../../types/database'
import type { DrawWheelState, WheelStatus } from './drawWheelMachine'
import { emptyLiveDrawState, type LiveDrawState } from './liveDrawTypes'

type LiveDrawRow = Database['public']['Tables']['live_draw_state']['Row']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeWheel(value: unknown): DrawWheelState {
  if (!isRecord(value)) return emptyLiveDrawState.wheel
  const status = value.status as WheelStatus
  const revealedCount = value.revealedCount
  if (
    !['idle', 'spinning', 'paused', 'completed'].includes(status) ||
    !Number.isInteger(revealedCount) ||
    (revealedCount as number) < 0
  ) {
    return emptyLiveDrawState.wheel
  }
  return { status, revealedCount: revealedCount as number }
}

function normalizePreview(value: unknown): BalanceResult | null {
  if (!isRecord(value)) return null
  if (
    typeof value.drawSeed !== 'string' ||
    (value.teamCount !== 2 && value.teamCount !== 3) ||
    !Array.isArray(value.teams) ||
    !Array.isArray(value.assignments) ||
    !Array.isArray(value.revealSequence)
  ) {
    return null
  }
  return value as unknown as BalanceResult
}

export function normalizeLiveDrawRow(row: LiveDrawRow): LiveDrawState {
  const value = isRecord(row.state) ? row.state : {}
  const teamCount = value.teamCount === 3 ? 3 : 2
  const selectedPlayerIds = Array.isArray(value.selectedPlayerIds)
    ? value.selectedPlayerIds.filter((id): id is string => typeof id === 'string')
    : []
  return {
    version: 1,
    selectedPlayerIds,
    teamCount,
    preview: normalizePreview(value.preview),
    wheel: normalizeWheel(value.wheel),
    matchTitle: typeof value.matchTitle === 'string' ? value.matchTitle : '',
    matchDate: typeof value.matchDate === 'string' ? value.matchDate : '',
  }
}

function toJson(state: LiveDrawState): Json {
  return JSON.parse(JSON.stringify(state)) as Json
}

export async function getLiveDrawState() {
  const client = requireSupabase()
  const { data, error } = await client.from('live_draw_state').select('*').eq('id', 1).single()
  if (error) throw error
  return normalizeLiveDrawRow(data)
}

export async function saveLiveDrawState(state: LiveDrawState) {
  const client = requireSupabase()
  const { error } = await client
    .from('live_draw_state')
    .update({ state: toJson(state) })
    .eq('id', 1)
  if (error) throw error
}
