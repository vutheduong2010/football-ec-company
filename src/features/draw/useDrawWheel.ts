import { useEffect, useMemo, useReducer, useState } from 'react'

import {
  initialDrawWheelState,
  reduceDrawWheelState,
  type DrawWheelAction,
} from './drawWheelMachine'

interface DrawWheelOptions {
  intervalMs?: number
  reducedMotionIntervalMs?: number
  reducedMotion?: boolean
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return prefersReducedMotion
}

export function useDrawWheel(sequence: readonly string[], options: DrawWheelOptions = {}) {
  const systemReducedMotion = usePrefersReducedMotion()
  const reducedMotion = options.reducedMotion ?? systemReducedMotion
  const intervalMs = reducedMotion
    ? (options.reducedMotionIntervalMs ?? 180)
    : (options.intervalMs ?? 1_350)
  const [state, dispatch] = useReducer(
    (currentState: typeof initialDrawWheelState, action: DrawWheelAction) =>
      reduceDrawWheelState(currentState, action, sequence.length),
    initialDrawWheelState,
  )

  useEffect(() => {
    if (state.status !== 'spinning') return
    const timer = window.setTimeout(() => dispatch({ type: 'REVEAL_NEXT' }), intervalMs)
    return () => window.clearTimeout(timer)
  }, [intervalMs, state.revealedCount, state.status])

  const revealedIds = useMemo(
    () => sequence.slice(0, state.revealedCount),
    [sequence, state.revealedCount],
  )

  return {
    ...state,
    revealedIds,
    currentPlayerId: state.revealedCount < sequence.length ? sequence[state.revealedCount] : null,
    latestPlayerId: state.revealedCount > 0 ? sequence[state.revealedCount - 1] : null,
    remainingCount: sequence.length - state.revealedCount,
    progress: sequence.length === 0 ? 0 : state.revealedCount / sequence.length,
    reducedMotion,
    start: () => dispatch({ type: 'START' }),
    pause: () => dispatch({ type: 'PAUSE' }),
    resume: () => dispatch({ type: 'RESUME' }),
    skip: () => dispatch({ type: 'SKIP' }),
    reset: () => dispatch({ type: 'RESET' }),
  }
}
