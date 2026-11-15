import type { QualityMetrics } from '../algorithms/scoreBalance'
import type { Player, Seed } from './player'

export interface PublishedAssignment {
  id: string
  sessionId: string
  playerId: string
  teamIndex: number
  isStarting: boolean
  revealOrder: number
  playerName: string
  seed: Seed
  position: Player['primaryPosition']
  secondaryPositions: Player['secondaryPositions']
}

export interface PublishedTeam {
  teamIndex: number
  players: Player[]
  startingPlayerIds: string[]
  reservePlayerIds: string[]
}

export interface PublishedDraw {
  id: string
  title: string
  matchDate: string
  teamCount: 2 | 3
  fieldSize: 7
  status: 'published'
  algorithmVersion: string
  drawSeed: string
  createdAt: string
  publishedAt: string
  assignments: PublishedAssignment[]
  teams: PublishedTeam[]
  qualityMetrics: QualityMetrics
}
