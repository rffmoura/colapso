import { DECK_LIST, getDef } from './cards'
import type {
  Creature,
  Face,
  GameEvent,
  GameState,
  Keyword,
  Owner,
  SideState,
  StepResult,
  TargetRef,
} from './types'
import { HAND_REFILL, HERO_POWER_COST, MAX_BOARD, MAX_HAND, MAX_QUBITS, START_COHERENCE } from './types'

export function other(o: Owner): Owner {
  return o === 'player' ? 'ai' : 'player'
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function clone(s: GameState): GameState {
  return structuredClone(s)
}

// ---------- consultas ----------

export function findCreature(s: GameState, uid: number): Creature | undefined {
  return s.board.player.find((c) => c.uid === uid) ?? s.board.ai.find((c) => c.uid === uid)
}

export function faceOf(c: Creature): Face | null {
  if (c.collapsed === null) return null
  return getDef(c.defId).faces![c.collapsed]
}

export function keywordsOf(c: Creature): Keyword[] {
  const base = c.collapsed === null ? [] : faceOf(c)!.keywords
  return [...base, ...c.tempKeywords]
}

export function expectedAttack(c: Creature): number {
  if (c.collapsed !== null) return faceOf(c)!.attack
  const [a, b] = getDef(c.defId).faces!
  return (a.attack + b.attack) / 2
}

export function expectedHealth(c: Creature): number {
  if (c.collapsed !== null) return c.hp
  const [a, b] = getDef(c.defId).faces!
  return (a.health + b.health) / 2
}

export function canAttack(s: GameState, c: Creature): boolean {
  if (c.owner !== s.active) return false
  if (c.attacksUsed > 0) return false
  const summonedThisTurn = c.summonedTurn === s.turn
  if (summonedThisTurn && !keywordsOf(c).includes('veloz')) return false
  return true
}

/** Alvos válidos de ataque para uma criatura (regra da Barreira) */
export function validAttackTargets(s: GameState, attacker: Creature): TargetRef[] {
  const enemy = other(attacker.owner)
  const enemyBoard = s.board[enemy]
  const barriers = enemyBoard.filter((c) => keywordsOf(c).includes('barreira'))
  const ghost = keywordsOf(attacker).includes('fantasma')
  if (barriers.length > 0 && !ghost) {
    return barriers.map((c) => ({ kind: 'creature', uid: c.uid }))
  }
  return [
    ...enemyBoard.map((c): TargetRef => ({ kind: 'creature', uid: c.uid })),
    { kind: 'hero', owner: enemy },
  ]
}

export function canPlay(s: GameState, owner: Owner, handUid: number): boolean {
  const side = s.sides[owner]
  const card = side.hand.find((h) => h.uid === handUid)
  if (!card) return false
  const def = getDef(card.defId)
  if (def.cost > side.qubits) return false
  if (def.type === 'criatura' && s.board[owner].length >= MAX_BOARD) return false
  return true
}

// ---------- mutações internas ----------

function drawInto(s: GameState, owner: Owner, n: number, ev: GameEvent[]) {
  const side = s.sides[owner]
  let drawn = 0
  for (let i = 0; i < n; i++) {
    if (side.deck.length === 0 && side.discard.length > 0) {
      side.deck = shuffle(side.discard)
      side.discard = []
      ev.push({ t: 'reshuffle', owner })
    }
    const defId = side.deck.pop()
    if (defId === undefined) continue // arquivo e descarte vazios: nada a comprar
    if (side.hand.length >= MAX_HAND) {
      ev.push({ t: 'burn', owner, defId })
      side.discard.push(defId)
      continue
    }
    side.hand.push({ uid: s.nextUid++, defId })
    drawn++
  }
  if (drawn > 0) ev.push({ t: 'draw', owner, count: drawn })
}

function applyHeroDamage(s: GameState, owner: Owner, amount: number, ev: GameEvent[]) {
  if (s.winner) return
  const side = s.sides[owner]
  side.coherence -= amount
  ev.push({ t: 'damage', target: { kind: 'hero', owner }, amount })
  if (side.coherence <= 0) {
    side.coherence = 0
    s.winner = other(owner)
    ev.push({ t: 'gameover', winner: s.winner })
  }
}

function doCollapse(s: GameState, uid: number, face: 0 | 1 | undefined, forced: boolean, ev: GameEvent[]) {
  const c = findCreature(s, uid)
  if (!c || c.collapsed !== null) return
  const def = getDef(c.defId)
  const bias = def.bias ?? 0.5
  const resolved: 0 | 1 = face ?? (Math.random() < bias ? 0 : 1)
  c.collapsed = resolved
  c.hp = def.faces![resolved].health
  ev.push({ t: 'collapse', uid, face: resolved, forced })
  // parceiro emaranhado colapsa junto, no mesmo índice
  if (c.entangledWith !== null) {
    const partner = findCreature(s, c.entangledWith)
    if (partner && partner.collapsed === null) {
      doCollapse(s, partner.uid, resolved, true, ev)
    }
  }
}

function killCreature(s: GameState, uid: number, ev: GameEvent[]) {
  const c = findCreature(s, uid)
  if (!c) return
  const board = s.board[c.owner]
  const idx = board.findIndex((x) => x.uid === uid)
  if (idx >= 0) board.splice(idx, 1)
  s.sides[c.owner].discard.push(c.defId)
  ev.push({ t: 'death', uid, defId: c.defId, owner: c.owner })
  if (c.entangledWith !== null) {
    const partner = findCreature(s, c.entangledWith)
    if (partner) {
      partner.entangledWith = null
      ev.push({ t: 'echo', from: uid, to: partner.uid, amount: 2 })
      applyCreatureDamage(s, partner.uid, 2, ev)
    }
  }
}

function applyCreatureDamage(s: GameState, uid: number, amount: number, ev: GameEvent[]) {
  const c = findCreature(s, uid)
  if (!c) return
  if (c.collapsed === null) doCollapse(s, uid, undefined, true, ev)
  c.hp -= amount
  ev.push({ t: 'damage', target: { kind: 'creature', uid }, amount })
  if (c.hp <= 0) killCreature(s, uid, ev)
}

// ---------- primitivas públicas (imutáveis) ----------

export function newGame(): GameState {
  const mkSide = (): SideState => ({
    coherence: START_COHERENCE,
    qubits: 0,
    maxQubits: 0,
    deck: shuffle(DECK_LIST),
    discard: [],
    hand: [],
    heroPowerUsed: false,
  })
  const s: GameState = {
    turn: 0,
    active: 'player',
    sides: { player: mkSide(), ai: mkSide() },
    board: { player: [], ai: [] },
    winner: null,
    nextUid: 1,
  }
  const ev: GameEvent[] = []
  drawInto(s, 'player', 4, ev)
  drawInto(s, 'ai', 5, ev)
  return s
}

export function startTurn(prev: GameState): StepResult {
  const s = clone(prev)
  const ev: GameEvent[] = []
  s.turn += 1
  const side = s.sides[s.active]
  side.maxQubits = Math.min(MAX_QUBITS, side.maxQubits + 1)
  side.qubits = side.maxQubits
  side.heroPowerUsed = false
  for (const c of s.board[s.active]) c.attacksUsed = 0
  ev.push({ t: 'turn', owner: s.active, turn: s.turn })
  // refil: compra até HAND_REFILL cartas (sempre ao menos 1)
  const need = Math.max(1, HAND_REFILL - side.hand.length)
  drawInto(s, s.active, need, ev)
  return { state: s, events: ev }
}

export function endTurn(prev: GameState): StepResult {
  const s = clone(prev)
  for (const c of s.board[s.active]) c.tempKeywords = []
  s.active = other(s.active)
  return { state: s, events: [] }
}

export function playCreature(prev: GameState, owner: Owner, handUid: number): StepResult {
  const s = clone(prev)
  const ev: GameEvent[] = []
  const side = s.sides[owner]
  const idx = side.hand.findIndex((h) => h.uid === handUid)
  if (idx < 0) return { state: prev, events: [] }
  const def = getDef(side.hand[idx].defId)
  if (def.cost > side.qubits || s.board[owner].length >= MAX_BOARD) return { state: prev, events: [] }
  side.qubits -= def.cost
  side.hand.splice(idx, 1)
  const creature: Creature = {
    uid: handUid,
    defId: def.id,
    owner,
    collapsed: null,
    hp: 0,
    attacksUsed: 0,
    summonedTurn: s.turn,
    entangledWith: null,
    tempKeywords: [],
  }
  s.board[owner].push(creature)
  ev.push({ t: 'summon', uid: creature.uid })
  if (def.onPlay === 'colapsarInimigo') {
    const targets = s.board[other(owner)].filter((c) => c.collapsed === null)
    if (targets.length > 0) {
      const pick = targets[Math.floor(Math.random() * targets.length)]
      doCollapse(s, pick.uid, undefined, true, ev)
    }
  }
  return { state: s, events: ev }
}

/** Paga o custo de um feitiço e o remove da mão; o efeito é aplicado pelas primitivas seguintes. */
export function paySpell(prev: GameState, owner: Owner, handUid: number): StepResult {
  const s = clone(prev)
  const side = s.sides[owner]
  const idx = side.hand.findIndex((h) => h.uid === handUid)
  if (idx < 0) return { state: prev, events: [] }
  const def = getDef(side.hand[idx].defId)
  if (def.cost > side.qubits) return { state: prev, events: [] }
  side.qubits -= def.cost
  side.hand.splice(idx, 1)
  side.discard.push(def.id)
  return { state: s, events: [{ t: 'spell', defId: def.id, owner }] }
}

export function collapseCreature(prev: GameState, uid: number, face?: 0 | 1, forced = true): StepResult {
  const s = clone(prev)
  const ev: GameEvent[] = []
  doCollapse(s, uid, face, forced, ev)
  return { state: s, events: ev }
}

export function entangleCreatures(prev: GameState, a: number, b: number): StepResult {
  const s = clone(prev)
  const ca = findCreature(s, a)
  const cb = findCreature(s, b)
  if (!ca || !cb) return { state: prev, events: [] }
  ca.entangledWith = b
  cb.entangledWith = a
  return { state: s, events: [{ t: 'entangle', a, b }] }
}

export function grantTempKeywords(prev: GameState, uid: number, kws: Keyword[]): StepResult {
  const s = clone(prev)
  const c = findCreature(s, uid)
  if (!c) return { state: prev, events: [] }
  c.tempKeywords = [...new Set([...c.tempKeywords, ...kws])]
  return { state: s, events: [] }
}

export function damageTarget(prev: GameState, target: TargetRef, amount: number): StepResult {
  const s = clone(prev)
  const ev: GameEvent[] = []
  if (target.kind === 'hero') applyHeroDamage(s, target.owner, amount, ev)
  else applyCreatureDamage(s, target.uid, amount, ev)
  return { state: s, events: ev }
}

export function drawCards(prev: GameState, owner: Owner, n: number): StepResult {
  const s = clone(prev)
  const ev: GameEvent[] = []
  drawInto(s, owner, n, ev)
  return { state: s, events: ev }
}

/**
 * Resolve o combate entre atacante e alvo. Pressupõe que atacante (e alvo,
 * se criatura) já colapsaram — a orquestração do colapso é da UI.
 */
export function resolveCombat(prev: GameState, attackerUid: number, target: TargetRef): StepResult {
  const s = clone(prev)
  const ev: GameEvent[] = []
  const attacker = findCreature(s, attackerUid)
  if (!attacker || attacker.collapsed === null) return { state: prev, events: [] }
  attacker.attacksUsed += 1
  const atk = faceOf(attacker)!.attack
  if (target.kind === 'hero') {
    applyHeroDamage(s, target.owner, atk, ev)
  } else {
    const defender = findCreature(s, target.uid)
    if (!defender || defender.collapsed === null) return { state: prev, events: [] }
    const counter = faceOf(defender)!.attack
    applyCreatureDamage(s, defender.uid, atk, ev)
    applyCreatureDamage(s, attacker.uid, counter, ev)
  }
  return { state: s, events: ev }
}

export function payHeroPower(prev: GameState, owner: Owner, targetUid: number): StepResult {
  const s = clone(prev)
  const side = s.sides[owner]
  if (side.heroPowerUsed || side.qubits < HERO_POWER_COST) return { state: prev, events: [] }
  side.qubits -= HERO_POWER_COST
  side.heroPowerUsed = true
  return { state: s, events: [{ t: 'heropower', owner, uid: targetUid }] }
}
