import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDrawWheel } from './useDrawWheel'

describe('useDrawWheel', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('tự động reveal đúng thứ tự và hoàn tất 24 người', () => {
    const sequence = Array.from({ length: 24 }, (_, index) => `player-${index + 1}`)
    const { result } = renderHook(() =>
      useDrawWheel(sequence, { intervalMs: 100, reducedMotion: false }),
    )

    act(() => result.current.start())
    for (let index = 0; index < sequence.length; index += 1) {
      act(() => vi.advanceTimersByTime(100))
      expect(result.current.revealedIds).toEqual(sequence.slice(0, index + 1))
    }

    expect(result.current.status).toBe('completed')
    expect(result.current.remainingCount).toBe(0)
    expect(result.current.progress).toBe(1)
  })

  it('pause hủy timer, resume tiếp tục và không đổi thứ tự kết quả', () => {
    const sequence = ['a', 'b', 'c']
    const { result } = renderHook(() =>
      useDrawWheel(sequence, { intervalMs: 100, reducedMotion: false }),
    )

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(100))
    act(() => result.current.pause())
    act(() => vi.advanceTimersByTime(1_000))
    expect(result.current.revealedIds).toEqual(['a'])

    act(() => result.current.resume())
    act(() => vi.advanceTimersByTime(100))
    expect(result.current.revealedIds).toEqual(['a', 'b'])

    act(() => result.current.skip())
    expect(result.current.status).toBe('completed')
    expect(result.current.revealedIds).toEqual(sequence)

    act(() => result.current.reset())
    expect(result.current.status).toBe('idle')
    expect(result.current.revealedIds).toEqual([])
  })

  it('không tạo hai nhịp reveal khi start bị gọi liên tiếp', () => {
    const { result } = renderHook(() =>
      useDrawWheel(['a', 'b'], { intervalMs: 100, reducedMotion: false }),
    )

    act(() => {
      result.current.start()
      result.current.start()
    })
    act(() => vi.advanceTimersByTime(100))

    expect(result.current.revealedIds).toEqual(['a'])
  })

  it('rút ngắn mỗi lượt khi người dùng bật reduced motion', () => {
    const { result } = renderHook(() =>
      useDrawWheel(['a', 'b'], {
        intervalMs: 1_000,
        reducedMotionIntervalMs: 20,
        reducedMotion: true,
      }),
    )

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(20))

    expect(result.current.reducedMotion).toBe(true)
    expect(result.current.revealedIds).toEqual(['a'])
  })

  it('cleanup timer khi component unmount', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
    const { result, unmount } = renderHook(() =>
      useDrawWheel(['a', 'b'], { intervalMs: 100, reducedMotion: false }),
    )

    act(() => result.current.start())
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})
