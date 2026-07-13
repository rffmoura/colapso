import { useSyncExternalStore } from 'react'
import { sfx, setMuted } from '../audio/sfx'
import { decideAi } from '../engine/ai'
import { getDef } from '../engine/cards'
import {
  canAttack,
  canPlay,
  collapseCreature,
  damageTarget,
  drawCards,
  endTurn,
  entangleCreatures,
  findCreature,
  grantTempKeywords,
  newGame,
  payHeroPower,
  paySpell,
  playCreature,
  resolveCombat,
  startTurn,
  validAttackTargets,
} from '../engine/game'
import type { GameEvent, GameState, Owner, SpellKind, StepResult, TargetRef } from '../engine/types'
import { HERO_POWER_COST } from '../engine/types'

// ---------- tipos da UI ----------

export type TargetKey = string

export function keyOf(t: TargetRef): TargetKey {
  return t.kind === 'hero' ? `hero-${t.owner}` : `c-${t.uid}`
}

export interface FloatFx {
  id: number
  key: TargetKey
  text: string
  kind: 'dano' | 'eco' | 'info'
}

export type Selection =
  | { type: 'attacker'; uid: number }
  | { type: 'spell'; handUid: number; spell: SpellKind; collected: TargetRef[] }
  | { type: 'polarizeFace'; handUid: number; targetUid: number }
  | { type: 'heropower' }
  | null

export interface StoreState {
  game: GameState
  phase: 'title' | 'game' | 'over'
  busy: boolean
  selection: Selection
  fx: FloatFx[]
  banner: { owner: Owner; turn: number } | null
  attackAnim: { attacker: number; dx: number; dy: number } | null
  aiThinking: boolean
  muted: boolean
}

/** Registro de elementos DOM por alvo, para linhas de emaranhamento e investidas */
export const refRegistry = new Map<TargetKey, HTMLElement>()

const COLLAPSE_MS = 1000
const LUNGE_MS = 230
const IMPACT_MS = 430
const AI_PAUSE_MS = 700

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

// ---------- store ----------

let state: StoreState = {
  game: newGame(),
  phase: 'title',
  busy: false,
  selection: null,
  fx: [],
  banner: null,
  attackAnim: null,
  aiThinking: false,
  muted: false,
}

const listeners = new Set<() => void>()
let fxId = 1

function set(patch: Partial<StoreState>) {
  state = { ...state, ...patch }
  for (const l of listeners) l()
}

export function useStore(): StoreState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

export function getState() {
  return state
}

function pushFx(key: TargetKey, text: string, kind: FloatFx['kind']) {
  const fx: FloatFx = { id: fxId++, key, text, kind }
  set({ fx: [...state.fx, fx] })
  setTimeout(() => set({ fx: state.fx.filter((f) => f.id !== fx.id) }), 1300)
}

/** Aplica um passo do motor e converte eventos em fx/sons. */
function apply(step: StepResult): GameEvent[] {
  set({ game: step.state })
  for (const e of step.events) {
    switch (e.t) {
      case 'damage':
        pushFx(keyOf(e.target), `-${e.amount}`, 'dano')
        break
      case 'collapse':
        sfx.collapse()
        break
      case 'death':
        sfx.death()
        break
      case 'draw':
        sfx.draw()
        break
      case 'burn':
        pushFx(`hero-${e.owner}`, 'carta queimada', 'info')
        break
      case 'fatigue':
        pushFx(`hero-${e.owner}`, `fadiga ${e.amount}`, 'info')
        break
      case 'echo':
        pushFx(`c-${e.to}`, 'eco −2', 'eco')
        break
      case 'entangle':
        sfx.entangle()
        break
      case 'spell':
        sfx.spell()
        break
      default:
        break
    }
  }
  return step.events
}

async function collapseWithDrama(uid: number, face?: 0 | 1) {
  const c = findCreature(state.game, uid)
  if (!c || c.collapsed !== null) return
  apply(collapseCreature(state.game, uid, face))
  await wait(COLLAPSE_MS)
}

async function checkEnd(): Promise<boolean> {
  if (state.game.winner && state.phase === 'game') {
    await wait(700)
    if (state.game.winner === 'player') sfx.win()
    else sfx.lose()
    set({ phase: 'over', busy: false, selection: null, aiThinking: false })
    return true
  }
  return false
}

// ---------- sequências compartilhadas ----------

async function attackSeq(attackerUid: number, target: TargetRef) {
  const attacker = findCreature(state.game, attackerUid)
  if (!attacker) return
  if (attacker.collapsed === null) await collapseWithDrama(attackerUid)
  if (target.kind === 'creature') {
    const defender = findCreature(state.game, target.uid)
    if (!defender) return
    if (defender.collapsed === null) await collapseWithDrama(target.uid)
  }
  // investida: desloca o atacante até o alvo
  const fromEl = refRegistry.get(`c-${attackerUid}`)
  const toEl = refRegistry.get(keyOf(target))
  if (fromEl && toEl) {
    const a = fromEl.getBoundingClientRect()
    const b = toEl.getBoundingClientRect()
    set({
      attackAnim: {
        attacker: attackerUid,
        dx: b.x + b.width / 2 - (a.x + a.width / 2),
        dy: b.y + b.height / 2 - (a.y + a.height / 2),
      },
    })
  }
  await wait(LUNGE_MS)
  sfx.hit()
  apply(resolveCombat(state.game, attackerUid, target))
  await wait(IMPACT_MS)
  set({ attackAnim: null })
}

async function spellSeq(owner: Owner, handUid: number, spell: SpellKind, targets: TargetRef[], face?: 0 | 1) {
  const paid = paySpell(state.game, owner, handUid)
  if (paid.state === state.game) return
  apply(paid)
  await wait(350)
  switch (spell) {
    case 'medir':
      if (targets[0]?.kind === 'creature') await collapseWithDrama(targets[0].uid)
      break
    case 'polarizar':
      if (targets[0]?.kind === 'creature') await collapseWithDrama(targets[0].uid, face)
      break
    case 'emaranhar':
      if (targets[0]?.kind === 'creature' && targets[1]?.kind === 'creature') {
        apply(entangleCreatures(state.game, targets[0].uid, targets[1].uid))
        await wait(600)
      }
      break
    case 'tunel':
      if (targets[0]?.kind === 'creature') {
        apply(grantTempKeywords(state.game, targets[0].uid, ['fantasma', 'veloz']))
        pushFx(keyOf(targets[0]), 'fantasma + veloz', 'info')
        await wait(500)
      }
      break
    case 'pulso': {
      const t = targets[0]
      if (!t) break
      if (t.kind === 'creature') {
        const c = findCreature(state.game, t.uid)
        if (c && c.collapsed === null) await collapseWithDrama(t.uid)
      }
      apply(damageTarget(state.game, t, 3))
      sfx.hit()
      await wait(500)
      break
    }
    case 'decoerencia': {
      const enemy = owner === 'player' ? 'ai' : 'player'
      const uids = state.game.board[enemy].map((c) => c.uid)
      let anyCollapse = false
      for (const uid of uids) {
        const c = findCreature(state.game, uid)
        if (c && c.collapsed === null) {
          apply(collapseCreature(state.game, uid))
          anyCollapse = true
          await wait(280)
        }
      }
      if (anyCollapse) await wait(COLLAPSE_MS - 280)
      for (const uid of uids) {
        if (findCreature(state.game, uid)) {
          apply(damageTarget(state.game, { kind: 'creature', uid }, 2))
          await wait(160)
        }
      }
      sfx.hit()
      await wait(400)
      break
    }
    case 'flutuacao':
      apply(drawCards(state.game, owner, 2))
      await wait(400)
      break
  }
}

// ---------- ações do jogador ----------

export function startGame() {
  sfx.select()
  set({ game: newGame(), phase: 'game', selection: null, fx: [], busy: true })
  void runStartTurn()
}

export function restart() {
  startGame()
}

export function toggleMute() {
  const m = !state.muted
  setMuted(m)
  set({ muted: m })
}

async function runStartTurn() {
  const step = startTurn(state.game)
  apply(step)
  sfx.turn()
  set({ banner: { owner: state.game.active, turn: state.game.turn } })
  await wait(1300)
  set({ banner: null })
  if (await checkEnd()) return
  if (state.game.active === 'ai') {
    await aiTurn()
  } else {
    set({ busy: false })
  }
}

export function endPlayerTurn() {
  if (state.busy || state.phase !== 'game' || state.game.active !== 'player') return
  sfx.select()
  set({ busy: true, selection: null })
  apply(endTurn(state.game))
  void runStartTurn()
}

export function clickHandCard(handUid: number) {
  if (state.busy || state.phase !== 'game' || state.game.active !== 'player') return
  const side = state.game.sides.player
  const card = side.hand.find((h) => h.uid === handUid)
  if (!card) return
  const def = getDef(card.defId)
  if (!canPlay(state.game, 'player', handUid)) {
    pushFx('hero-player', def.cost > side.qubits ? 'sem qubits' : 'campo cheio', 'info')
    return
  }
  if (def.type === 'criatura') {
    set({ busy: true, selection: null })
    void (async () => {
      sfx.play()
      const events = apply(playCreature(state.game, 'player', handUid))
      if (events.some((e) => e.t === 'collapse')) await wait(COLLAPSE_MS)
      set({ busy: false })
    })()
  } else {
    // feitiços sem alvo executam direto; com alvo entram em modo de mira
    const spell = def.spell!
    if (spell === 'flutuacao' || spell === 'decoerencia') {
      set({ busy: true, selection: null })
      void (async () => {
        await spellSeq('player', handUid, spell, [])
        set({ busy: false })
        await checkEnd()
      })()
    } else {
      const candidate: Selection = { type: 'spell', handUid, spell, collected: [] }
      if (validTargetKeys({ ...state, selection: candidate }).size === 0) {
        pushFx('hero-player', 'sem alvo válido', 'info')
        return
      }
      sfx.select()
      set({ selection: candidate })
    }
  }
}

export function clickHeroPower() {
  if (state.busy || state.phase !== 'game' || state.game.active !== 'player') return
  const side = state.game.sides.player
  if (side.heroPowerUsed || side.qubits < HERO_POWER_COST) {
    pushFx('hero-player', side.heroPowerUsed ? 'já observado' : 'sem qubits', 'info')
    return
  }
  sfx.select()
  set({ selection: state.selection?.type === 'heropower' ? null : { type: 'heropower' } })
}

export function cancelSelection() {
  if (state.selection) set({ selection: null })
}

export function clickCreature(uid: number) {
  if (state.busy || state.phase !== 'game' || state.game.active !== 'player') return
  const sel = state.selection
  const c = findCreature(state.game, uid)
  if (!c) return

  // com algo selecionado, clique = tentar mirar
  if (sel && sel.type !== 'attacker') {
    clickTarget({ kind: 'creature', uid })
    return
  }
  if (sel?.type === 'attacker') {
    if (sel.uid === uid) {
      set({ selection: null })
      return
    }
    const valid = validTargetKeys(state)
    if (valid.has(`c-${uid}`)) {
      clickTarget({ kind: 'creature', uid })
      return
    }
  }
  // sem seleção: selecionar atacante próprio
  if (c.owner === 'player') {
    if (!canAttack(state.game, c)) {
      pushFx(`c-${uid}`, c.attacksUsed > 0 ? 'já atacou' : 'preparando', 'info')
      return
    }
    sfx.select()
    set({ selection: { type: 'attacker', uid } })
  }
}

export function clickHero(owner: Owner) {
  if (state.busy || state.phase !== 'game' || state.game.active !== 'player') return
  clickTarget({ kind: 'hero', owner })
}

function clickTarget(target: TargetRef) {
  const sel = state.selection
  if (!sel) return
  const valid = validTargetKeys(state)
  if (!valid.has(keyOf(target))) return

  if (sel.type === 'attacker') {
    set({ busy: true, selection: null })
    void (async () => {
      await attackSeq(sel.uid, target)
      set({ busy: false })
      await checkEnd()
    })()
    return
  }

  if (sel.type === 'heropower') {
    if (target.kind !== 'creature') return
    set({ busy: true, selection: null })
    void (async () => {
      apply(payHeroPower(state.game, 'player', target.uid))
      sfx.spell()
      await collapseWithDrama(target.uid)
      set({ busy: false })
      await checkEnd()
    })()
    return
  }

  if (sel.type === 'spell') {
    const collected = [...sel.collected, target]
    const needed = spellTargetCount(sel.spell)
    sfx.select()
    if (collected.length < needed) {
      set({ selection: { ...sel, collected } })
      return
    }
    if (sel.spell === 'polarizar' && target.kind === 'creature') {
      // escolher a face acontece inline, sobre a criatura
      set({ selection: { type: 'polarizeFace', handUid: sel.handUid, targetUid: target.uid } })
      return
    }
    set({ busy: true, selection: null })
    void (async () => {
      await spellSeq('player', sel.handUid, sel.spell, collected)
      set({ busy: false })
      await checkEnd()
    })()
  }
}

export function choosePolarizeFace(face: 0 | 1) {
  const sel = state.selection
  if (sel?.type !== 'polarizeFace') return
  set({ busy: true, selection: null })
  void (async () => {
    await spellSeq('player', sel.handUid, 'polarizar', [{ kind: 'creature', uid: sel.targetUid }], face)
    set({ busy: false })
    await checkEnd()
  })()
}

function spellTargetCount(spell: SpellKind): number {
  return spell === 'emaranhar' ? 2 : 1
}

/** Alvos válidos para a seleção atual — usado para highlight e validação. */
export function validTargetKeys(st: StoreState): Set<TargetKey> {
  const keys = new Set<TargetKey>()
  const sel = st.selection
  const g = st.game
  if (!sel) return keys
  if (sel.type === 'attacker') {
    const attacker = findCreature(g, sel.uid)
    if (attacker) for (const t of validAttackTargets(g, attacker)) keys.add(keyOf(t))
    return keys
  }
  if (sel.type === 'heropower') {
    for (const c of [...g.board.player, ...g.board.ai]) {
      if (c.collapsed === null) keys.add(`c-${c.uid}`)
    }
    return keys
  }
  if (sel.type === 'spell') {
    switch (sel.spell) {
      case 'medir':
        for (const c of [...g.board.player, ...g.board.ai]) if (c.collapsed === null) keys.add(`c-${c.uid}`)
        break
      case 'polarizar':
        for (const c of g.board.player) if (c.collapsed === null) keys.add(`c-${c.uid}`)
        break
      case 'tunel':
        for (const c of g.board.player) keys.add(`c-${c.uid}`)
        break
      case 'pulso':
        for (const c of [...g.board.player, ...g.board.ai]) keys.add(`c-${c.uid}`)
        keys.add('hero-ai')
        break
      case 'emaranhar': {
        const step = sel.collected.length
        const pool = step === 0 ? g.board.player : g.board.ai
        for (const c of pool) if (c.entangledWith === null) keys.add(`c-${c.uid}`)
        break
      }
      default:
        break
    }
  }
  return keys
}

// ---------- turno da IA ----------

async function aiTurn() {
  set({ busy: true, aiThinking: true })
  for (let guard = 0; guard < 40; guard++) {
    if (state.game.winner) break
    const action = decideAi(state.game)
    if (action.kind === 'end') break
    await wait(AI_PAUSE_MS)
    switch (action.kind) {
      case 'playCreature': {
        sfx.play()
        const events = apply(playCreature(state.game, 'ai', action.handUid))
        if (events.length === 0) break
        if (events.some((e) => e.t === 'collapse')) await wait(COLLAPSE_MS)
        break
      }
      case 'spell':
        await spellSeq('ai', action.handUid, action.spell, action.targets, action.face)
        break
      case 'heropower':
        apply(payHeroPower(state.game, 'ai', action.targetUid))
        sfx.spell()
        await collapseWithDrama(action.targetUid)
        break
      case 'attack':
        await attackSeq(action.attackerUid, action.target)
        break
    }
  }
  set({ aiThinking: false })
  if (await checkEnd()) return
  apply(endTurn(state.game))
  await runStartTurn()
}

// gancho de depuração, apenas em desenvolvimento
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__colapso = {
    getState,
    smite: async (owner: Owner, amount: number) => {
      apply(damageTarget(state.game, { kind: 'hero', owner }, amount))
      await checkEnd()
    },
    give: (defId: string, owner: Owner = 'player') => {
      const s = structuredClone(state.game)
      s.sides[owner].hand.push({ uid: s.nextUid++, defId })
      set({ game: s })
    },
    mana: (owner: Owner = 'player') => {
      const s = structuredClone(state.game)
      s.sides[owner].qubits = 8
      s.sides[owner].maxQubits = 8
      set({ game: s })
    },
  }
}
