import { createSeededRandom, getDef, type Creature } from '@colapso/game-core'
import { describe, expect, it, vi } from 'vitest'
import { GameSessionController, RUN_CHECKPOINT_KEY } from './controller'
import { MemoryStorageAdapter } from './storage'

async function enterFirstDuel(controller: GameSessionController) {
  await controller.send({ type: 'START_RUN' })
  const offered = controller.getSnapshot().run?.offeredSecrets[0]
  if (!offered) throw new Error('draft sem opções')
  await controller.send({ type: 'CHOOSE_INITIAL_SECRET', secret: offered })
  await controller.send({ type: 'BEGIN_DUEL' })
}

function testCreature(uid: number, defId: string, owner: Creature['owner']): Creature {
  return {
    uid,
    defId,
    owner,
    collapsed: 0,
    hp: 4,
    attacksUsed: 0,
    summonedTurn: 0,
    entangledWith: null,
    tempKeywords: [],
    ghostProtected: false,
  }
}

describe('GameSessionController', () => {
  it('executa o mini fluxo até o primeiro turno jogável', async () => {
    const controller = new GameSessionController({
      random: createSeededRandom(1953),
      autoAcknowledge: true,
    })

    await enterFirstDuel(controller)

    const state = controller.getSnapshot()
    expect(state.phase).toBe('game')
    expect(state.game.turn).toBe(1)
    expect(state.game.active).toBe('player')
    expect(state.game.sides.player.qubits).toBe(2)
    expect(state.busy).toBe(false)
    expect(state.cues).toEqual([])
  })

  it('joga uma ficha acessível usando a mesma engine do web', async () => {
    const controller = new GameSessionController({
      random: createSeededRandom(7),
      autoAcknowledge: true,
    })
    await enterFirstDuel(controller)
    const before = controller.getSnapshot()
    const playable = before.game.sides.player.hand.find((card) => getDef(card.defId).cost <= 2)
    expect(playable).toBeDefined()

    await controller.send({ type: 'PLAY_CARD', handUid: playable!.uid })

    const after = controller.getSnapshot()
    expect(after.game.sides.player.hand.some((card) => card.uid === playable!.uid)).toBe(false)
  })

  it('percorre draft, duelo e ataque direto usando somente GameCommand', async () => {
    const controller = new GameSessionController({
      random: createSeededRandom(1953),
      autoAcknowledge: true,
    })
    await enterFirstDuel(controller)

    const opening = controller.getSnapshot()
    const creature = opening.game.sides.player.hand.find((card) => {
      const def = getDef(card.defId)
      return def.type === 'criatura' && def.cost <= opening.game.sides.player.qubits
    })
    expect(creature).toBeDefined()

    await controller.send({ type: 'PLAY_CARD', handUid: creature!.uid })
    const summoned = controller.getSnapshot().game.board.player.find((card) => card.defId === creature!.defId)
    expect(summoned).toBeDefined()

    await controller.send({ type: 'END_TURN' })
    const beforeAttack = controller.getSnapshot().game.sides.ai.coherence
    await controller.send({ type: 'SELECT_CREATURE', uid: summoned!.uid })
    await controller.send({ type: 'SELECT_HERO', owner: 'ai' })

    expect(controller.getSnapshot().game.sides.ai.coherence).toBeLessThan(beforeAttack)
    expect(controller.getSnapshot().selection).toBeNull()
  })

  it('confirma um ataque por arraste com um comando atômico', async () => {
    const controller = new GameSessionController({
      random: createSeededRandom(1953),
      autoAcknowledge: true,
    })
    await enterFirstDuel(controller)

    const opening = controller.getSnapshot()
    const creature = opening.game.sides.player.hand.find((card) => {
      const def = getDef(card.defId)
      return def.type === 'criatura' && def.cost <= opening.game.sides.player.qubits
    })
    expect(creature).toBeDefined()
    await controller.send({ type: 'PLAY_CARD', handUid: creature!.uid })
    const attacker = controller.getSnapshot().game.board.player.find((item) => item.uid === creature!.uid)
    expect(attacker).toBeDefined()

    await controller.send({ type: 'END_TURN' })
    const before = controller.getSnapshot().game.sides.ai.coherence
    await controller.send({
      type: 'ATTACK_TARGET',
      attackerUid: attacker!.uid,
      target: { kind: 'hero', owner: 'ai' },
    })

    expect(controller.getSnapshot().game.sides.ai.coherence).toBeLessThan(before)
    expect(controller.getSnapshot().selection).toBeNull()
  })

  it('produz o mesmo estado final atacando por toque ou arraste', async () => {
    const tapController = new GameSessionController({ random: createSeededRandom(73), autoAcknowledge: true })
    const dragController = new GameSessionController({ random: createSeededRandom(73), autoAcknowledge: true })
    await enterFirstDuel(tapController)
    await enterFirstDuel(dragController)

    for (const controller of [tapController, dragController]) {
      const game = controller.getSnapshot().game
      game.turn = 5
      game.active = 'player'
      game.board.player = [testCreature(940, 'foton', 'player')]
      game.board.ai = [testCreature(941, 'eletron', 'ai')]
    }

    await tapController.send({ type: 'SELECT_CREATURE', uid: 940 })
    await tapController.send({ type: 'SELECT_CREATURE', uid: 941 })
    await dragController.send({ type: 'ATTACK_TARGET', attackerUid: 940, target: { kind: 'creature', uid: 941 } })

    expect(dragController.getSnapshot().game).toEqual(tapController.getSnapshot().game)
  })

  it('só paga um protocolo arrastado quando o alvo é válido', async () => {
    const controller = new GameSessionController({
      random: createSeededRandom(21),
      autoAcknowledge: true,
    })
    await enterFirstDuel(controller)
    const state = controller.getSnapshot()
    state.game.sides.player.hand.push({ uid: 990, defId: 'pulso' })
    state.game.sides.player.qubits = 8
    state.game.sides.player.maxQubits = 8
    const beforeQubits = state.game.sides.player.qubits
    const beforeCoherence = state.game.sides.ai.coherence

    await controller.send({
      type: 'PLAY_CARD_TO_TARGET',
      handUid: 990,
      target: { kind: 'hero', owner: 'player' },
    })
    expect(controller.getSnapshot().game.sides.player.qubits).toBe(beforeQubits)
    expect(controller.getSnapshot().game.sides.player.hand.some((card) => card.uid === 990)).toBe(true)
    expect(controller.getSnapshot().selection).toBeNull()

    await controller.send({
      type: 'PLAY_CARD_TO_TARGET',
      handUid: 990,
      target: { kind: 'hero', owner: 'ai' },
    })
    expect(controller.getSnapshot().game.sides.ai.coherence).toBe(beforeCoherence - 3)
    expect(controller.getSnapshot().game.sides.player.qubits).toBe(beforeQubits - getDef('pulso').cost)
    expect(controller.getSnapshot().game.sides.player.hand.some((card) => card.uid === 990)).toBe(false)
  })

  it('mantém Emaranhar em duas etapas ao começar pelo arraste', async () => {
    const controller = new GameSessionController({ random: createSeededRandom(22), autoAcknowledge: true })
    await enterFirstDuel(controller)
    const state = controller.getSnapshot()
    state.game.turn = 3
    state.game.active = 'player'
    state.game.board.player = [testCreature(951, 'foton', 'player')]
    state.game.board.ai = [testCreature(952, 'neutrino', 'ai')]
    state.game.sides.player.hand.push({ uid: 953, defId: 'emaranhar' })
    state.game.sides.player.qubits = 8
    const beforeQubits = state.game.sides.player.qubits

    await controller.send({
      type: 'PLAY_CARD_TO_TARGET',
      handUid: 953,
      target: { kind: 'creature', uid: 951 },
    })
    expect(controller.getSnapshot().selection).toEqual({
      type: 'spell',
      handUid: 953,
      spell: 'emaranhar',
      collected: [{ kind: 'creature', uid: 951 }],
    })
    expect(controller.getSnapshot().game.sides.player.qubits).toBe(beforeQubits)

    await controller.send({ type: 'SELECT_CREATURE', uid: 952 })
    expect(controller.getSnapshot().game.board.player[0].entangledWith).toBe(952)
    expect(controller.getSnapshot().game.board.ai[0].entangledWith).toBe(951)
    expect(controller.getSnapshot().game.sides.player.qubits).toBe(beforeQubits - getDef('emaranhar').cost)
  })

  it('emite cardCommit antes de remover a ficha da mão', async () => {
    const controller = new GameSessionController({ random: createSeededRandom(81), autoAcknowledge: true })
    await enterFirstDuel(controller)
    const opening = controller.getSnapshot()
    const card = opening.game.sides.player.hand.find((item) => getDef(item.defId).type === 'criatura' && getDef(item.defId).cost <= opening.game.sides.player.qubits)
    expect(card).toBeDefined()
    let observedBeforeMutation = false
    const unsubscribe = controller.subscribe(() => {
      const snapshot = controller.getSnapshot()
      if (snapshot.cues.some((cue) => cue.kind === 'cardCommit' && cue.handUid === card!.uid)) {
        observedBeforeMutation = snapshot.game.sides.player.hand.some((item) => item.uid === card!.uid)
      }
    })

    await controller.send({ type: 'PLAY_CARD', handUid: card!.uid })
    unsubscribe()
    expect(observedBeforeMutation).toBe(true)
    expect(controller.getSnapshot().game.sides.player.hand.some((item) => item.uid === card!.uid)).toBe(false)
  })

  it('restaura o Plantão no último estado seguro, antes do duelo', async () => {
    const storage = new MemoryStorageAdapter()
    const original = new GameSessionController({
      random: createSeededRandom(33),
      storage,
      autoAcknowledge: true,
    })
    await original.send({ type: 'HYDRATE' })
    await original.send({ type: 'START_RUN' })
    const secret = original.getSnapshot().run!.offeredSecrets[1]
    await original.send({ type: 'CHOOSE_INITIAL_SECRET', secret })
    const expected = original.getSnapshot()

    const restored = new GameSessionController({
      random: createSeededRandom(999),
      storage,
      autoAcknowledge: true,
    })
    await restored.send({ type: 'HYDRATE' })

    expect(restored.getSnapshot().phase).toBe('briefing')
    expect(restored.getSnapshot().run).toEqual(expected.run)
    expect(restored.getSnapshot().game).toEqual(expected.game)
    expect(await storage.getItem(RUN_CHECKPOINT_KEY)).not.toBeNull()
  })

  it('só continua uma apresentação bloqueante depois do ACK da interface', async () => {
    const controller = new GameSessionController({ random: createSeededRandom(5) })
    await controller.send({ type: 'START_RUN' })
    const secret = controller.getSnapshot().run!.offeredSecrets[0]
    await controller.send({ type: 'CHOOSE_INITIAL_SECRET', secret })

    const beginning = controller.send({ type: 'BEGIN_DUEL' })
    await Promise.resolve()
    const turnCue = controller.getSnapshot().cues.find((cue) => cue.kind === 'turn')
    expect(turnCue?.blocking).toBe(true)
    expect(controller.getSnapshot().busy).toBe(true)

    await controller.send({ type: 'ACK_PRESENTATION', id: turnCue!.presentationId })
    await beginning
    expect(controller.getSnapshot().busy).toBe(false)
  })

  it('desbloqueia o duelo se a interface não confirmar uma apresentação', async () => {
    vi.useFakeTimers()
    try {
      const controller = new GameSessionController({ random: createSeededRandom(5) })
      await controller.send({ type: 'START_RUN' })
      const secret = controller.getSnapshot().run!.offeredSecrets[0]
      await controller.send({ type: 'CHOOSE_INITIAL_SECRET', secret })

      const beginning = controller.send({ type: 'BEGIN_DUEL' })
      await Promise.resolve()
      expect(controller.getSnapshot().busy).toBe(true)

      await vi.advanceTimersByTimeAsync(8000)
      await beginning

      expect(controller.getSnapshot().busy).toBe(false)
      expect(controller.getSnapshot().cues).toEqual([])
    } finally {
      vi.useRealTimers()
    }
  })
})
