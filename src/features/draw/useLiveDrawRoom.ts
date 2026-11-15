import { useCallback, useEffect, useRef, useState } from 'react'

import { isSupabaseConfigured, requireSupabase } from '../../lib/supabaseClient'
import { getLiveDrawState, normalizeLiveDrawRow, saveLiveDrawState } from './liveDrawService'
import { emptyLiveDrawState, type LiveDrawState } from './liveDrawTypes'

export type LiveConnectionStatus = 'offline' | 'connecting' | 'live' | 'error'

export function useLiveDrawRoom() {
  const [state, setState] = useState<LiveDrawState>(emptyLiveDrawState)
  const [status, setStatus] = useState<LiveConnectionStatus>(
    isSupabaseConfigured ? 'connecting' : 'offline',
  )
  const [error, setError] = useState<string | null>(null)
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const client = requireSupabase()
    let active = true
    let receivedRealtimeUpdate = false

    void getLiveDrawState()
      .then((nextState) => {
        if (active && !receivedRealtimeUpdate) setState(nextState)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        setError(
          requestError instanceof Error ? requestError.message : 'Không thể tải phòng trực tiếp.',
        )
        setStatus('error')
      })

    const channel = client
      .channel('live-draw-state')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'live_draw_state', filter: 'id=eq.1' },
        (payload) => {
          if (!active) return
          receivedRealtimeUpdate = true
          setState(normalizeLiveDrawRow(payload.new as DatabaseLiveDrawRow))
        },
      )
      .subscribe((nextStatus) => {
        if (!active) return
        if (nextStatus === 'SUBSCRIBED') {
          setStatus('live')
          setError(null)
        }
        if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT') setStatus('error')
        if (nextStatus === 'CLOSED') setStatus('offline')
      })

    return () => {
      active = false
      void client.removeChannel(channel)
    }
  }, [])

  const publish = useCallback(async (nextState: LiveDrawState) => {
    if (!isSupabaseConfigured) return
    writeQueueRef.current = writeQueueRef.current
      .catch(() => undefined)
      .then(() => saveLiveDrawState(nextState))
      .then(() => setError(null))
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Không thể đồng bộ thao tác chia đội.',
        )
      })
    await writeQueueRef.current
  }, [])

  return { state, status, error, publish }
}

type DatabaseLiveDrawRow = Parameters<typeof normalizeLiveDrawRow>[0]
