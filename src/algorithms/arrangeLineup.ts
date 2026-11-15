import { POSITION_GROUPS, type Player, type Position } from '../types/player'

export type FormationSlotId = 'gk' | 'lb' | 'cb' | 'rb' | 'cm-left' | 'cm-right' | 'st'
export type LineupPlayerIds = Partial<Record<FormationSlotId, string>>

export const FORMATION: Array<{
  id: FormationSlotId
  position: Position
  left: string
  top: string
}> = [
  { id: 'gk', position: 'GK', left: '50%', top: '87%' },
  { id: 'lb', position: 'LB', left: '22%', top: '67%' },
  { id: 'cb', position: 'CB', left: '50%', top: '72%' },
  { id: 'rb', position: 'RB', left: '78%', top: '67%' },
  { id: 'cm-left', position: 'CM', left: '32%', top: '40%' },
  { id: 'cm-right', position: 'CM', left: '68%', top: '40%' },
  { id: 'st', position: 'ST', left: '50%', top: '14%' },
]

export type PositionPreference = 'primary' | 'secondary' | 'group' | 'fallback'

export interface ArrangedLineupPlayer {
  player: Player
  slot: (typeof FORMATION)[number]
  preference: PositionPreference
}

export function getPositionPreference(player: Player, position: Position): PositionPreference {
  if (player.primaryPosition === position) return 'primary'
  if (player.secondaryPositions.includes(position)) return 'secondary'
  if (player.positionGroup === POSITION_GROUPS[position]) return 'group'
  return 'fallback'
}

function isBetterLineup(
  candidate: { compatible: number; primary: number; secondary: number; group: number },
  current: { compatible: number; primary: number; secondary: number; group: number } | null,
) {
  if (!current) return true
  if (candidate.compatible !== current.compatible) return candidate.compatible > current.compatible
  if (candidate.primary !== current.primary) return candidate.primary > current.primary
  if (candidate.secondary !== current.secondary) return candidate.secondary > current.secondary
  return candidate.group > current.group
}

export function arrangeLineup(players: readonly Player[]): ArrangedLineupPlayer[] {
  const lineupPlayers = players.slice(0, FORMATION.length)
  let best: ArrangedLineupPlayer[] = []
  let bestScore: {
    compatible: number
    primary: number
    secondary: number
    group: number
  } | null = null

  const search = (playerIndex: number, usedSlots: Set<number>, current: ArrangedLineupPlayer[]) => {
    if (playerIndex >= lineupPlayers.length) {
      const score = current.reduce(
        (total, assignment) => ({
          compatible:
            total.compatible +
            Number(assignment.preference === 'primary' || assignment.preference === 'secondary'),
          primary: total.primary + Number(assignment.preference === 'primary'),
          secondary: total.secondary + Number(assignment.preference === 'secondary'),
          group: total.group + Number(assignment.preference === 'group'),
        }),
        { compatible: 0, primary: 0, secondary: 0, group: 0 },
      )

      if (isBetterLineup(score, bestScore)) {
        bestScore = score
        best = [...current]
      }
      return
    }

    for (let slotIndex = 0; slotIndex < FORMATION.length; slotIndex += 1) {
      if (usedSlots.has(slotIndex)) continue
      const slot = FORMATION[slotIndex]
      const player = lineupPlayers[playerIndex]
      usedSlots.add(slotIndex)
      current.push({ player, slot, preference: getPositionPreference(player, slot.position) })
      search(playerIndex + 1, usedSlots, current)
      current.pop()
      usedSlots.delete(slotIndex)
    }
  }

  search(0, new Set(), [])
  return best.sort((left, right) => FORMATION.indexOf(left.slot) - FORMATION.indexOf(right.slot))
}

export function createLineupPlayerIds(players: readonly Player[]): LineupPlayerIds {
  return Object.fromEntries(
    arrangeLineup(players).map(({ player, slot }) => [slot.id, player.id]),
  ) as LineupPlayerIds
}

export function arrangeLineupFromPlayerIds(
  players: readonly Player[],
  lineupPlayerIds: LineupPlayerIds,
): ArrangedLineupPlayer[] {
  const playerById = new Map(players.map((player) => [player.id, player]))
  return FORMATION.flatMap((slot) => {
    const playerId = lineupPlayerIds[slot.id]
    const player = playerId ? playerById.get(playerId) : undefined
    return player
      ? [{ player, slot, preference: getPositionPreference(player, slot.position) }]
      : []
  })
}

export function swapLineupPlayers(
  lineupPlayerIds: LineupPlayerIds,
  sourcePlayerId: string,
  targetPlayerId: string,
): LineupPlayerIds {
  if (sourcePlayerId === targetPlayerId) return lineupPlayerIds

  const entries = Object.entries(lineupPlayerIds) as Array<[FormationSlotId, string]>
  const sourceSlot = entries.find(([, playerId]) => playerId === sourcePlayerId)?.[0]
  const targetSlot = entries.find(([, playerId]) => playerId === targetPlayerId)?.[0]
  if (!sourceSlot && !targetSlot) return lineupPlayerIds

  const next = { ...lineupPlayerIds }
  if (sourceSlot && targetSlot) {
    next[sourceSlot] = targetPlayerId
    next[targetSlot] = sourcePlayerId
  } else if (sourceSlot) {
    next[sourceSlot] = targetPlayerId
  } else if (targetSlot) {
    next[targetSlot] = sourcePlayerId
  }
  return next
}
