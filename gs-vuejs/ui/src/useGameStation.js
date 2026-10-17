import { onUnmounted, shallowRef } from 'vue'
import GameStation from './lib/gamestation.js'

// Where this copy of the page runs, and the latest shared game, as Vue refs. The player's own
// share() fires 'share' too, so every copy can draw from `shared`. Listens from setup on, so a
// share made during setup is not missed.
export function useGameStation() {
  const context = shallowRef(GameStation.context)
  const shared = shallowRef(GameStation.shared)
  const offs = [
    GameStation.on('context', (value) => { context.value = value }),
    GameStation.on('share', (value) => { shared.value = value }),
  ]
  onUnmounted(() => offs.forEach((off) => off()))
  return { context, shared }
}
