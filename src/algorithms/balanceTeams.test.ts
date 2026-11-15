import { describe, expect, it } from 'vitest'

import { balanceTeams, type TeamCount } from './balanceTeams'
import { createSeededRandom } from './seededRandom'
import { POSITION_GROUPS, POSITIONS, type Player, type Position, type Seed } from '../types/player'

function makePlayers(
  count: number,
  overrides: (index: number) => Partial<Player> = () => ({}),
): Player[] {
  return Array.from({ length: count }, (_, index) => {
    const primaryPosition = POSITIONS[index % POSITIONS.length]
    return {
      id: `player-${index + 1}`,
      name: `Cầu thủ ${index + 1}`,
      seed: ((index % 3) + 1) as Seed,
      primaryPosition,
      secondaryPositions: [],
      positionGroup: POSITION_GROUPS[primaryPosition],
      isActive: true,
      ...overrides(index),
    }
  })
}

function assertCoreInvariants(
  players: Player[],
  selectedIds: string[],
  teamCount: TeamCount,
  seed: string,
) {
  const uniqueSelected = [...new Set(selectedIds)]
  const result = balanceTeams(players, selectedIds, teamCount, seed, { candidateCount: 50 })
  const assignedIds = result.assignments.map((assignment) => assignment.playerId)
  const sizes = result.teams.map((team) => team.playerIds.length)

  expect(new Set(assignedIds).size).toBe(uniqueSelected.length)
  expect([...assignedIds].sort()).toEqual([...uniqueSelected].sort())
  expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
  expect(sizes).toEqual(result.capacities)
  expect(result.revealSequence).toHaveLength(uniqueSelected.length)
  expect(new Set(result.revealSequence).size).toBe(uniqueSelected.length)
  expect(Number.isFinite(result.qualityMetrics.penalty)).toBe(true)
  expect(result.qualityMetrics.penalty).toBeGreaterThanOrEqual(0)
  expect(result.qualityMetrics.qualityScore).toBeGreaterThanOrEqual(0)
  expect(result.qualityMetrics.qualityScore).toBeLessThanOrEqual(100)

  return result
}

describe('balanceTeams', () => {
  it.each([
    [14, 2, [7, 7]],
    [21, 3, [7, 7, 7]],
    [24, 2, [12, 12]],
    [24, 3, [8, 8, 8]],
    [15, 2, [7, 8]],
    [22, 3, [7, 7, 8]],
  ] as const)('chia đúng capacity cho %i người / %i đội', (count, teamCount, expectedSizes) => {
    const players = makePlayers(count)
    const result = assertCoreInvariants(
      players,
      players.map((player) => player.id),
      teamCount,
      `capacity-${count}-${teamCount}`,
    )

    expect([...result.capacities].sort((left, right) => left - right)).toEqual(expectedSizes)
    expect(result.qualityMetrics.maxSeedRange).toBeLessThanOrEqual(1)
  })

  it.each([
    [2, 1],
    [3, 1],
    [3, 2],
    [3, 6],
  ] as const)('phân bổ %i đội với %i thủ môn hợp lý', (teamCount, goalkeeperCount) => {
    const players = makePlayers(21, (index) => {
      const primaryPosition: Position = index < goalkeeperCount ? 'GK' : index % 2 ? 'CB' : 'CM'
      return { primaryPosition, positionGroup: POSITION_GROUPS[primaryPosition] }
    })
    const result = assertCoreInvariants(
      players,
      players.map((player) => player.id),
      teamCount,
      `goalkeepers-${teamCount}-${goalkeeperCount}`,
    )
    const goalkeeperTeams = result.qualityMetrics.teamStats.filter(
      (team) => team.primary.GK > 0,
    ).length

    expect(goalkeeperTeams).toBe(Math.min(goalkeeperCount, teamCount))
    expect(result.warnings.some((warning) => warning.code === 'MISSING_GOALKEEPER')).toBe(
      goalkeeperCount < teamCount,
    )
  })

  it.each([
    ['toàn bộ seed 1', () => 1 as const],
    ['toàn bộ seed 2', () => 2 as const],
    ['toàn bộ seed 3', () => 3 as const],
    ['1 seed 1 và 20 seed 2', (index: number) => (index === 0 ? (1 as const) : (2 as const))],
  ])('xử lý đầu vào %s', (_, getSeed) => {
    const players = makePlayers(21, (index) => ({ seed: getSeed(index) }))
    assertCoreInvariants(
      players,
      players.map((player) => player.id),
      3,
      `seeds-${getSeed(0)}`,
    )
  })

  it('xử lý tất cả tiền đạo và tận dụng vị trí phụ mà không phá invariant', () => {
    const players = makePlayers(18, (index) => ({
      primaryPosition: 'ST',
      positionGroup: 'ATT',
      secondaryPositions: [index % 2 === 0 ? 'CB' : 'CM'],
    }))
    const result = assertCoreInvariants(
      players,
      players.map((player) => player.id),
      3,
      'all-strikers-flexible',
    )

    expect(result.warnings.some((warning) => warning.code === 'POSITION_IMBALANCE')).toBe(true)
  })

  it('dùng ID thay vì tên, bỏ người vắng và khử lượt chọn trùng', () => {
    const players = makePlayers(15, (index) => ({
      name: index < 2 ? 'Trùng tên' : `Cầu thủ ${index}`,
    }))
    const selectedIds = players.slice(0, 14).map((player) => player.id)
    const result = assertCoreInvariants(players, [...selectedIds, selectedIds[0]], 2, 'identity')

    expect(result.assignments.some((assignment) => assignment.playerId === players[14].id)).toBe(
      false,
    )
    expect(
      result.assignments.filter((assignment) => assignment.playerId === players[0].id),
    ).toHaveLength(1)
    expect(result.warnings.some((warning) => warning.code === 'DUPLICATE_SELECTION_REMOVED')).toBe(
      true,
    )
  })

  it('cùng input và draw seed luôn cho cùng kết quả', () => {
    const players = makePlayers(24)
    const selectedIds = players.map((player) => player.id)
    const first = balanceTeams(players, selectedIds, 3, 'same-seed', { candidateCount: 120 })
    const second = balanceTeams(players, selectedIds, 3, 'same-seed', { candidateCount: 120 })
    const reordered = balanceTeams(players, [...selectedIds].reverse(), 3, 'same-seed', {
      candidateCount: 120,
    })

    expect(second).toEqual(first)
    expect(reordered).toEqual(first)
  })

  it('các draw seed khác nhau tạo được nhiều phương án chất lượng tương đương', () => {
    const players = makePlayers(21)
    const selectedIds = players.map((player) => player.id)
    const signatures = new Set(
      Array.from({ length: 12 }, (_, index) =>
        balanceTeams(players, selectedIds, 3, `variation-${index}`, { candidateCount: 100 })
          .teams.map((team) => [...team.playerIds].sort().join(','))
          .join('|'),
      ),
    )

    expect(signatures.size).toBeGreaterThan(1)
  })

  it('xếp tối đa 7 người đá chính và phần dư làm dự bị', () => {
    const players = makePlayers(24)
    const result = balanceTeams(
      players,
      players.map((player) => player.id),
      2,
      'starting-seven',
      { candidateCount: 100 },
    )

    for (const team of result.teams) {
      expect(team.startingPlayerIds).toHaveLength(7)
      expect(team.reservePlayerIds).toHaveLength(team.playerIds.length - 7)
      expect(new Set([...team.startingPlayerIds, ...team.reservePlayerIds])).toEqual(
        new Set(team.playerIds),
      )
    }
  })

  it('ưu tiên đá chính theo thứ tự H1, H2 rồi H3', () => {
    const players = makePlayers(24)
    const playerById = new Map(players.map((player) => [player.id, player]))
    const result = balanceTeams(
      players,
      players.map((player) => player.id),
      2,
      'starting-seed-priority',
      { candidateCount: 100 },
    )

    for (const team of result.teams) {
      const startingSeeds = team.startingPlayerIds.map(
        (playerId) => playerById.get(playerId)?.seed ?? 3,
      )
      const reserveSeeds = team.reservePlayerIds.map(
        (playerId) => playerById.get(playerId)?.seed ?? 1,
      )

      expect(startingSeeds).toEqual([...startingSeeds].sort((left, right) => left - right))
      expect(Math.max(...startingSeeds)).toBeLessThanOrEqual(Math.min(...reserveSeeds))
    }
  })

  it('giữ invariant qua 1000 bộ dữ liệu ngẫu nhiên', () => {
    const random = createSeededRandom('property-cases-v1')

    for (let caseIndex = 0; caseIndex < 1_000; caseIndex += 1) {
      const teamCount = (random.next() < 0.5 ? 2 : 3) as TeamCount
      const playerCount = teamCount + random.int(25 - teamCount)
      const players = makePlayers(playerCount, (index) => {
        const primaryPosition = POSITIONS[random.int(POSITIONS.length)]
        const secondaryPositions = random
          .shuffle(POSITIONS.filter((position) => position !== primaryPosition))
          .slice(0, random.int(4))
        return {
          id: `case-${caseIndex}-player-${index}`,
          seed: (random.int(3) + 1) as Seed,
          primaryPosition,
          secondaryPositions,
          positionGroup: POSITION_GROUPS[primaryPosition],
        }
      })
      const selectedIds = players
        .filter(() => random.next() > 0.15)
        .map((player) => player.id)
        .slice(0, 24)
      for (const player of players) {
        if (selectedIds.length >= teamCount) break
        if (!selectedIds.includes(player.id)) selectedIds.push(player.id)
      }

      assertCoreInvariants(players, selectedIds, teamCount, `property-${caseIndex}`)
    }
  })

  it('từ chối cầu thủ bị vô hiệu hóa trong đầu vào đã chọn', () => {
    const players = makePlayers(4, (index) => (index === 0 ? { isActive: false } : {}))
    expect(() =>
      balanceTeams(
        players,
        players.map((player) => player.id),
        2,
        'inactive-player',
      ),
    ).toThrow('đang bị vô hiệu hóa')
  })
})
