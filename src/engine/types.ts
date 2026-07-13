export type Owner = 'player' | 'ai'

export type Keyword = 'barreira' | 'veloz' | 'fantasma'

export interface Face {
  label: string
  attack: number
  health: number
  keywords: Keyword[]
}

export type SpellKind =
  | 'medir'
  | 'polarizar'
  | 'emaranhar'
  | 'tunel'
  | 'pulso'
  | 'decoerencia'
  | 'flutuacao'

export interface CardDef {
  id: string
  /** nome do personagem, curto e grande na ficha (ex.: "O Gato") */
  name: string
  /** epíteto de catálogo (ex.: "Sujeito nº 13") */
  title: string
  cost: number
  type: 'criatura' | 'feitico'
  faces?: [Face, Face]
  /** probabilidade de colapsar na face 0 (padrão 0.5) */
  bias?: number
  spell?: SpellKind
  /** batalha de entrada de criatura */
  onPlay?: 'colapsarInimigo'
  text: string
  /** uma linha de lore, voz do Instituto */
  bio: string
}

export interface Creature {
  uid: number
  defId: string
  owner: Owner
  /** null = em superposição */
  collapsed: 0 | 1 | null
  /** vida restante; só é definida após o colapso */
  hp: number
  attacksUsed: number
  summonedTurn: number
  entangledWith: number | null
  /** limpas no fim do turno do dono (Túnel Quântico) */
  tempKeywords: Keyword[]
}

export interface HandCard {
  uid: number
  defId: string
}

export interface SideState {
  coherence: number
  qubits: number
  maxQubits: number
  deck: string[]
  /** fichas usadas: protocolos lançados e sujeitos mortos; reembaralha quando o deck esvazia */
  discard: string[]
  hand: HandCard[]
  heroPowerUsed: boolean
}

export interface GameState {
  turn: number
  active: Owner
  sides: Record<Owner, SideState>
  board: Record<Owner, Creature[]>
  winner: Owner | null
  nextUid: number
}

/** Alvo de ataque ou de efeito */
export type TargetRef = { kind: 'creature'; uid: number } | { kind: 'hero'; owner: Owner }

/** Eventos transitórios que a UI transforma em animação/som */
export type GameEvent =
  | { t: 'draw'; owner: Owner; count: number }
  | { t: 'burn'; owner: Owner; defId: string }
  | { t: 'reshuffle'; owner: Owner }
  | { t: 'summon'; uid: number }
  | { t: 'collapse'; uid: number; face: 0 | 1; forced: boolean }
  | { t: 'damage'; target: TargetRef; amount: number }
  | { t: 'death'; uid: number; defId: string; owner: Owner }
  | { t: 'entangle'; a: number; b: number }
  | { t: 'echo'; from: number; to: number; amount: number }
  | { t: 'spell'; defId: string; owner: Owner }
  | { t: 'heropower'; owner: Owner; uid: number }
  | { t: 'turn'; owner: Owner; turn: number }
  | { t: 'gameover'; winner: Owner }

export interface StepResult {
  state: GameState
  events: GameEvent[]
}

export const MAX_BOARD = 6
export const MAX_HAND = 8
export const MAX_QUBITS = 8
export const START_COHERENCE = 25
export const HERO_POWER_COST = 2
/** no início do turno, compra até ter esta quantidade de cartas (mínimo 1 compra) */
export const HAND_REFILL = 5
