import { POSITION_GROUPS, type Player, type Position } from '../types/player'

export const FORMATION: Array<{ position: Position; left: string; top: string }> = [
  { position: 'GK', left: '50%', top: '87%' },
  { position: 'LB', left: '22%', top: '67%' },
  { position: 'CB', left: '50%', top: '72%' },
  { position: 'RB', left: '78%', top: '67%' },
  { position: 'CM', left: '32%', top: '40%' },
  { position: 'CM', left: '68%', top: '40%' },
  { position: 'ST', left: '50%', top: '14%' },
]

export type PositionPreference = 'primary' | 'secondary' | 'group' | 'fallback'

export interface ArrangedLineupPlayer {
  player: Player
  slot: (typeof FORMATION)[number]
  preference: PositionPreference
}

function getPositionPreference(player: Player, position: Position): PositionPreference {
  if (player.primaryPosition === position) return 'primary'
  if (player.secondaryPositions.includes(position)) return 'secondary'
  if (player.positionGroup === POSITION_GROUPS[position]) return 'group'
  return 'fallback'
}

function isBetterLineup(
  candidate: { primary: number; secondary: number; group: number },
  current: { primary: number; secondary: number; group: number } | null,
) {
  if (!current) return true
  if (candidate.primary !== current.primary) return candidate.primary > current.primary
  if (candidate.secondary !== current.secondary) return candidate.secondary > current.secondary
  return candidate.group > current.group
}

export function arrangeLineup(players: readonly Player[]): ArrangedLineupPlayer[] {
  const lineupPlayers = players.slice(0, FORMATION.length)
  let best: ArrangedLineupPlayer[] = []
  let bestScore: { primary: number; secondary: number; group: number } | null = null

  const search = (playerIndex: number, usedSlots: Set<number>, current: ArrangedLineupPlayer[]) => {
    if (playerIndex >= lineupPlayers.length) {
      const score = current.reduce(
        (total, assignment) => ({
          primary: total.primary + Number(assignment.preference === 'primary'),
          secondary: total.secondary + Number(assignment.preference === 'secondary'),
          group: total.group + Number(assignment.preference === 'group'),
        }),
        { primary: 0, secondary: 0, group: 0 },
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
