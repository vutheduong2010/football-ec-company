export type Seed = 1 | 2
export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CM' | 'CAM' | 'LM' | 'RM' | 'ST'
export type PositionGroup = 'GK' | 'DEF' | 'MID' | 'ATT'

export const POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'LM', 'RM', 'ST']

export const POSITION_GROUPS: Record<Position, PositionGroup> = {
  GK: 'GK',
  CB: 'DEF',
  LB: 'DEF',
  RB: 'DEF',
  CM: 'MID',
  CAM: 'MID',
  LM: 'MID',
  RM: 'MID',
  ST: 'ATT',
}

export interface Player {
  id: string
  name: string
  nickname?: string
  seed: Seed
  primaryPosition: Position
  secondaryPositions: Position[]
  positionGroup: PositionGroup
  isActive: boolean
}

export interface PlayerInput {
  name: string
  nickname?: string
  seed: Seed
  primaryPosition: Position
  secondaryPositions: Position[]
  isActive: boolean
}
