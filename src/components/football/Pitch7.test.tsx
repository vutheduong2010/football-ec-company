import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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
})
