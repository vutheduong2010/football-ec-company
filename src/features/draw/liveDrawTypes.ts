import type { BalanceResult } from '../../algorithms/balanceTeams'
import type { DrawWheelState } from './drawWheelMachine'

export interface LiveDrawState {
  version: 1
  selectedPlayerIds: string[]
  teamCount: 2 | 3
  preview: BalanceResult | null
  wheel: DrawWheelState
  matchTitle: string
  matchDate: string
}

export interface LiveDrawExperienceState {
  wheel: DrawWheelState
  matchTitle: string
  matchDate: string
}

export const emptyLiveDrawState: LiveDrawState = {
  version: 1,
  selectedPlayerIds: [],
  teamCount: 2,
  preview: null,
  wheel: { status: 'idle', revealedCount: 0 },
  matchTitle: '',
  matchDate: '',
}
