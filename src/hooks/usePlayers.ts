import { useCallback, useEffect, useState } from 'react'

import { mockPlayers } from '../data/mockData'
import {
  createPlayerWithAvatar as createPlayerRequest,
  deletePlayerPermanently as deletePlayerRequest,
  listPlayers,
  setPlayerActive as setPlayerActiveRequest,
  updatePlayerWithAvatar as updatePlayerRequest,
} from '../features/players/playerService'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import type { Player, PlayerAvatarUpdate, PlayerInput } from '../types/player'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Đã có lỗi không xác định.'
}

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>(isSupabaseConfigured ? [] : mockPlayers)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setPlayers(mockPlayers)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      setPlayers(await listPlayers())
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true

    void listPlayers()
      .then((data) => {
        if (active) setPlayers(data)
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const mutate = useCallback(async <T>(request: () => Promise<T>) => {
    setIsMutating(true)
    setError(null)
    try {
      return await request()
    } catch (requestError) {
      const message = getErrorMessage(requestError)
      setError(message)
      throw requestError
    } finally {
      setIsMutating(false)
    }
  }, [])

  const createPlayer = useCallback(
    async (input: PlayerInput, avatar: PlayerAvatarUpdate) => {
      const player = await mutate(() => createPlayerRequest(input, avatar.file))
      setPlayers((current) =>
        [...current, player].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
      )
      return player
    },
    [mutate],
  )

  const updatePlayer = useCallback(
    async (id: string, input: PlayerInput, avatar: PlayerAvatarUpdate) => {
      const currentPlayer = players.find((player) => player.id === id)
      const player = await mutate(() =>
        updatePlayerRequest(id, input, currentPlayer?.avatarPath, avatar.file, avatar.remove),
      )
      setPlayers((current) => current.map((item) => (item.id === id ? player : item)))
      return player
    },
    [mutate, players],
  )

  const setPlayerActive = useCallback(
    async (id: string, isActive: boolean) => {
      const player = await mutate(() => setPlayerActiveRequest(id, isActive))
      setPlayers((current) => current.map((item) => (item.id === id ? player : item)))
      return player
    },
    [mutate],
  )

  const deletePlayerPermanently = useCallback(
    async (id: string) => {
      const currentPlayer = players.find((player) => player.id === id)
      await mutate(() => deletePlayerRequest(id, currentPlayer?.avatarPath))
      setPlayers((current) => current.filter((item) => item.id !== id))
    },
    [mutate, players],
  )

  return {
    players,
    isLoading,
    isMutating,
    error,
    isDemo: !isSupabaseConfigured,
    refresh,
    createPlayer,
    updatePlayer,
    setPlayerActive,
    deletePlayerPermanently,
  }
}
