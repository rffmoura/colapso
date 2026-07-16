import { useSyncExternalStore } from 'react'
import { sfx, setMuted } from '../audio/sfx'
import {
  targetKey as sessionTargetKey,
  validTargetKeys as sessionValidTargetKeys,
} from '@colapso/game-session'
import {
  acceptInitialSecret,
  acceptRewardSecret,
  buildMatchSetup,
  canAttack,
  canPlay,
  collapseCreature,
  createRun,
  damageTarget,
  decideAi,
  drawCards,
  endTurn,
  entangleCreatures,
  equipForNextDuel,
  findCreature,
  finishProtocol,
  getDef,
  grantTunnel,
  HERO_POWER_COST,
  influenceCreature,
  keywordsOf,
  newGame,
  payHeroPower,
  paySpell,
  playCreature,
  prepareReward,
  resolveCombat,
  startTurn,
  validAttackTargets,
  type GameEvent,
  type GameState,
  type Owner,
  type RunState,
  type SecretId,
  type SpellKind,
  type StepResult,
  type TargetRef,
} from '@colapso/game-core'
import { loadSeenMemos, MEMOS, persistSeenMemos } from '../ui/didactics'

// ---------- tipos da UI ----------

export type TargetKey = string

export function keyOf(t: TargetRef): TargetKey {
  return sessionTargetKey(t)
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
  | { type: 'measureFace'; handUid: number; targetUid: number }
  | { type: 'influenceFace'; targetUid: number }
  | { type: 'heropower' }
  | null

export interface StoreState {
  game: GameState
  phase: 'title' | 'draft' | 'briefing' | 'game' | 'reward' | 'run-lost' | 'run-won'
  run: RunState | null
  busy: boolean
  selection: Selection
  fx: FloatFx[]
  banner: { owner: Owner; turn: number } | null
  attackAnim: { attacker: number; dx: number; dy: number } | null
  aiThinking: boolean
  muted: boolean
  /** fila de memorandos didáticos do Supervisor (ids de MEMOS) */
  memoQueue: string[]
  manualOpen: boolean
  /** incrementa a cada impacto para sacudir o tabuleiro */
  shakeTick: number
  /** compras em andamento: cartas-fantasma voando do arquivo para a mão */
  drawFx: Array<{ id: number; owner: Owner; count: number }>
  /** sujeitos com Barreira tremendo para explicar um ataque negado */
  blockPulse: { id: number; uids: number[] } | null
  /** cartas especiais reveladas, mantidas por tempo suficiente para a animação */
  secretFx: Array<{ id: number; owner: Owner; secretId: SecretId }>
  /** protocolo do Autômato exibido brevemente antes de seu efeito */
  protocolFx: { id: number; defId: string } | null
  /** contramedida aberta para leitura detalhada */
  secretInspector: { owner: Owner; secretId: SecretId; status: 'armed' | 'used' } | null
}

/** Registro de elementos DOM por alvo, para linhas de emaranhamento e investidas */
export const refRegistry = new Map<TargetKey, HTMLElement>()

const COLLAPSE_MS = 1000
const LUNGE_MS = 230
const IMPACT_MS = 430
const AI_PAUSE_MS = 700
const SECRET_REVEAL_MS = 2400
const SECRET_DAMAGE_DELAY_MS = 520
const SECRET_RESOLUTION_PAUSE_MS = 950
const PROTOCOL_REVEAL_MS = 1000
const PROTOCOL_EXIT_MS = 180

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

// ---------- store ----------

let state: StoreState = {
  game: newGame(),
  phase: 'title',
  run: null,
  busy: false,
  selection: null,
  fx: [],
  banner: null,
  attackAnim: null,
  aiThinking: false,
  muted: false,
  memoQueue: [],
  manualOpen: false,
  shakeTick: 0,
  drawFx: [],
  blockPulse: null,
  secretFx: [],
  protocolFx: null,
  secretInspector: null,
}

const seenMemos = loadSeenMemos()

function queueMemo(id: string) {
  if (!MEMOS[id] || seenMemos.has(id) || state.memoQueue.includes(id)) return
  seenMemos.add(id)
  persistSeenMemos(seenMemos)
  set({ memoQueue: [...state.memoQueue, id] })
}

export function dismissMemo() {
  set({ memoQueue: state.memoQueue.slice(1) })
}

export function dismissAllMemos() {
  for (const id of Object.keys(MEMOS)) seenMemos.add(id)
  persistSeenMemos(seenMemos)
  set({ memoQueue: [] })
}

export function toggleManual() {
  set({ manualOpen: !state.manualOpen })
}

export function inspectSecret(owner: Owner, secretId: SecretId, status: 'armed' | 'used') {
  const side = state.game.sides[owner]
  const canInspectArmed = owner === 'player' && side.activeSecret?.id === secretId
  const canInspectUsed = side.revealedSecrets.includes(secretId)
  if ((status === 'armed' && !canInspectArmed) || (status === 'used' && !canInspectUsed)) return
  sfx.select()
  set({ secretInspector: { owner, secretId, status } })
}

export function closeSecretInspector() {
  if (state.secretInspector) set({ secretInspector: null })
}

function shakeBoard() {
  set({ shakeTick: state.shakeTick + 1 })
}

/** Ataque negado por Barreira: treme os bloqueadores para mostrar o porquê. */
function barrierBlockFeedback(attackerUid: number) {
  const attacker = findCreature(state.game, attackerUid)
  if (!attacker) return
  const blockers = validAttackTargets(state.game, attacker)
    .filter((t): t is Extract<TargetRef, { kind: 'creature' }> => t.kind === 'creature')
    .map((t) => findCreature(state.game, t.uid))
    .filter((c): c is NonNullable<typeof c> => !!c && keywordsOf(c).includes('barreira'))
  if (blockers.length === 0) return
  sfx.deny()
  for (const b of blockers) pushFx(`c-${b.uid}`, 'barreira!', 'info')
  const pulse = { id: fxId++, uids: blockers.map((b) => b.uid) }
  set({ blockPulse: pulse })
  setTimeout(() => {
    if (state.blockPulse?.id === pulse.id) set({ blockPulse: null })
  }, 650)
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
        if (e.source === 'secret') {
          const targetKey = keyOf(e.target)
          setTimeout(() => {
            sfx.hit()
            shakeBoard()
            pushFx(targetKey, `-${e.amount}`, 'dano')
          }, SECRET_DAMAGE_DELAY_MS)
        } else {
          pushFx(keyOf(e.target), `-${e.amount}`, 'dano')
        }
        break
      case 'collapse': {
        sfx.collapse()
        queueMemo('colapso')
        const collapsedDefId = findCreature(step.state, e.uid)?.defId
        if (collapsedDefId && getDef(collapsedDefId).faces?.[e.face]?.keywords.includes('barreira')) {
          queueMemo('barreira')
        }
        break
      }
      case 'oscillate':
        sfx.oscillate()
        queueMemo('oscilacao')
        pushFx(`c-${e.uid}`, `${e.from === 0 ? 'A' : 'B'} → ${e.to === 0 ? 'A' : 'B'}`, 'info')
        break
      case 'death':
        if (e.source === 'secret') setTimeout(() => sfx.death(), SECRET_DAMAGE_DELAY_MS + 120)
        else sfx.death()
        break
      case 'draw': {
        sfx.draw()
        const fx = { id: fxId++, owner: e.owner, count: e.count }
        set({ drawFx: [...state.drawFx, fx] })
        setTimeout(() => set({ drawFx: state.drawFx.filter((d) => d.id !== fx.id) }), 1400)
        break
      }
      case 'burn':
        pushFx(`hero-${e.owner}`, 'ficha extraviada', 'info')
        break
      case 'reshuffle':
        pushFx(`hero-${e.owner}`, 'arquivo reembaralhado', 'info')
        break
      case 'echo':
        pushFx(`c-${e.to}`, 'eco −2', 'eco')
        break
      case 'entangle':
        sfx.entangle()
        queueMemo('emaranhamento')
        break
      case 'spell':
        sfx.spell()
        break
      case 'influence':
        pushFx(
          `c-${e.uid}`,
          e.success ? `${Math.round(e.chance * 100)}% confirmado` : `${Math.round((1 - e.chance) * 100)}% desviou`,
          'info',
        )
        break
      case 'secretTrigger': {
        queueMemo('contramedida')
        const item = { id: fxId++, owner: e.owner, secretId: e.id }
        set({ secretFx: [...state.secretFx, item] })
        setTimeout(
          () => set({ secretFx: state.secretFx.filter((secret) => secret.id !== item.id) }),
          SECRET_REVEAL_MS,
        )
        pushFx(`hero-${e.owner}`, 'contramedida!', 'info')
        break
      }
      case 'secretArmed':
        pushFx(`hero-${e.owner}`, 'reserva armada', 'info')
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
    if (state.game.winner === 'player') {
      sfx.win()
      if (state.run?.stage === 3) {
        set({ phase: 'run-won', busy: false, selection: null, aiThinking: false })
      } else if (state.run) {
        set({
          run: prepareReward(state.run),
          phase: 'reward',
          busy: false,
          selection: null,
          aiThinking: false,
        })
      }
    } else {
      sfx.lose()
      set({ phase: 'run-lost', run: null, busy: false, selection: null, aiThinking: false })
    }
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
  shakeBoard()
  apply(resolveCombat(state.game, attackerUid, target))
  await wait(IMPACT_MS)
  set({ attackAnim: null })
}

async function revealAiProtocol(defId: string) {
  const item = { id: fxId++, defId }
  set({ protocolFx: item })
  await wait(PROTOCOL_REVEAL_MS)
  if (state.protocolFx?.id === item.id) set({ protocolFx: null })
  await wait(PROTOCOL_EXIT_MS)
}

async function spellSeq(owner: Owner, handUid: number, spell: SpellKind, targets: TargetRef[], face?: 0 | 1) {
  const defId = state.game.sides[owner].hand.find((card) => card.uid === handUid)?.defId
  const paid = paySpell(state.game, owner, handUid)
  if (paid.state === state.game) return
  const paymentEvents = apply(paid)
  const interruptedBySecret = paymentEvents.some((event) => event.t === 'secretTrigger')
  if (interruptedBySecret) await wait(SECRET_REVEAL_MS + 250)
  else await wait(350)
  if (state.game.winner) return
  if (owner === 'ai' && defId) await revealAiProtocol(defId)
  switch (spell) {
    case 'medir':
      if (targets[0]?.kind === 'creature' && face !== undefined) {
        await collapseWithDrama(targets[0].uid, face)
      }
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
        apply(grantTunnel(state.game, targets[0].uid))
        pushFx(keyOf(targets[0]), 'pronto · intangível', 'info')
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
      shakeBoard()
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
      shakeBoard()
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
  if (!state.game.winner) {
    const followup = finishProtocol(state.game, owner)
    if (followup.events.length > 0) {
      apply(followup)
      await wait(500)
    }
  }
}

// ---------- ações do jogador ----------

export function startGame() {
  sfx.select()
  set({
    run: createRun(),
    phase: 'draft',
    selection: null,
    fx: [],
    busy: false,
    memoQueue: [],
    secretFx: [],
    protocolFx: null,
    secretInspector: null,
  })
}

export function restart() {
  startGame()
}

function prepareMatch(run: RunState) {
  const setup = buildMatchSetup(run)
  set({
    run,
    game: newGame(setup),
    phase: 'briefing',
    selection: null,
    fx: [],
    busy: true,
    memoQueue: [],
    secretFx: [],
    protocolFx: null,
    secretInspector: null,
  })
}

export function beginDuel() {
  if (state.phase !== 'briefing' || !state.run) return
  sfx.select()
  set({ phase: 'game', busy: true })
  if (state.run.stage === 0) queueMemo('inicio')
  void runStartTurn()
}

export function chooseInitialSecret(secret: SecretId) {
  if (state.phase !== 'draft' || !state.run) return
  const next = acceptInitialSecret(state.run, secret)
  if (next === state.run) return
  sfx.select()
  prepareMatch(next)
}

export function chooseRewardSecret(secret: SecretId) {
  if (state.phase !== 'reward' || !state.run || state.run.rewardStep !== 'draft') return
  const next = acceptRewardSecret(state.run, secret)
  if (next === state.run) return
  sfx.select()
  set({ run: next })
}

export function equipSecret(secret: SecretId) {
  if (state.phase !== 'reward' || !state.run || state.run.rewardStep !== 'equip') return
  const next = equipForNextDuel(state.run, secret)
  if (next === state.run) return
  sfx.select()
  prepareMatch(next)
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
    if (state.game.sides.player.maxQubits >= 2) queueMemo('observar')
    if (state.game.turn >= 3) queueMemo('refil')
    set({ busy: false })
  }
}

export function endPlayerTurn() {
  if (state.busy || state.phase !== 'game' || state.game.active !== 'player') return
  sfx.select()
  set({ busy: true, selection: null })
  void (async () => {
    const events = apply(endTurn(state.game))
    if (events.some((event) => event.t === 'secretTrigger')) await wait(SECRET_RESOLUTION_PAUSE_MS)
    if (await checkEnd()) return
    await runStartTurn()
  })()
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
      queueMemo('superposicao')
      if (events.some((e) => e.t === 'collapse')) await wait(COLLAPSE_MS)
      if (events.some((e) => e.t === 'secretTrigger')) await wait(SECRET_RESOLUTION_PAUSE_MS)
      set({ busy: false })
      await checkEnd()
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
    if (c.owner === 'ai') {
      if (c.ghostProtected) {
        pushFx(`c-${uid}`, 'intangível', 'info')
        return
      }
      // alvo inimigo inválido: se for a Barreira que impede, treme os bloqueadores
      barrierBlockFeedback(sel.uid)
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
  if (!valid.has(keyOf(target))) {
    // tentou ir na cara com Barreira no caminho: mostra quem bloqueia
    if (sel.type === 'attacker' && target.kind === 'hero') barrierBlockFeedback(sel.uid)
    return
  }

  if (sel.type === 'attacker') {
    // didática na primeira vez: troca simultânea / decisão de correr ou trocar
    if (target.kind === 'creature') queueMemo('troca')
    else if (state.game.board.ai.length > 0) queueMemo('corrida')
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
    sfx.select()
    set({ selection: { type: 'influenceFace', targetUid: target.uid } })
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
    if (sel.spell === 'medir' && target.kind === 'creature') {
      set({ selection: { type: 'measureFace', handUid: sel.handUid, targetUid: target.uid } })
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

export function chooseMeasureFace(face: 0 | 1) {
  const sel = state.selection
  if (sel?.type !== 'measureFace') return
  set({ busy: true, selection: null })
  void (async () => {
    await spellSeq('player', sel.handUid, 'medir', [{ kind: 'creature', uid: sel.targetUid }], face)
    set({ busy: false })
    await checkEnd()
  })()
}

export function chooseInfluenceFace(face: 0 | 1) {
  const sel = state.selection
  if (sel?.type !== 'influenceFace') return
  set({ busy: true, selection: null })
  void (async () => {
    const paid = payHeroPower(state.game, 'player', sel.targetUid)
    if (paid.state === state.game) {
      set({ busy: false })
      return
    }
    apply(paid)
    sfx.spell()
    apply(influenceCreature(state.game, 'player', sel.targetUid, face))
    await wait(COLLAPSE_MS)
    set({ busy: false })
    await checkEnd()
  })()
}

function spellTargetCount(spell: SpellKind): number {
  return spell === 'emaranhar' ? 2 : 1
}

/** Alvos válidos para a seleção atual — usado para highlight e validação. */
export function validTargetKeys(st: StoreState): Set<TargetKey> {
  return sessionValidTargetKeys(st)
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
        if (events.some((e) => e.t === 'secretTrigger')) await wait(SECRET_RESOLUTION_PAUSE_MS)
        break
      }
      case 'spell':
        await spellSeq('ai', action.handUid, action.spell, action.targets, action.face)
        break
      case 'heropower':
        apply(payHeroPower(state.game, 'ai', action.targetUid))
        sfx.spell()
        apply(influenceCreature(state.game, 'ai', action.targetUid, action.face))
        await wait(COLLAPSE_MS)
        break
      case 'attack':
        await attackSeq(action.attackerUid, action.target)
        break
    }
  }
  set({ aiThinking: false })
  if (await checkEnd()) return
  const endEvents = apply(endTurn(state.game))
  if (endEvents.some((event) => event.t === 'secretTrigger')) await wait(SECRET_RESOLUTION_PAUSE_MS)
  if (await checkEnd()) return
  await runStartTurn()
}

// gancho de depuração, apenas em desenvolvimento
if (import.meta.env.DEV && typeof window !== 'undefined') {
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
    summon: (defId: string, owner: Owner = 'player', face?: 0 | 1) => {
      const s = structuredClone(state.game)
      const def = getDef(defId)
      s.board[owner].push({
        uid: s.nextUid++,
        defId,
        owner,
        collapsed: face ?? null,
        hp: face !== undefined ? def.faces![face].health : 0,
        attacksUsed: 0,
        summonedTurn: 0,
        entangledWith: null,
        tempKeywords: [],
        ghostProtected: face !== undefined && def.faces![face].keywords.includes('fantasma'),
      })
      set({ game: s })
    },
  }
}
