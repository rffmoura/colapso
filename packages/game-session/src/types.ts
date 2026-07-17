import type {
  GameEvent,
  GameState,
  HandCard,
  Owner,
  RandomSource,
  RunState,
  SecretId,
  SpellKind,
  TargetRef,
} from '@colapso/game-core'

export type SessionPhase =
  | 'title'
  | 'draft'
  | 'briefing'
  | 'game'
  | 'reward'
  | 'run-lost'
  | 'run-won'

export type SessionSelection =
  | { type: 'attacker'; uid: number }
  | { type: 'spell'; handUid: number; spell: SpellKind; collected: TargetRef[] }
  | { type: 'polarizeFace'; handUid: number; targetUid: number }
  | { type: 'measureFace'; handUid: number; targetUid: number }
  | { type: 'influenceFace'; targetUid: number }
  | { type: 'heropower' }
  | null

interface CueBase {
  presentationId: number
  blocking: boolean
}

type EventCue<Event extends GameEvent = GameEvent> = Event extends GameEvent
  ? CueBase & Omit<Event, 't'> & { kind: Event['t'] }
  : never

export type PresentationCue =
  | EventCue
  | (CueBase & { kind: 'attack'; attackerUid: number; target: TargetRef })
  | (CueBase & {
      kind: 'cardCommit'
      owner: Owner
      handUid: number
      defId: string
      destination: 'board' | 'protocol'
    })
  | (CueBase & {
      kind: 'aiDecision'
      action: 'playCreature' | 'spell' | 'heropower' | 'attack'
    })
  | (CueBase & { kind: 'protocolReveal'; owner: Owner; defId: string })
  | (CueBase & { kind: 'feedback'; target: TargetRef | null; message: string; tone: 'info' | 'deny' })
  | (CueBase & { kind: 'runRestored'; phase: Extract<SessionPhase, 'draft' | 'briefing' | 'reward'> })

export type PresentationCueInput = PresentationCue extends infer Cue
  ? Cue extends PresentationCue
    ? Omit<Cue, 'presentationId'>
    : never
  : never

export interface GameSessionState {
  phase: SessionPhase
  game: GameState
  run: RunState | null
  busy: boolean
  aiThinking: boolean
  hydrated: boolean
  selection: SessionSelection
  cues: PresentationCue[]
}

export type GameCommand =
  | { type: 'HYDRATE' }
  | { type: 'START_RUN' }
  | { type: 'CHOOSE_INITIAL_SECRET'; secret: SecretId }
  | { type: 'BEGIN_DUEL' }
  | { type: 'CHOOSE_REWARD_SECRET'; secret: SecretId }
  | { type: 'EQUIP_SECRET'; secret: SecretId }
  | { type: 'PLAY_CARD'; handUid: HandCard['uid'] }
  | { type: 'TOGGLE_HERO_POWER' }
  | { type: 'SELECT_CREATURE'; uid: number }
  | { type: 'SELECT_HERO'; owner: Owner }
  | { type: 'ATTACK_TARGET'; attackerUid: number; target: TargetRef }
  | { type: 'PLAY_CARD_TO_TARGET'; handUid: HandCard['uid']; target: TargetRef }
  | { type: 'CHOOSE_FACE'; face: 0 | 1 }
  | { type: 'CANCEL_SELECTION' }
  | { type: 'END_TURN' }
  | { type: 'ACK_PRESENTATION'; id: number }

export interface RunCheckpoint {
  version: 1
  phase: Extract<SessionPhase, 'draft' | 'briefing' | 'reward'>
  run: RunState
  game: GameState
}

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

export interface GameSessionOptions {
  random?: RandomSource
  storage?: StorageAdapter
  autoAcknowledge?: boolean
}
