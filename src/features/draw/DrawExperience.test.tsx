import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { balanceTeams } from '../../algorithms/balanceTeams'
import { mockPlayers } from '../../data/mockData'
import { DrawExperience } from './DrawExperience'

describe('DrawExperience viewer mode', () => {
  it('hiển thị tiến trình admin nhưng khóa toàn bộ điều khiển vòng quay', () => {
    const result = balanceTeams(
      mockPlayers,
      mockPlayers.map((player) => player.id),
      2,
      'live-viewer-test',
      { candidateCount: 20 },
    )

    render(
      <MemoryRouter>
        <DrawExperience
          result={result}
          players={mockPlayers}
          readOnly
          liveState={{
            wheel: { status: 'paused', revealedCount: 2 },
            matchTitle: 'Kèo viewer',
            matchDate: '2026-11-15',
          }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('progressbar', { name: 'Tiến độ vòng quay' })).toHaveAttribute(
      'aria-valuenow',
      '2',
    )
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Bỏ qua hoạt ảnh' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Đặt lại vòng quay' })).toBeDisabled()
    expect(screen.getAllByText('Đã tạm dừng')).toHaveLength(2)
  })
})
