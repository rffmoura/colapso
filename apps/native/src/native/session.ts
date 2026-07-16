import AsyncStorage from '@react-native-async-storage/async-storage'
import { GameSessionController, type StorageAdapter } from '@colapso/game-session'

const storage: StorageAdapter = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
}

export const gameSession = new GameSessionController({ storage })
