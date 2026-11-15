import type { Player } from '../../types/player'

type PlayerIdentity = Pick<Player, 'name' | 'nickname'>

export function getPlayerDisplayName(player: PlayerIdentity) {
  return player.nickname?.trim() || player.name.trim()
}

export function getPlayerInitials(player: PlayerIdentity) {
  const words = getPlayerDisplayName(player).split(/\s+/).filter(Boolean)
  return words
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toLocaleUpperCase('vi')
    .slice(0, 2)
}
