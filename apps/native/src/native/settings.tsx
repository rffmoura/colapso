import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const SETTINGS_KEY = 'colapso.native-settings.v1'

export interface NativeSettings {
  sound: boolean
  haptics: boolean
}

interface SettingsContextValue extends NativeSettings {
  ready: boolean
  toggleSound(): void
  toggleHaptics(): void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<NativeSettings>({ sound: true, haptics: true })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (!raw) return
        const saved = JSON.parse(raw) as Partial<NativeSettings>
        setSettings({ sound: saved.sound !== false, haptics: saved.haptics !== false })
      })
      .catch(() => undefined)
      .finally(() => setReady(true))
  }, [])

  const update = useCallback((next: NativeSettings) => {
    setSettings(next)
    void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  }, [])

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      ready,
      toggleSound: () => update({ ...settings, sound: !settings.sound }),
      toggleHaptics: () => update({ ...settings, haptics: !settings.haptics }),
    }),
    [ready, settings, update],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useNativeSettings() {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('useNativeSettings fora de SettingsProvider')
  return value
}
