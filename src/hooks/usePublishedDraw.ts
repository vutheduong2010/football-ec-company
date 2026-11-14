import { useEffect, useState } from 'react'

import { getPublishedDraw } from '../features/draw/drawService'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import type { PublishedDraw } from '../types/draw'

export function usePublishedDraw(id: string | undefined) {
  const [result, setResult] = useState<{
    id: string | undefined
    draw: PublishedDraw | null
    error: string | null
  }>({ id: undefined, draw: null, error: null })

  useEffect(() => {
    if (!isSupabaseConfigured || !id) return

    let active = true
    void getPublishedDraw(id)
      .then((draw) => {
        if (active) setResult({ id, draw, error: null })
      })
      .catch((requestError: unknown) => {
        if (active)
          setResult({
            id,
            draw: null,
            error: requestError instanceof Error ? requestError.message : 'Không thể tải kết quả.',
          })
      })

    return () => {
      active = false
    }
  }, [id])

  return {
    draw: result.id === id ? result.draw : null,
    isLoading: Boolean(isSupabaseConfigured && id && result.id !== id),
    error: result.id === id ? result.error : null,
    isDemo: !isSupabaseConfigured,
  }
}
