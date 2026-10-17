import { useEffect, useState } from 'react'
import GameStation from './lib/gamestation.js'

// Where this copy of the page runs, and the latest shared game, as React state. The player's own
// share() fires 'share' too, so every copy can draw from `shared`.
export function useGameStation() {
  const [context, setContext] = useState(GameStation.context)
  const [shared, setShared] = useState(GameStation.shared)

  useEffect(() => {
    const offContext = GameStation.on('context', setContext)
    const offShare = GameStation.on('share', setShared)
    return () => {
      offContext()
      offShare()
    }
  }, [])

  return { context, shared }
}
