import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PlayerFormDialog } from './PlayerFormDialog'

describe('PlayerFormDialog', () => {
  it('hiển thị ba hạt giống và đúng sáu vị trí mới', () => {
    render(
      <PlayerFormDialog open player={null} isSaving={false} onClose={vi.fn()} onSubmit={vi.fn()} />,
    )

    expect(screen.getByRole('option', { name: 'Hạt giống 1 — mạnh' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'Hạt giống 2 — trung bình' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'Hạt giống 3 — yếu' })).toBeVisible()

    const primarySelect = screen.getByLabelText('Vị trí chính *')
    expect(primarySelect.querySelectorAll('option')).toHaveLength(6)
    expect(primarySelect).toHaveTextContent('GK')
    expect(primarySelect).toHaveTextContent('CB')
    expect(primarySelect).toHaveTextContent('LB')
    expect(primarySelect).toHaveTextContent('RB')
    expect(primarySelect).toHaveTextContent('CM')
    expect(primarySelect).toHaveTextContent('ST')
    expect(primarySelect).not.toHaveTextContent('CAM')
  })
})
