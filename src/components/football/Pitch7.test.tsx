import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  arrangeLineup,
  createLineupPlayerIds,
  swapLineupPlayers,
} from '../../algorithms/arrangeLineup'
import type { Player } from '../../types/player'
import { Pitch7 } from './Pitch7'

const players: Player[] = [
  {
    id: 'player-1',
    name: 'Nguyễn Văn A',
    nickname: 'Tí',
    seed: 1,
    primaryPosition: 'GK',
    secondaryPositions: [],
    positionGroup: 'GK',
    isActive: true,
  },
  {
    id: 'player-2',
    name: 'Không biệt danh',
    seed: 3,
    primaryPosition: 'ST',
    secondaryPositions: [],
    positionGroup: 'ATT',
    isActive: true,
  },
]

describe('Pitch7', () => {
  it('ưu tiên biệt danh và fallback về tên trên sơ đồ sân', () => {
    render(<Pitch7 players={players} team="A" />)

    expect(screen.getByText('Tí')).toBeVisible()
    expect(screen.getByText('Không biệt danh')).toBeVisible()
    expect(screen.queryByText('Nguyễn Văn A')).not.toBeInTheDocument()
  })

  it('tối ưu toàn đội theo vị trí chính trước rồi mới tới vị trí phụ', () => {
    const lineupPlayers: Player[] = [
      {
        ...players[0],
        id: 'gk',
        primaryPosition: 'GK',
        positionGroup: 'GK',
      },
      {
        ...players[0],
        id: 'versatile-defender',
        primaryPosition: 'LB',
        secondaryPositions: ['CB'],
        positionGroup: 'DEF',
      },
      {
        ...players[0],
        id: 'left-back-only',
        primaryPosition: 'LB',
        secondaryPositions: [],
        positionGroup: 'DEF',
      },
      {
        ...players[0],
        id: 'right-back',
        primaryPosition: 'RB',
        positionGroup: 'DEF',
      },
      {
        ...players[0],
        id: 'midfielder-1',
        primaryPosition: 'CM',
        positionGroup: 'MID',
      },
      {
        ...players[0],
        id: 'midfielder-2',
        primaryPosition: 'CM',
        positionGroup: 'MID',
      },
      {
        ...players[0],
        id: 'striker',
        primaryPosition: 'ST',
        positionGroup: 'ATT',
      },
    ]

    const lineup = arrangeLineup(lineupPlayers)
    expect(lineup.find(({ slot }) => slot.position === 'LB')).toMatchObject({
      player: { id: 'left-back-only' },
      preference: 'primary',
    })
    expect(lineup.find(({ slot }) => slot.position === 'CB')).toMatchObject({
      player: { id: 'versatile-defender' },
      preference: 'secondary',
    })
  })

  it('ưu tiên để mọi cầu thủ có vị trí phù hợp trước khi tối đa vị trí chính', () => {
    const lineupPlayers: Player[] = [
      { ...players[0], id: 'gk' },
      {
        ...players[0],
        id: 'left-back',
        primaryPosition: 'LB',
        positionGroup: 'DEF',
      },
      {
        ...players[0],
        id: 'center-back',
        primaryPosition: 'CB',
        positionGroup: 'DEF',
      },
      {
        ...players[0],
        id: 'm-toan',
        primaryPosition: 'RB',
        secondaryPositions: ['CM'],
        positionGroup: 'DEF',
      },
      {
        ...players[0],
        id: 'duong-palmer',
        primaryPosition: 'CB',
        secondaryPositions: ['RB'],
        positionGroup: 'DEF',
      },
      {
        ...players[0],
        id: 'midfielder',
        primaryPosition: 'CM',
        positionGroup: 'MID',
      },
      {
        ...players[1],
        id: 'striker',
        primaryPosition: 'ST',
        positionGroup: 'ATT',
      },
    ]

    const lineup = arrangeLineup(lineupPlayers)
    expect(lineup.find(({ player }) => player.id === 'm-toan')).toMatchObject({
      slot: { position: 'CM' },
      preference: 'secondary',
    })
    expect(lineup.find(({ player }) => player.id === 'duong-palmer')).toMatchObject({
      slot: { position: 'RB' },
      preference: 'secondary',
    })
    expect(
      lineup.every(({ preference }) => preference === 'primary' || preference === 'secondary'),
    ).toBe(true)
  })

  it('hoán đổi được hai vị trí trên sân và cầu thủ chính với dự bị', () => {
    const starters = players.map((player, index) => ({ ...player, id: `starter-${index}` }))
    const initial = createLineupPlayerIds(starters)
    const [firstPlayerId, secondPlayerId] = Object.values(initial)

    const swappedOnPitch = swapLineupPlayers(initial, firstPlayerId!, secondPlayerId!)
    expect(Object.entries(swappedOnPitch).find(([, id]) => id === firstPlayerId)?.[0]).toBe(
      Object.entries(initial).find(([, id]) => id === secondPlayerId)?.[0],
    )

    const swappedWithReserve = swapLineupPlayers(swappedOnPitch, 'reserve-player', firstPlayerId!)
    expect(Object.values(swappedWithReserve)).toContain('reserve-player')
    expect(Object.values(swappedWithReserve)).not.toContain(firstPlayerId)
  })
})
