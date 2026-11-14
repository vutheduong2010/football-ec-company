import { requireSupabase } from '../../lib/supabaseClient'
import type { Database } from '../../types/database'
import {
  POSITION_GROUPS,
  POSITIONS,
  type Player,
  type PlayerInput,
  type Position,
  type Seed,
} from '../../types/player'
import { normalizePlayerInput, validatePlayerInput } from './playerValidation'

type PlayerRow = Database['public']['Tables']['players']['Row']

function assertValidInput(input: PlayerInput) {
  const errors = validatePlayerInput(input)
  const firstError = Object.values(errors)[0]
  if (firstError) throw new Error(firstError)
}

function isPosition(value: string): value is Position {
  return POSITIONS.includes(value as Position)
}

export function mapPlayerRow(row: PlayerRow): Player {
  if (!isPosition(row.primary_position))
    throw new Error('Database trả về vị trí chính không hợp lệ.')
  const secondary = row.secondary_positions.filter(isPosition)

  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname ?? undefined,
    seed: row.seed as Seed,
    primaryPosition: row.primary_position,
    secondaryPositions: secondary,
    positionGroup: POSITION_GROUPS[row.primary_position],
    isActive: row.is_active,
  }
}

function toRowInput(input: PlayerInput) {
  const normalized = normalizePlayerInput(input)
  assertValidInput(normalized)
  return {
    name: normalized.name,
    nickname: normalized.nickname ?? null,
    seed: normalized.seed,
    primary_position: normalized.primaryPosition,
    secondary_positions: normalized.secondaryPositions,
    is_active: normalized.isActive,
  }
}

export async function listPlayers() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('players')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name', { ascending: true })
  if (error) throw error
  return data.map(mapPlayerRow)
}

export async function createPlayer(input: PlayerInput) {
  const client = requireSupabase()
  const { data, error } = await client.from('players').insert(toRowInput(input)).select().single()
  if (error) throw error
  return mapPlayerRow(data)
}

export async function updatePlayer(id: string, input: PlayerInput) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('players')
    .update(toRowInput(input))
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapPlayerRow(data)
}

export async function setPlayerActive(id: string, isActive: boolean) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('players')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapPlayerRow(data)
}

export async function deletePlayerPermanently(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('players').delete().eq('id', id)
  if (error) throw error
}
