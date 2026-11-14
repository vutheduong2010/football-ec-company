export type WheelStatus = 'idle' | 'spinning' | 'paused' | 'completed'

export interface DrawWheelState {
  status: WheelStatus
  revealedCount: number
}

export type DrawWheelAction =
  | { type: 'START' }
  | { type: 'REVEAL_NEXT' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SKIP' }
  | { type: 'RESET' }

export const initialDrawWheelState: DrawWheelState = {
  status: 'idle',
  revealedCount: 0,
}

export function reduceDrawWheelState(
  state: DrawWheelState,
  action: DrawWheelAction,
  sequenceLength: number,
): DrawWheelState {
  switch (action.type) {
    case 'START':
      if (state.status !== 'idle' || sequenceLength === 0) return state
      return { ...state, status: 'spinning' }

    case 'REVEAL_NEXT': {
      if (state.status !== 'spinning') return state
      const revealedCount = Math.min(sequenceLength, state.revealedCount + 1)
      return {
        status: revealedCount >= sequenceLength ? 'completed' : 'spinning',
        revealedCount,
      }
    }

    case 'PAUSE':
      return state.status === 'spinning' ? { ...state, status: 'paused' } : state

    case 'RESUME':
      return state.status === 'paused' ? { ...state, status: 'spinning' } : state

    case 'SKIP':
      if (state.status === 'completed' || sequenceLength === 0) return state
      return { status: 'completed', revealedCount: sequenceLength }

    case 'RESET':
      return initialDrawWheelState
  }
}
