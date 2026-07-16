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
    const second = JSON.parse(JSON.stringify(first)) as typeof first
    second.sides.player.activeSecret = { id: 'observador-observado' }
    expect(decideAi(first)).toEqual(decideAi(second))
  })

  it('Medição escolhe a face taticamente pior de um sujeito inimigo', () => {
    const state = newGame(setup)
    state.active = 'ai'
    state.sides.ai.hand = [{ uid: 700, defId: 'medicao' }]
    state.sides.ai.qubits = 3
    state.sides.ai.maxQubits = 3
    state.board.ai = []
    state.board.player = [
      {
        uid: 701,
        defId: 'gato',
        owner: 'player',
        collapsed: null,
        hp: 0,
        attacksUsed: 0,
        summonedTurn: 0,
        entangledWith: null,
        tempKeywords: [],
        ghostProtected: false,
      },
    ]

    expect(decideAi(state)).toEqual({
      kind: 'spell',
      handUid: 700,
      spell: 'medir',
      targets: [{ kind: 'creature', uid: 701 }],
      face: 0,
    })
  })

  it('Túnel prepara uma ameaça recém-jogada para atacar', () => {
    const state = newGame(setup)
    state.turn = 4
    state.active = 'ai'
    state.sides.ai.hand = [{ uid: 710, defId: 'tunel' }]
    state.sides.ai.qubits = 2
    state.sides.ai.maxQubits = 4
    state.board.ai = [
      {
        uid: 711,
        defId: 'quasar',
        owner: 'ai',
        collapsed: null,
        hp: 0,
        attacksUsed: 0,
        summonedTurn: state.turn,
        entangledWith: null,
        tempKeywords: [],
        ghostProtected: false,
      },
    ]
    state.board.player = []

    expect(decideAi(state)).toEqual({
      kind: 'spell',
      handUid: 710,
      spell: 'tunel',
      targets: [{ kind: 'creature', uid: 711 }],
    })
  })
})
