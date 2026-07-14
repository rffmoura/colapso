import { describe, expect, it } from 'vitest'
import { decideAi } from './ai'
import { newGame } from './game'
import type { MatchSetup } from './types'

const setup: MatchSetup = {
  duel: 2,
  boss: false,
  playerSecret: 'efeito-zeno',
  aiSecrets: ['retaliacao-q88'],
  directives: ['calibracao-hostil'],
}

describe('informação oculta da IA', () => {
  it('produz a mesma decisão quando só a identidade secreta do jogador muda', () => {
    const first = newGame(setup)
    first.active = 'ai'
    first.sides.ai.qubits = 8
    first.sides.ai.maxQubits = 8
    const second = structuredClone(first)
    second.sides.player.activeSecret = { id: 'observador-observado' }
    expect(decideAi(first)).toEqual(decideAi(second))
  })
})
