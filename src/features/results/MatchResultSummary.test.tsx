import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { mockPublishedDraw } from '../../data/mockPublishedDraw'
import type { PublishedDraw } from '../../types/draw'
import { MatchResultSummary } from './MatchResultSummary'

describe('MatchResultSummary', () => {
  it('hiển thị W và L theo tỉ số hai đội', () => {
    render(<MatchResultSummary draw={{ ...mockPublishedDraw, teamScores: [4, 2] }} />)

    expect(screen.getByLabelText('Tỉ số 4 - 2')).toBeVisible()
    expect(screen.getByLabelText('Thắng')).toHaveTextContent('W')
    expect(screen.getByLabelText('Thua')).toHaveTextContent('L')
  })

  it('hiển thị D màu trung tính khi hai đội hòa', () => {
    render(<MatchResultSummary draw={{ ...mockPublishedDraw, teamScores: [2, 2] }} />)

    expect(screen.getAllByLabelText('Hòa')).toHaveLength(2)
    expect(screen.getAllByText('D')).toHaveLength(2)
  })

  it('hiển thị thứ hạng cho bảng ba đội', () => {
    const draw: PublishedDraw = {
      ...mockPublishedDraw,
      teamCount: 3,
      teams: [
        ...mockPublishedDraw.teams,
        { teamIndex: 2, players: [], startingPlayerIds: [], reservePlayerIds: [] },
      ],
      teamScores: null,
      teamRankings: [2, 0, 1],
    }

    render(<MatchResultSummary draw={draw} />)

    expect(screen.getByLabelText('Bảng xếp hạng ba đội')).toHaveTextContent('1STĐội C')
    expect(screen.getByLabelText('Bảng xếp hạng ba đội')).toHaveTextContent('2NDĐội A')
    expect(screen.getByLabelText('Bảng xếp hạng ba đội')).toHaveTextContent('3RDĐội B')
  })
})
