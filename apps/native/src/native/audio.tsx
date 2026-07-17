import { preload, setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio'
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { AppState } from 'react-native'
import { useNativeSettings } from './settings'

const sources = {
  select: require('../../assets/audio/select.wav'),
  deny: require('../../assets/audio/deny.wav'),
  draw: require('../../assets/audio/draw.wav'),
  play: require('../../assets/audio/play.wav'),
  spell: require('../../assets/audio/spell.wav'),
  collapse: require('../../assets/audio/collapse.wav'),
  oscillate: require('../../assets/audio/oscillate.wav'),
  hit: require('../../assets/audio/hit.wav'),
  death: require('../../assets/audio/death.wav'),
  entangle: require('../../assets/audio/entangle.wav'),
  turn: require('../../assets/audio/turn.wav'),
  secret: require('../../assets/audio/secret.wav'),
  win: require('../../assets/audio/win.wav'),
  lose: require('../../assets/audio/lose.wav'),
} as const

for (const source of Object.values(sources)) void preload(source)

export type SoundId = keyof typeof sources

/**
 * Os WAVs têm amplitudes diferentes. O impacto é naturalmente o mais forte,
 * então ele precisa de menos ganho para não dominar a sequência de combate.
 */
const soundVolumes: Record<SoundId, number> = {
  select: 0.55,
  deny: 0.52,
  draw: 0.58,
  play: 0.6,
  spell: 0.56,
  collapse: 0.62,
  oscillate: 0.58,
  hit: 0.46,
  death: 0.5,
  entangle: 0.55,
  turn: 0.56,
  secret: 0.48,
  win: 0.58,
  lose: 0.58,
}

interface AudioContextValue {
  play(sound: SoundId): void
}

const AudioContext = createContext<AudioContextValue | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const { sound } = useNativeSettings()
  const select = useAudioPlayer(sources.select)
  const deny = useAudioPlayer(sources.deny)
  const draw = useAudioPlayer(sources.draw)
  const playCard = useAudioPlayer(sources.play)
  const spell = useAudioPlayer(sources.spell)
  const collapse = useAudioPlayer(sources.collapse)
  const oscillate = useAudioPlayer(sources.oscillate)
  const hit = useAudioPlayer(sources.hit)
  const death = useAudioPlayer(sources.death)
  const entangle = useAudioPlayer(sources.entangle)
  const turn = useAudioPlayer(sources.turn)
  const secret = useAudioPlayer(sources.secret)
  const win = useAudioPlayer(sources.win)
  const lose = useAudioPlayer(sources.lose)

  const players = useMemo<Record<SoundId, AudioPlayer>>(
    () => ({
      select,
      deny,
      draw,
      play: playCard,
      spell,
      collapse,
      oscillate,
      hit,
      death,
      entangle,
      turn,
      secret,
      win,
      lose,
    }),
    [collapse, death, deny, draw, entangle, hit, lose, oscillate, playCard, secret, select, spell, turn, win],
  )

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      allowsRecording: false,
    })
  }, [])

  useEffect(() => {
    for (const [id, player] of Object.entries(players) as [SoundId, AudioPlayer][]) {
      player.volume = sound ? soundVolumes[id] : 0
    }
  }, [players, sound])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') for (const player of Object.values(players)) player.pause()
    })
    return () => subscription.remove()
  }, [players])

  const play = useCallback(
    (id: SoundId) => {
      if (!sound) return
      const player = players[id]
      void player.seekTo(0).then(() => player.play()).catch(() => undefined)
    },
    [players, sound],
  )

  return <AudioContext.Provider value={{ play }}>{children}</AudioContext.Provider>
}

export function useSfx() {
  const value = useContext(AudioContext)
  if (!value) throw new Error('useSfx fora de AudioProvider')
  return value
}
