import { useCallback, useEffect, useState } from 'react'

import { listPublishedDraws } from '../features/draw/drawService'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import type { PublishedDraw } from '../types/draw'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể tải lịch sử chia đội.'
}

export function usePublishedDraws() {
  const [draws, setDraws] = useState<PublishedDraw[]>([])
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      setDraws(await listPublishedDraws())
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let active = true
    void listPublishedDraws()
      .then((publishedDraws) => {
        if (active) setDraws(publishedDraws)
      })
      .catch((requestError: unknown) => {
        if (active) setError(errorMessage(requestError))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { draws, isLoading, error, refresh, isDemo: !isSupabaseConfigured }
}
