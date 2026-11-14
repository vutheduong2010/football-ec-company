import { describe, expect, it } from 'vitest'

import { initialDrawWheelState, reduceDrawWheelState } from './drawWheelMachine'

describe('drawWheelMachine', () => {
  it('đi qua đầy đủ idle → spinning → paused → completed', () => {
    const spinning = reduceDrawWheelState(initialDrawWheelState, { type: 'START' }, 3)
    const paused = reduceDrawWheelState(spinning, { type: 'PAUSE' }, 3)
    const resumed = reduceDrawWheelState(paused, { type: 'RESUME' }, 3)
    const firstReveal = reduceDrawWheelState(resumed, { type: 'REVEAL_NEXT' }, 3)
    const completed = reduceDrawWheelState(firstReveal, { type: 'SKIP' }, 3)

    expect(spinning).toEqual({ status: 'spinning', revealedCount: 0 })
    expect(paused.status).toBe('paused')
    expect(resumed.status).toBe('spinning')
    expect(firstReveal.revealedCount).toBe(1)
    expect(completed).toEqual({ status: 'completed', revealedCount: 3 })
    expect(reduceDrawWheelState(completed, { type: 'RESET' }, 3)).toEqual(initialDrawWheelState)
  })

  it('bỏ qua action không hợp lệ và chống start hai lần', () => {
    const spinning = reduceDrawWheelState(initialDrawWheelState, { type: 'START' }, 2)

    expect(reduceDrawWheelState(spinning, { type: 'START' }, 2)).toBe(spinning)
    expect(reduceDrawWheelState(spinning, { type: 'RESUME' }, 2)).toBe(spinning)
    expect(reduceDrawWheelState(initialDrawWheelState, { type: 'PAUSE' }, 2)).toBe(
      initialDrawWheelState,
    )
    expect(reduceDrawWheelState(initialDrawWheelState, { type: 'START' }, 0)).toBe(
      initialDrawWheelState,
    )
  })
})
