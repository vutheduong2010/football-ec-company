import { POSITION_GROUPS, type Player, type PositionGroup } from '../types/player'

const GROUPS: PositionGroup[] = ['GK', 'DEF', 'MID', 'ATT']
const OUTFIELD_GROUPS: Array<'DEF' | 'MID' | 'ATT'> = ['DEF', 'MID', 'ATT']

export type GroupMetric = Record<PositionGroup, number>

export interface TeamBalanceStats {
  size: number
  seedOne: number
  seedTwo: number
  primary: GroupMetric
  coverage: GroupMetric
}

export interface BalancePenalty {
  capacity: number
  goalkeeper: number
  seed: number
  positions: number
  lineup: number
}

export interface QualityMetrics {
  penalty: number
  qualityScore: number
  sizeRange: number
  seedOneRange: number
  goalkeeperRange: number
  positionRanges: Record<'DEF' | 'MID' | 'ATT', number>
  components: BalancePenalty
  teamStats: TeamBalanceStats[]
}

function emptyGroupMetric(): GroupMetric {
  return { GK: 0, DEF: 0, MID: 0, ATT: 0 }
}

function range(values: number[]) {
  if (values.length === 0) return 0
  return Math.max(...values) - Math.min(...values)
}

export function getTeamStats(players: readonly Player[]): TeamBalanceStats {
  const primary = emptyGroupMetric()
  const coverage = emptyGroupMetric()

  for (const player of players) {
    primary[player.positionGroup] += 1
    coverage[player.positionGroup] += 1

    const secondaryGroups = new Set(
      player.secondaryPositions.map((position) => POSITION_GROUPS[position]),
    )
    secondaryGroups.delete(player.positionGroup)
    for (const group of secondaryGroups) coverage[group] += 0.35
  }

  const seedOne = players.filter((player) => player.seed === 1).length
  return {
    size: players.length,
    seedOne,
    seedTwo: players.length - seedOne,
    primary,
    coverage,
  }
}

export function scoreBalance(
  teams: readonly (readonly Player[])[],
  capacities: readonly number[],
): QualityMetrics {
  const teamStats = teams.map(getTeamStats)
  const totalGoalkeepers = teamStats.reduce((total, team) => total + team.primary.GK, 0)
  const targetGoalkeeperTeams = Math.min(totalGoalkeepers, teams.length)
  const coveredGoalkeeperTeams = teamStats.filter((team) => team.primary.GK > 0).length

  const capacity =
    teamStats.reduce(
      (penalty, team, index) => penalty + Math.abs(team.size - (capacities[index] ?? 0)) * 10_000,
      0,
    ) + (range(teamStats.map((team) => team.size)) > 1 ? 1_000_000 : 0)

  const goalkeeper =
    Math.max(0, targetGoalkeeperTeams - coveredGoalkeeperTeams) * 220 +
    range(teamStats.map((team) => team.primary.GK)) * 24
  const seed = range(teamStats.map((team) => team.seedOne)) * 58

  const groupWeights: Record<'DEF' | 'MID' | 'ATT', number> = {
    DEF: 22,
    MID: 18,
    ATT: 14,
  }
  const positions = OUTFIELD_GROUPS.reduce((penalty, group) => {
    const coverageRange = range(teamStats.map((team) => team.coverage[group]))
    const primaryRange = range(teamStats.map((team) => team.primary[group]))
    return penalty + coverageRange * groupWeights[group] + primaryRange * 4
  }, 0)

  const lineupTargets: Partial<Record<PositionGroup, number>> = { GK: 1, DEF: 2, MID: 2, ATT: 1 }
  const lineup = teamStats.reduce((penalty, team) => {
    if (team.size < 7) return penalty
    return (
      penalty +
      GROUPS.reduce(
        (teamPenalty, group) =>
          teamPenalty + Math.max(0, (lineupTargets[group] ?? 0) - team.coverage[group]) * 3,
        0,
      )
    )
  }, 0)

  const components = { capacity, goalkeeper, seed, positions, lineup }
  const penalty = Object.values(components).reduce((total, value) => total + value, 0)

  return {
    penalty,
    qualityScore: Math.max(0, Math.round((100 * 500) / (500 + penalty))),
    sizeRange: range(teamStats.map((team) => team.size)),
    seedOneRange: range(teamStats.map((team) => team.seedOne)),
    goalkeeperRange: range(teamStats.map((team) => team.primary.GK)),
    positionRanges: {
      DEF: range(teamStats.map((team) => team.coverage.DEF)),
      MID: range(teamStats.map((team) => team.coverage.MID)),
      ATT: range(teamStats.map((team) => team.coverage.ATT)),
    },
    components,
    teamStats,
  }
}
