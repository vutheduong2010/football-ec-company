import type { Player } from '../../types/player'

type PlayerIdentity = Pick<Player, 'name' | 'nickname'>

export function getPlayerDisplayName(player: PlayerIdentity) {
  return player.nickname?.trim() || player.name.trim()
}
