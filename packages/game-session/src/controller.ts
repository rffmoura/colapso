import {
  HERO_POWER_COST,
  acceptInitialSecret,
  acceptRewardSecret,
  buildMatchSetup,
  canAttack,
  canPlay,
  collapseCreature,
  createRun,
  damageTarget,
  decideAi,
  defaultMatchSetup,
  drawCards,
  endTurn,
  entangleCreatures,
  equipForNextDuel,
  findCreature,
  finishProtocol,
  getDef,
  grantTunnel,
  influenceCreature,
  keywordsOf,
  newGame,
  other,
  payHeroPower,
  paySpell,
  playCreature,
  prepareReward,
  resolveCombat,
  startTurn,
  systemRandom,
  validAttackTargets,
  type GameEvent,
  type Owner,
  type RandomSource,
  type RunState,
  type SpellKind,
  type StepResult,
  type TargetRef,
} from '@colapso/game-core'
import type {
  GameCommand,
  GameSessionOptions,
  GameSessionState,
  PresentationCue,
  PresentationCueInput,
  RunCheckpoint,
  SessionSelection,
  StorageAdapter,
} from './types'

export const RUN_CHECKPOINT_KEY = 'colapso.run-checkpoint.v1'
const PRESENTATION_WATCHDOG_MS = 4000

const BLOCKING_EVENTS = new Set<GameEvent['t']>([
  'summon',
  'collapse',
  'damage',
  'death',
  'spell',
  'secretReveal',
  'turn',
  'gameover',
])

type Listener = () => void

export class GameSessionController {
  private state: GameSessionState
  private readonly listeners = new Set<Listener>()
  private readonly blockers = new Map<number, () => void>()
  private readonly presentationWatchdogs = new Map<number, ReturnType<typeof setTimeout>>()
  private readonly random: RandomSource
  private readonly storage?: StorageAdapter
  private readonly autoAcknowledge: boolean
  private cueId = 1

  constructor(options: GameSessionOptions = {}) {
    this.random = options.random ?? systemRandom
    this.storage = options.storage
    this.autoAcknowledge = options.autoAcknowledge ?? false
    this.state = {
      phase: 'title',
      game: newGame(defaultMatchSetup(), () => this.random.next()),
      run: null,
      busy: false,
      aiThinking: false,
      hydrated: !this.storage,
      selection: null,
      cues: [],
    }
  }

  readonly subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  readonly getSnapshot = () => this.state

  async send(command: GameCommand): Promise<void> {
    if (command.type === 'ACK_PRESENTATION') {
      this.ackPresentation(command.id)
      return
    }
    if (command.type === 'HYDRATE') {
      await this.hydrate()
      return
    }
    if (command.type === 'CANCEL_SELECTION') {
      if (this.state.selection) this.patch({ selection: null })
      return
    }

    switch (command.type) {
      case 'START_RUN':
        await this.startRun()
        break
      case 'CHOOSE_INITIAL_SECRET':
        await this.chooseInitialSecret(command.secret)
        break
      case 'BEGIN_DUEL':
        await this.beginDuel()
        break
      case 'CHOOSE_REWARD_SECRET':
        await this.chooseRewardSecret(command.secret)
        break
      case 'EQUIP_SECRET':
        await this.equipSecret(command.secret)
        break
      case 'PLAY_CARD':
        await this.playCard(command.handUid)
        break
      case 'TOGGLE_HERO_POWER':
        await this.toggleHeroPower()
        break
      case 'SELECT_CREATURE':
        await this.selectCreature(command.uid)
        break
      case 'SELECT_HERO':
        await this.selectTarget({ kind: 'hero', owner: command.owner })
        break
      case 'ATTACK_TARGET':
        await this.attackTarget(command.attackerUid, command.target)
        break
      case 'PLAY_CARD_TO_TARGET':
        await this.playCardToTarget(command.handUid, command.target)
        break
      case 'CHOOSE_FACE':
        await this.chooseFace(command.face)
        break
      case 'END_TURN':
        await this.endPlayerTurn()
        break
    }
  }

  ackPresentation(id: number) {
    const watchdog = this.presentationWatchdogs.get(id)
    if (watchdog) clearTimeout(watchdog)
    this.presentationWatchdogs.delete(id)
    const resolve = this.blockers.get(id)
    this.blockers.delete(id)
    const cues = this.state.cues.filter((cue) => cue.presentationId !== id)
    if (cues.length !== this.state.cues.length) this.patch({ cues })
    resolve?.()
  }

  private patch(patch: Partial<GameSessionState>) {
    this.state = { ...this.state, ...patch }
    for (const listener of this.listeners) listener()
  }

  private cancelPresentations() {
    for (const watchdog of this.presentationWatchdogs.values()) clearTimeout(watchdog)
    this.presentationWatchdogs.clear()
    for (const resolve of this.blockers.values()) resolve()
    this.blockers.clear()
    this.patch({ cues: [] })
  }

  private async present(cue: PresentationCueInput): Promise<void> {
    const item = { ...cue, presentationId: this.cueId++ } as PresentationCue
    let waiter: Promise<void> | null = null
    if (item.blocking) {
      waiter = new Promise((resolve) => this.blockers.set(item.presentationId, resolve))
    }
    this.patch({ cues: [...this.state.cues, item] })
    this.presentationWatchdogs.set(
      item.presentationId,
      setTimeout(() => this.ackPresentation(item.presentationId), PRESENTATION_WATCHDOG_MS),
    )
    if (this.autoAcknowledge) this.ackPresentation(item.presentationId)
    if (waiter) await waiter
  }

  private async presentEvent(event: GameEvent) {
    const { t, ...payload } = event
    await this.present({
      ...payload,
      kind: t,
      blocking: BLOCKING_EVENTS.has(t),
    } as PresentationCueInput)
  }

  private async applyStep(step: StepResult, ignoredEvents: ReadonlySet<GameEvent['t']> = new Set()) {
    this.patch({ game: step.state })
    for (const event of step.events) {
      if (!ignoredEvents.has(event.t)) await this.presentEvent(event)
    }
    return step.events
  }

  private async feedback(message: string, tone: 'info' | 'deny', target: TargetRef | null = null) {
    await this.present({ kind: 'feedback', blocking: false, target, message, tone })
  }

  private async hydrate() {
    if (this.state.hydrated) return
    if (!this.storage) {
      this.patch({ hydrated: true })
      return
    }
    try {
      const raw = await this.storage.getItem(RUN_CHECKPOINT_KEY)
      if (!raw) {
        this.patch({ hydrated: true })
        return
      }
      const checkpoint = JSON.parse(raw) as RunCheckpoint
      if (
        checkpoint.version !== 1 ||
        !['draft', 'briefing', 'reward'].includes(checkpoint.phase) ||
        !checkpoint.run ||
        !checkpoint.game
      ) {
        throw new Error('checkpoint inválido')
      }
      this.cancelPresentations()
      this.patch({
        hydrated: true,
        phase: checkpoint.phase,
        run: checkpoint.run,
        game: checkpoint.game,
        busy: false,
        aiThinking: false,
        selection: null,
      })
      await this.present({ kind: 'runRestored', phase: checkpoint.phase, blocking: false })
    } catch {
      await this.storage.removeItem(RUN_CHECKPOINT_KEY)
      this.patch({ hydrated: true })
    }
  }

  private async persistSafeState() {
    if (!this.storage || !this.state.run) return
    if (!['draft', 'briefing', 'reward'].includes(this.state.phase)) return
    const checkpoint: RunCheckpoint = {
      version: 1,
      phase: this.state.phase as RunCheckpoint['phase'],
      run: this.state.run,
      game: this.state.game,
    }
    await this.storage.setItem(RUN_CHECKPOINT_KEY, JSON.stringify(checkpoint))
  }

  private async clearCheckpoint() {
    await this.storage?.removeItem(RUN_CHECKPOINT_KEY)
  }

  private async startRun() {
    this.cancelPresentations()
    await this.clearCheckpoint()
    const run = createRun(() => this.random.next())
    this.patch({
      run,
      phase: 'draft',
      selection: null,
      busy: false,
      aiThinking: false,
    })
    await this.persistSafeState()
  }

  private async prepareMatch(run: RunState) {
    const setup = buildMatchSetup(run, () => this.random.next())
    const game = newGame(setup, () => this.random.next())
    this.cancelPresentations()
    this.patch({
      run,
      game,
      phase: 'briefing',
      selection: null,
      busy: false,
      aiThinking: false,
    })
    await this.persistSafeState()
  }

  private async chooseInitialSecret(secret: RunState['equippedSecret']) {
    if (!secret || this.state.phase !== 'draft' || !this.state.run) return
    const next = acceptInitialSecret(this.state.run, secret)
    if (next === this.state.run) return
    await this.prepareMatch(next)
  }

  private async chooseRewardSecret(secret: RunState['equippedSecret']) {
    if (!secret || this.state.phase !== 'reward' || !this.state.run || this.state.run.rewardStep !== 'draft') return
    const next = acceptRewardSecret(this.state.run, secret)
    if (next === this.state.run) return
    this.patch({ run: next })
    await this.persistSafeState()
  }

  private async equipSecret(secret: RunState['equippedSecret']) {
    if (!secret || this.state.phase !== 'reward' || !this.state.run || this.state.run.rewardStep !== 'equip') return
    const next = equipForNextDuel(this.state.run, secret)
    if (next === this.state.run) return
    await this.prepareMatch(next)
  }

  private async beginDuel() {
    if (this.state.phase !== 'briefing' || !this.state.run || this.state.busy) return
    this.patch({ phase: 'game', busy: true, selection: null })
    await this.runStartTurn()
  }

  private async runStartTurn() {
    await this.applyStep(startTurn(this.state.game, () => this.random.next()))
    if (await this.checkEnd()) return
    if (this.state.game.active === 'ai') await this.runAiTurn()
    else this.patch({ busy: false })
  }

  private async endPlayerTurn() {
    if (this.state.busy || this.state.phase !== 'game' || this.state.game.active !== 'player') return
    this.patch({ busy: true, selection: null })
    await this.applyStep(endTurn(this.state.game))
    if (await this.checkEnd()) return
    await this.runStartTurn()
  }

  private async checkEnd() {
    const winner = this.state.game.winner
    if (!winner || this.state.phase !== 'game') return false
    if (winner === 'player') {
      if (this.state.run?.stage === 3) {
        await this.clearCheckpoint()
        this.patch({ phase: 'run-won', run: null, busy: false, selection: null, aiThinking: false })
      } else if (this.state.run) {
        const run = prepareReward(this.state.run, () => this.random.next())
        this.patch({ phase: 'reward', run, busy: false, selection: null, aiThinking: false })
        await this.persistSafeState()
      }
    } else {
      await this.clearCheckpoint()
      this.patch({ phase: 'run-lost', run: null, busy: false, selection: null, aiThinking: false })
    }
    return true
  }

  private async collapseWithPresentation(uid: number, face?: 0 | 1) {
    const creature = findCreature(this.state.game, uid)
    if (!creature || creature.collapsed !== null) return
    await this.applyStep(collapseCreature(this.state.game, uid, face, true, this.random.next()))
  }

  private async attackSequence(attackerUid: number, target: TargetRef) {
    const attacker = findCreature(this.state.game, attackerUid)
    if (!attacker) return
    if (attacker.collapsed === null) await this.collapseWithPresentation(attackerUid)
    if (target.kind === 'creature') {
      const defender = findCreature(this.state.game, target.uid)
      if (!defender) return
      if (defender.collapsed === null) await this.collapseWithPresentation(target.uid)
    }
    await this.present({ kind: 'attack', attackerUid, target, blocking: true })
    await this.applyStep(resolveCombat(this.state.game, attackerUid, target))
  }

  private async presentCardCommit(owner: Owner, handUid: number, destination: 'board' | 'protocol') {
    const card = this.state.game.sides[owner].hand.find((item) => item.uid === handUid)
    if (!card) return false
    await this.present({
      kind: 'cardCommit',
      owner,
      handUid,
      defId: card.defId,
      destination,
      blocking: true,
    })
    return true
  }

  private async spellSequence(
    owner: Owner,
    handUid: number,
    spell: SpellKind,
    targets: TargetRef[],
    face?: 0 | 1,
  ) {
    const defId = this.state.game.sides[owner].hand.find((card) => card.uid === handUid)?.defId
    if (!defId || !(await this.presentCardCommit(owner, handUid, 'protocol'))) return
    const paid = paySpell(this.state.game, owner, handUid)
    if (paid.state === this.state.game) return
    await this.applyStep(paid, owner === 'ai' ? new Set(['spell']) : new Set())
    if (this.state.game.winner) return
    if (owner === 'ai') {
      await this.present({ kind: 'protocolReveal', owner, defId, blocking: true })
    }

    switch (spell) {
      case 'medir':
        if (targets[0]?.kind === 'creature' && face !== undefined) {
          await this.collapseWithPresentation(targets[0].uid, face)
        }
        break
      case 'polarizar':
        if (targets[0]?.kind === 'creature' && face !== undefined) {
          await this.collapseWithPresentation(targets[0].uid, face)
        }
        break
      case 'emaranhar':
        if (targets[0]?.kind === 'creature' && targets[1]?.kind === 'creature') {
          await this.applyStep(entangleCreatures(this.state.game, targets[0].uid, targets[1].uid))
        }
        break
      case 'tunel':
        if (targets[0]?.kind === 'creature') {
          await this.applyStep(grantTunnel(this.state.game, targets[0].uid))
          await this.feedback('pronto · intangível', 'info', targets[0])
        }
        break
      case 'pulso': {
        const target = targets[0]
        if (!target) break
        if (target.kind === 'creature') {
          const creature = findCreature(this.state.game, target.uid)
          if (creature?.collapsed === null) await this.collapseWithPresentation(target.uid)
        }
        await this.applyStep(damageTarget(this.state.game, target, 3))
        break
      }
      case 'decoerencia': {
        const enemy = other(owner)
        const uids = this.state.game.board[enemy].map((creature) => creature.uid)
        for (const uid of uids) {
          const creature = findCreature(this.state.game, uid)
          if (creature?.collapsed === null) await this.collapseWithPresentation(uid)
        }
        for (const uid of uids) {
          if (findCreature(this.state.game, uid)) {
            await this.applyStep(damageTarget(this.state.game, { kind: 'creature', uid }, 2))
          }
        }
        break
      }
      case 'flutuacao':
        await this.applyStep(drawCards(this.state.game, owner, 2, () => this.random.next()))
        break
    }

    if (!this.state.game.winner) {
      await this.applyStep(finishProtocol(this.state.game, owner, () => this.random.next()))
    }
  }

  private async playCard(handUid: number) {
    if (this.state.busy || this.state.phase !== 'game' || this.state.game.active !== 'player') return
    const side = this.state.game.sides.player
    const card = side.hand.find((item) => item.uid === handUid)
    if (!card) return
    const def = getDef(card.defId)
    if (!canPlay(this.state.game, 'player', handUid)) {
      await this.feedback(def.cost > side.qubits ? 'sem qubits' : 'bancada cheia', 'deny', {
        kind: 'hero',
        owner: 'player',
      })
      return
    }

    if (def.type === 'criatura') {
      this.patch({ busy: true, selection: null })
      await this.presentCardCommit('player', handUid, 'board')
      await this.applyStep(playCreature(this.state.game, 'player', handUid, () => this.random.next()))
      this.patch({ busy: false })
      await this.checkEnd()
      return
    }

    const spell = def.spell!
    if (spell === 'flutuacao' || spell === 'decoerencia') {
      this.patch({ busy: true, selection: null })
      await this.spellSequence('player', handUid, spell, [])
      this.patch({ busy: false })
      await this.checkEnd()
      return
    }

    const selection: SessionSelection = { type: 'spell', handUid, spell, collected: [] }
    if (validTargetKeys({ ...this.state, selection }).size === 0) {
      await this.feedback('sem alvo válido', 'deny')
      return
    }
    this.patch({ selection })
  }

  private async playCardToTarget(handUid: number, target: TargetRef) {
    if (this.state.busy || this.state.phase !== 'game' || this.state.game.active !== 'player') return
    const card = this.state.game.sides.player.hand.find((item) => item.uid === handUid)
    if (!card || !canPlay(this.state.game, 'player', handUid)) return
    const def = getDef(card.defId)
    if (def.type !== 'feitico' || !def.spell || ['flutuacao', 'decoerencia'].includes(def.spell)) return

    const selection: SessionSelection = { type: 'spell', handUid, spell: def.spell, collected: [] }
    if (!validTargetKeys({ game: this.state.game, selection }).has(targetKey(target))) return
    this.patch({ selection })
    await this.selectTarget(target)
  }

  private async toggleHeroPower() {
    if (this.state.busy || this.state.phase !== 'game' || this.state.game.active !== 'player') return
    const side = this.state.game.sides.player
    if (side.heroPowerUsed || side.qubits < HERO_POWER_COST) {
      await this.feedback(side.heroPowerUsed ? 'já observado' : 'sem qubits', 'deny', {
        kind: 'hero',
        owner: 'player',
      })
      return
    }
    this.patch({ selection: this.state.selection?.type === 'heropower' ? null : { type: 'heropower' } })
  }

  private async selectCreature(uid: number) {
    if (this.state.busy || this.state.phase !== 'game' || this.state.game.active !== 'player') return
    const selection = this.state.selection
    const creature = findCreature(this.state.game, uid)
    if (!creature) return

    if (selection && selection.type !== 'attacker') {
      await this.selectTarget({ kind: 'creature', uid })
      return
    }
    if (selection?.type === 'attacker') {
      if (selection.uid === uid) {
        this.patch({ selection: null })
        return
      }
      if (validTargetKeys(this.state).has(`c-${uid}`)) {
        await this.selectTarget({ kind: 'creature', uid })
        return
      }
      if (creature.owner === 'ai') {
        await this.feedback(creature.ghostProtected ? 'intangível' : 'alvo bloqueado', 'deny', {
          kind: 'creature',
          uid,
        })
        return
      }
    }

    if (creature.owner === 'player') {
      if (!canAttack(this.state.game, creature)) {
        await this.feedback(creature.attacksUsed > 0 ? 'já atacou' : 'preparando', 'deny', {
          kind: 'creature',
          uid,
        })
        return
      }
      this.patch({ selection: { type: 'attacker', uid } })
    }
  }

  private async selectTarget(target: TargetRef) {
    const selection = this.state.selection
    if (!selection) return
    if (!validTargetKeys(this.state).has(targetKey(target))) {
      if (selection.type === 'attacker' && target.kind === 'hero') {
        const attacker = findCreature(this.state.game, selection.uid)
        if (attacker) {
          const barriers = validAttackTargets(this.state.game, attacker)
            .filter((item): item is Extract<TargetRef, { kind: 'creature' }> => item.kind === 'creature')
            .map((item) => findCreature(this.state.game, item.uid))
            .filter((item) => item && keywordsOf(item).includes('barreira'))
          if (barriers.length > 0) await this.feedback('barreira no caminho', 'deny', target)
        }
      }
      return
    }

    if (selection.type === 'attacker') {
      this.patch({ busy: true, selection: null })
      await this.attackSequence(selection.uid, target)
      this.patch({ busy: false })
      await this.checkEnd()
      return
    }
    if (selection.type === 'heropower') {
      if (target.kind === 'creature') this.patch({ selection: { type: 'influenceFace', targetUid: target.uid } })
      return
    }
    if (selection.type === 'spell') {
      const collected = [...selection.collected, target]
      if (collected.length < spellTargetCount(selection.spell)) {
        this.patch({ selection: { ...selection, collected } })
        return
      }
      if (selection.spell === 'medir' && target.kind === 'creature') {
        this.patch({ selection: { type: 'measureFace', handUid: selection.handUid, targetUid: target.uid } })
        return
      }
      if (selection.spell === 'polarizar' && target.kind === 'creature') {
        this.patch({ selection: { type: 'polarizeFace', handUid: selection.handUid, targetUid: target.uid } })
        return
      }
      this.patch({ busy: true, selection: null })
      await this.spellSequence('player', selection.handUid, selection.spell, collected)
      this.patch({ busy: false })
      await this.checkEnd()
    }
  }

  private async attackTarget(attackerUid: number, target: TargetRef) {
    if (this.state.busy || this.state.phase !== 'game' || this.state.game.active !== 'player') return
    const attacker = findCreature(this.state.game, attackerUid)
    if (!attacker || !canAttack(this.state.game, attacker)) return
    if (!validAttackTargets(this.state.game, attacker).some((candidate) => targetKey(candidate) === targetKey(target))) return

    this.patch({ busy: true, selection: null })
    await this.attackSequence(attackerUid, target)
    this.patch({ busy: false })
    await this.checkEnd()
  }

  private async chooseFace(face: 0 | 1) {
    const selection = this.state.selection
    if (!selection) return
    if (selection.type === 'polarizeFace' || selection.type === 'measureFace') {
      this.patch({ busy: true, selection: null })
      await this.spellSequence(
        'player',
        selection.handUid,
        selection.type === 'polarizeFace' ? 'polarizar' : 'medir',
        [{ kind: 'creature', uid: selection.targetUid }],
        face,
      )
      this.patch({ busy: false })
      await this.checkEnd()
      return
    }
    if (selection.type === 'influenceFace') {
      this.patch({ busy: true, selection: null })
      const paid = payHeroPower(this.state.game, 'player', selection.targetUid)
      if (paid.state !== this.state.game) {
        await this.applyStep(paid)
        await this.applyStep(
          influenceCreature(this.state.game, 'player', selection.targetUid, face, this.random.next()),
        )
      }
      this.patch({ busy: false })
      await this.checkEnd()
    }
  }

  private async runAiTurn() {
    this.patch({ busy: true, aiThinking: true })
    for (let guard = 0; guard < 40 && !this.state.game.winner; guard++) {
      const action = decideAi(this.state.game)
      if (action.kind === 'end') break
      await this.present({ kind: 'aiDecision', action: action.kind, blocking: true })
      switch (action.kind) {
        case 'playCreature':
          await this.presentCardCommit('ai', action.handUid, 'board')
          await this.applyStep(
            playCreature(this.state.game, 'ai', action.handUid, () => this.random.next()),
          )
          break
        case 'spell':
          await this.spellSequence('ai', action.handUid, action.spell, action.targets, action.face)
          break
        case 'heropower':
          await this.applyStep(payHeroPower(this.state.game, 'ai', action.targetUid))
          await this.applyStep(
            influenceCreature(this.state.game, 'ai', action.targetUid, action.face, this.random.next()),
          )
          break
        case 'attack':
          await this.attackSequence(action.attackerUid, action.target)
          break
      }
    }
    this.patch({ aiThinking: false })
    if (await this.checkEnd()) return
    await this.applyStep(endTurn(this.state.game))
    if (await this.checkEnd()) return
    await this.runStartTurn()
  }
}

function spellTargetCount(spell: SpellKind) {
  return spell === 'emaranhar' ? 2 : 1
}

export function targetKey(target: TargetRef) {
  return target.kind === 'hero' ? `hero-${target.owner}` : `c-${target.uid}`
}

export function validTargetKeys(state: Pick<GameSessionState, 'game' | 'selection'>): Set<string> {
  const keys = new Set<string>()
  const selection = state.selection
  const game = state.game
  if (!selection) return keys
  if (selection.type === 'attacker') {
    const attacker = findCreature(game, selection.uid)
    if (attacker) for (const target of validAttackTargets(game, attacker)) keys.add(targetKey(target))
    return keys
  }
  if (selection.type === 'heropower') {
    for (const creature of [...game.board.player, ...game.board.ai]) {
      if (creature.collapsed === null) keys.add(`c-${creature.uid}`)
    }
    return keys
  }
  if (selection.type === 'spell') {
    switch (selection.spell) {
      case 'medir':
        for (const creature of [...game.board.player, ...game.board.ai]) {
          if (creature.collapsed === null) keys.add(`c-${creature.uid}`)
        }
        break
      case 'polarizar':
        for (const creature of game.board.player) {
          if (creature.collapsed === null) keys.add(`c-${creature.uid}`)
        }
        break
      case 'tunel':
        for (const creature of game.board.player) keys.add(`c-${creature.uid}`)
        break
      case 'pulso':
        for (const creature of [...game.board.player, ...game.board.ai]) keys.add(`c-${creature.uid}`)
        keys.add('hero-ai')
        break
      case 'emaranhar': {
        const pool = selection.collected.length === 0 ? game.board.player : game.board.ai
        for (const creature of pool) {
          if (creature.entangledWith === null) keys.add(`c-${creature.uid}`)
        }
        break
      }
    }
  }
  return keys
}
