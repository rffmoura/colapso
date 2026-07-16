import { createSeededRandom, getDef } from '@colapso/game-core'
import { describe, expect, it } from 'vitest'
import { GameSessionController, RUN_CHECKPOINT_KEY } from './controller'
import { MemoryStorageAdapter } from './storage'

async function enterFirstDuel(controller: GameSessionController) {
  await controller.send({ type: 'START_RUN' })
  const offered = controller.getSnapshot().run?.offeredSecrets[0]
  if (!offered) throw new Error('draft sem opções')
  await controller.send({ type: 'CHOOSE_INITIAL_SECRET', secret: offered })
  await controller.send({ type: 'BEGIN_DUEL' })
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
})
