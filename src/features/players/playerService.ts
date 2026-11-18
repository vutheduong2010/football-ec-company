import { requireSupabase } from '../../lib/supabaseClient'
import type { Database } from '../../types/database'
import {
  POSITION_GROUPS,
  POSITIONS,
  SEEDS,
  type Player,
  type PlayerInput,
  type Position,
  type Seed,
} from '../../types/player'
import {
  avatarFileExtension,
  getPlayerAvatarUrl,
  optimizeAvatarFile,
  PLAYER_AVATAR_BUCKET,
  validateAvatarFile,
} from './playerAvatar'
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

function isSeed(value: number): value is Seed {
  return SEEDS.includes(value as Seed)
}

export function mapPlayerRow(row: PlayerRow): Player {
  if (!isPosition(row.primary_position))
    throw new Error('Database trả về vị trí chính không hợp lệ.')
  if (!isSeed(row.seed)) throw new Error('Database trả về hạt giống không hợp lệ.')
  const secondary = row.secondary_positions.filter(isPosition)

  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname ?? undefined,
    seed: row.seed,
    primaryPosition: row.primary_position,
    secondaryPositions: secondary,
    positionGroup: POSITION_GROUPS[row.primary_position],
    isActive: row.is_active,
    avatarPath: row.avatar_path ?? undefined,
    avatarUrl: getPlayerAvatarUrl(row.avatar_path),
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

async function uploadPlayerAvatar(playerId: string, file: File) {
  const validationError = validateAvatarFile(file)
  if (validationError) throw new Error(validationError)

  const optimizedFile = await optimizeAvatarFile(file)

  const client = requireSupabase()
  const path = `${playerId}/${crypto.randomUUID()}.${avatarFileExtension(optimizedFile)}`
  const { error } = await client.storage.from(PLAYER_AVATAR_BUCKET).upload(path, optimizedFile, {
    cacheControl: '31536000',
    contentType: optimizedFile.type,
    upsert: false,
  })
  if (error) throw error
  return path
}

async function removePlayerAvatar(path?: string) {
  if (!path) return
  const client = requireSupabase()
  const { error } = await client.storage.from(PLAYER_AVATAR_BUCKET).remove([path])
  if (error) throw error
}

export async function createPlayerWithAvatar(input: PlayerInput, avatarFile?: File | null) {
  const client = requireSupabase()
  const id = crypto.randomUUID()
  let avatarPath: string | undefined

  try {
    if (avatarFile) avatarPath = await uploadPlayerAvatar(id, avatarFile)
    const { data, error } = await client
      .from('players')
      .insert({ id, ...toRowInput(input), avatar_path: avatarPath ?? null })
      .select()
      .single()
    if (error) throw error
    return mapPlayerRow(data)
  } catch (error) {
    if (avatarPath) await removePlayerAvatar(avatarPath).catch(() => undefined)
    throw error
  }
}

export async function updatePlayerWithAvatar(
  id: string,
  input: PlayerInput,
  currentAvatarPath: string | undefined,
  avatarFile: File | null,
  removeAvatar: boolean,
) {
  const client = requireSupabase()
  let uploadedPath: string | undefined

  try {
    if (avatarFile) uploadedPath = await uploadPlayerAvatar(id, avatarFile)
    const nextAvatarPath = uploadedPath ?? (removeAvatar ? null : (currentAvatarPath ?? null))
    const { data, error } = await client
      .from('players')
      .update({ ...toRowInput(input), avatar_path: nextAvatarPath })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    if (currentAvatarPath && currentAvatarPath !== nextAvatarPath) {
      await removePlayerAvatar(currentAvatarPath).catch(() => undefined)
    }
    return mapPlayerRow(data)
  } catch (error) {
    if (uploadedPath) await removePlayerAvatar(uploadedPath).catch(() => undefined)
    throw error
  }
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

export async function deletePlayerPermanently(id: string, avatarPath?: string) {
  const client = requireSupabase()
  const { error } = await client.from('players').delete().eq('id', id)
  if (error) throw error
  if (avatarPath) await removePlayerAvatar(avatarPath).catch(() => undefined)
}
