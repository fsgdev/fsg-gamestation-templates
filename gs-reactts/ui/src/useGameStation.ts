import { useEffect, useState } from 'react'
import GameStation, { type GameStationContext } from './lib/gamestation.js'

// Where this copy of the page runs, and the latest shared game, as React state. The player's own
// share() fires 'share' too, so every copy can draw from `shared`.
export function useGameStation<T>() {
  const [context, setContext] = useState<GameStationContext | null>(GameStation.context)
  const [shared, setShared] = useState<T | null>(GameStation.shared as T | null)

  useEffect(() => {
    const offContext = GameStation.on('context', setContext)
    const offShare = GameStation.on('share', (state) => setShared(state as T))
    return () => {
      offContext()
      offShare()
    }
  }, [])

  return { context, shared }
}
