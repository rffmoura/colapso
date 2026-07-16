import { useSyncExternalStore } from 'react'
import type { GameSessionController } from './controller'

export function useGameSession(controller: GameSessionController) {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
}
