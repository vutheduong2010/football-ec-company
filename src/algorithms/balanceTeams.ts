import { createSeededRandom, type SeededRandom } from './seededRandom'
import { scoreBalance, type QualityMetrics } from './scoreBalance'
import { POSITION_GROUPS, type Player, type PositionGroup } from '../types/player'

export const ALGORITHM_VERSION = 'balanced-candidates-v5'

export type TeamCount = 2 | 3

export type BalanceWarningCode =
  | 'DUPLICATE_SELECTION_REMOVED'
  | 'UNDER_SEVEN_PER_TEAM'
  | 'ROTATION_REQUIRED'
  | 'MISSING_GOALKEEPER'
  | 'POSITION_IMBALANCE'
  | 'SEED_DISTRIBUTION_LIMITED'

export interface BalanceWarning {
  code: BalanceWarningCode
  message: string
}

export interface TeamAssignment {
  playerId: string
  teamIndex: number
  isStarting: boolean
  revealOrder: number
}

export interface BalancedTeam {
  teamIndex: number
  playerIds: string[]
  startingPlayerIds: string[]
  reservePlayerIds: string[]
}

export interface BalanceResult {
  algorithmVersion: typeof ALGORITHM_VERSION
  drawSeed: string
  teamCount: TeamCount
  capacities: number[]
  teams: BalancedTeam[]
  assignments: TeamAssignment[]
  revealSequence: string[]
  qualityMetrics: QualityMetrics
  warnings: BalanceWarning[]
}

export interface BalanceOptions {
  candidateCount?: number
}

const GROUP_WEIGHT: Record<PositionGroup, number> = {
  GK: 130,
  DEF: 24,
  MID: 20,
  ATT: 16,
}

function getCapacities(playerCount: number, teamCount: TeamCount, drawSeed: string) {
  const minimum = Math.floor(playerCount / teamCount)
  const capacities = Array.from({ length: teamCount }, () => minimum)
  const remainder = playerCount % teamCount
  const random = createSeededRandom(`${drawSeed}|capacities`)

  for (const teamIndex of random.shuffle([...capacities.keys()]).slice(0, remainder)) {
    capacities[teamIndex] += 1
  }

  return capacities
}

function playerPriority(player: Player) {
  const secondaryGroups = new Set(
    player.secondaryPositions.map((position) => POSITION_GROUPS[position]),
  )
  return (player.positionGroup === 'GK' ? 100 : 0) + (4 - player.seed) * 6 + secondaryGroups.size
}

function assignmentCost(
  player: Player,
  team: readonly Player[],
  capacity: number,
  random: SeededRandom,
) {
  const seedPeers = team.filter((member) => member.seed === player.seed).length
  const primaryPeers = team.filter((member) => member.positionGroup === player.positionGroup).length
  const coveredSecondaryGroups = new Set(
    player.secondaryPositions.map((position) => POSITION_GROUPS[position]),
  )
  const usefulSecondaryGroups = [...coveredSecondaryGroups].filter(
    (group) => !team.some((member) => member.positionGroup === group),
  ).length
  const fillRatio = capacity === 0 ? 1 : team.length / capacity

  return (
    seedPeers * 38 +
    primaryPeers * GROUP_WEIGHT[player.positionGroup] +
    fillRatio * 14 -
    usefulSecondaryGroups * 3 +
    random.next() * 8
  )
}

function generateCandidate(
  players: readonly Player[],
  capacities: readonly number[],
  random: SeededRandom,
) {
  const randomized = random.shuffle(players).map((player, order) => ({ player, order }))
  randomized.sort(
    (left, right) =>
      playerPriority(right.player) - playerPriority(left.player) || left.order - right.order,
  )

  const teams: Player[][] = capacities.map(() => [])
  for (const { player } of randomized) {
    const availableTeams = teams
      .map((team, teamIndex) => ({
        teamIndex,
        cost:
          team.length < capacities[teamIndex]
            ? assignmentCost(player, team, capacities[teamIndex], random)
            : Number.POSITIVE_INFINITY,
      }))
      .filter((option) => Number.isFinite(option.cost))
      .sort((left, right) => left.cost - right.cost)

    teams[availableTeams[0].teamIndex].push(player)
  }

  return teams
}

function selectStartingSeven(team: readonly Player[], drawSeed: string, teamIndex: number) {
  if (team.length <= 7) return team.map((player) => player.id)

  const random = createSeededRandom(`${drawSeed}|starting|${teamIndex}`)
  return random
    .shuffle(team)
    .sort((left, right) => left.seed - right.seed)
    .slice(0, 7)
    .map((player) => player.id)
}

function buildWarnings(
  players: readonly Player[],
  teamCount: TeamCount,
  capacities: readonly number[],
  qualityMetrics: QualityMetrics,
  duplicateCount: number,
) {
  const warnings: BalanceWarning[] = []
  const goalkeeperCount = players.filter((player) => player.positionGroup === 'GK').length
  const uniqueSeeds = new Set(players.map((player) => player.seed))

  if (duplicateCount > 0) {
    warnings.push({
      code: 'DUPLICATE_SELECTION_REMOVED',
      message: `Đã loại ${duplicateCount} lượt chọn trùng trước khi chia đội.`,
    })
  }
  if (players.length < teamCount * 7) {
    warnings.push({
      code: 'UNDER_SEVEN_PER_TEAM',
      message: 'Chưa đủ 7 người mỗi đội; hệ thống không tạo cầu thủ ảo.',
    })
  }
  if (capacities.some((capacity) => capacity > 7)) {
    warnings.push({
      code: 'ROTATION_REQUIRED',
      message: 'Có đội trên 7 người; phần dư được xếp dự bị để luân phiên.',
    })
  }
  if (goalkeeperCount < teamCount) {
    warnings.push({
      code: 'MISSING_GOALKEEPER',
      message: `Chỉ có ${goalkeeperCount} thủ môn chính cho ${teamCount} đội; cần thống nhất người bắt thay.`,
    })
  }
  const absentGroups = (['DEF', 'MID', 'ATT'] as const).filter((group) =>
    players.every((player) => player.positionGroup !== group),
  )
  const skewedGroups = Object.values(qualityMetrics.positionRanges).some((value) => value > 1.35)
  if (absentGroups.length > 0 || skewedGroups) {
    warnings.push({
      code: 'POSITION_IMBALANCE',
      message:
        absentGroups.length > 0
          ? `Đầu vào không có nhóm ${absentGroups.join(', ')}; cân bằng vị trí bị giới hạn.`
          : 'Phân bố vị trí chưa đồng đều hoàn toàn; nên kiểm tra vai trò phụ trước khi đá.',
    })
  }
  if (uniqueSeeds.size === 1 || qualityMetrics.maxSeedRange > 1) {
    warnings.push({
      code: 'SEED_DISTRIBUTION_LIMITED',
      message: 'Phân bố hạt giống đầu vào hạn chế nên không thể cân bằng tuyệt đối.',
    })
  }

  return warnings
}

export function balanceTeams(
  allPlayers: readonly Player[],
  selectedPlayerIds: readonly string[],
  teamCount: TeamCount,
  drawSeed: string,
  options: BalanceOptions = {},
): BalanceResult {
  if (teamCount !== 2 && teamCount !== 3) throw new Error('Số đội phải là 2 hoặc 3.')
  if (!drawSeed.trim()) throw new Error('drawSeed không được để trống.')

  const playerById = new Map(allPlayers.map((player) => [player.id, player]))
  if (playerById.size !== allPlayers.length) throw new Error('Danh sách cầu thủ chứa ID trùng.')

  const uniqueSelectedIds = [...new Set(selectedPlayerIds)].sort()
  const duplicateCount = selectedPlayerIds.length - uniqueSelectedIds.length
  if (uniqueSelectedIds.length < teamCount) {
    throw new Error(`Cần ít nhất ${teamCount} cầu thủ để chia ${teamCount} đội.`)
  }

  const players = uniqueSelectedIds.map((playerId) => {
    const player = playerById.get(playerId)
    if (!player) throw new Error(`Không tìm thấy cầu thủ có ID ${playerId}.`)
    if (!player.isActive) throw new Error(`Cầu thủ ${player.name} đang bị vô hiệu hóa.`)
    return player
  })

  const candidateCount = options.candidateCount ?? 600
  if (!Number.isInteger(candidateCount) || candidateCount < 1 || candidateCount > 2_000) {
    throw new Error('candidateCount phải là số nguyên từ 1 đến 2000.')
  }

  const capacities = getCapacities(players.length, teamCount, drawSeed)
  const candidateRandom = createSeededRandom(`${drawSeed}|candidates`)
  let bestPenalty = Number.POSITIVE_INFINITY
  let bestCandidates: Player[][][] = []

  for (let index = 0; index < candidateCount; index += 1) {
    const teams = generateCandidate(players, capacities, candidateRandom)
    const metrics = scoreBalance(teams, capacities)

    if (metrics.penalty < bestPenalty - 0.000_001) {
      bestPenalty = metrics.penalty
      bestCandidates = [teams]
    } else if (Math.abs(metrics.penalty - bestPenalty) <= 0.000_001) {
      bestCandidates.push(teams)
    }
  }

  const selectedTeams = createSeededRandom(`${drawSeed}|winner`).pick(bestCandidates)
  const qualityMetrics = scoreBalance(selectedTeams, capacities)
  const revealSequence = createSeededRandom(`${drawSeed}|reveal`).shuffle(
    selectedTeams.flatMap((team) => team.map((player) => player.id)),
  )
  const revealOrderById = new Map(revealSequence.map((playerId, index) => [playerId, index]))

  const teams = selectedTeams.map((team, teamIndex): BalancedTeam => {
    const startingPlayerIds = selectStartingSeven(team, drawSeed, teamIndex)
    const startingSet = new Set(startingPlayerIds)
    return {
      teamIndex,
      playerIds: team.map((player) => player.id),
      startingPlayerIds,
      reservePlayerIds: team
        .filter((player) => !startingSet.has(player.id))
        .map((player) => player.id),
    }
  })

  const assignments = teams.flatMap((team) => {
    const startingSet = new Set(team.startingPlayerIds)
    return team.playerIds.map((playerId): TeamAssignment => ({
      playerId,
      teamIndex: team.teamIndex,
      isStarting: startingSet.has(playerId),
      revealOrder: revealOrderById.get(playerId) ?? -1,
    }))
  })

  assignments.sort((left, right) => left.revealOrder - right.revealOrder)

  return {
    algorithmVersion: ALGORITHM_VERSION,
    drawSeed,
    teamCount,
    capacities,
    teams,
    assignments,
    revealSequence,
    qualityMetrics,
    warnings: buildWarnings(players, teamCount, capacities, qualityMetrics, duplicateCount),
  }
}
