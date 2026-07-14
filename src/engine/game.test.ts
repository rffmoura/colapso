import { describe, expect, it } from 'vitest'
import { getDef } from './cards'
import {
  canAttack,
  collapseCreature,
  damageTarget,
  endTurn,
  finishProtocol,
  influenceCreature,
  newGame,
  playCreature,
  resolveCombat,
  startTurn,
  validAttackTargets,
} from './game'
import type { Creature, MatchSetup, Owner, SecretId } from './types'

function setup(
  playerSecret: SecretId = 'copia-carbono',
  aiSecrets: SecretId[] = ['retaliacao-q88'],
  directives: MatchSetup['directives'] = [],
  boss = false,
): MatchSetup {
  return { duel: boss ? 4 : 1, boss, playerSecret, aiSecrets, directives }
}

function creature(defId: string, uid: number, owner: Owner, face: 0 | 1 | null = null): Creature {
  return {
    uid,
    defId,
    owner,
    collapsed: face,
    hp: face === null ? 0 : getDef(defId).faces![face].health,
    attacksUsed: 0,
    summonedTurn: 0,
    entangledWith: null,
    tempKeywords: [],
  }
}

function givePlayable(state: ReturnType<typeof newGame>, owner: Owner, defId: string, uid: number) {
  state.sides[owner].hand.push({ uid, defId })
  state.sides[owner].qubits = 8
  state.sides[owner].maxQubits = 8
}

describe('influência de Observar', () => {
  it('resolve deterministicamente as fronteiras 75/25', () => {
    const base = newGame(setup())
    base.board.ai.push(creature('gato', 900, 'ai'))

    const success = influenceCreature(base, 'player', 900, 0, 0.749999)
    expect(success.state.board.ai[0].collapsed).toBe(0)
    expect(success.events).toContainEqual(expect.objectContaining({ t: 'influence', success: true, chance: 0.75 }))

    const failure = influenceCreature(base, 'player', 900, 0, 0.75)
    expect(failure.state.board.ai[0].collapsed).toBe(1)
    expect(failure.events).toContainEqual(expect.objectContaining({ t: 'influence', success: false, chance: 0.75 }))
  })

  it('usa 85/15 apenas para a IA sob Calibração Hostil', () => {
    const base = newGame(setup('copia-carbono', ['retaliacao-q88'], ['calibracao-hostil']))
    base.board.player.push(creature('sentinela', 901, 'player'))
    expect(influenceCreature(base, 'ai', 901, 1, 0.849999).state.board.player[0].collapsed).toBe(1)
    expect(influenceCreature(base, 'ai', 901, 1, 0.85).state.board.player[0].collapsed).toBe(0)
  })

  it('dispara Observador Observado só no sucesso e nunca pelo parceiro emaranhado', () => {
    const base = newGame(setup('observador-observado'))
    const target = creature('gato', 902, 'player')
    const partner = creature('quasar', 903, 'ai')
    target.entangledWith = partner.uid
    partner.entangledWith = target.uid
    base.board.player.push(target)
    base.board.ai.push(partner)

    const failed = influenceCreature(base, 'ai', target.uid, 0, 0.75)
    expect(failed.state.sides.player.activeSecret?.id).toBe('observador-observado')
    expect(failed.events.filter((event) => event.t === 'secretTrigger')).toHaveLength(0)

    const success = influenceCreature(base, 'ai', target.uid, 0, 0.2)
    expect(success.state.sides.ai.coherence).toBe(20)
    expect(success.state.board.ai[0].collapsed).toBe(0)
    expect(success.events.filter((event) => event.t === 'secretTrigger')).toHaveLength(1)
  })
})

describe('contramedidas', () => {
  it('Efeito Zeno previne a primeira morte antes do evento death', () => {
    const base = newGame(setup('efeito-zeno'))
    base.board.player.push(creature('foton', 910, 'player', 0))
    const result = damageTarget(base, { kind: 'creature', uid: 910 }, 3)
    expect(result.state.board.player[0].hp).toBe(1)
    expect(result.state.sides.player.activeSecret).toBeNull()
    expect(result.state.sides.player.revealedSecrets).toEqual(['efeito-zeno'])
    expect(result.events.some((event) => event.t === 'death')).toBe(false)
  })

  it('Retaliação Q-88 ocorre depois do ataque direto e causa 4 ao atacante', () => {
    const base = newGame(setup('retaliacao-q88', ['efeito-zeno']))
    const attacker = creature('quasar', 911, 'ai', 0)
    base.board.ai.push(attacker)
    const result = resolveCombat(base, attacker.uid, { kind: 'hero', owner: 'player' })
    expect(result.state.sides.player.coherence).toBe(19)
    expect(result.state.board.ai).toHaveLength(0)
    expect(result.state.sides.ai.activeSecret?.id).toBe('efeito-zeno')
    expect(result.events.findIndex((event) => event.t === 'damage' && event.target.kind === 'hero')).toBeLessThan(
      result.events.findIndex((event) => event.t === 'secretTrigger'),
    )
  })

  it('Reação em Cadeia revela antes do efeito da segunda carta e pode interrompê-la', () => {
    const base = newGame(setup('copia-carbono', ['reacao-em-cadeia']))
    base.sides.player.coherence = 4
    givePlayable(base, 'player', 'foton', 912)
    givePlayable(base, 'player', 'neutrino', 913)
    const first = playCreature(base, 'player', 912)
    const second = playCreature(first.state, 'player', 913)
    expect(second.state.winner).toBe('ai')
    expect(second.state.board.player).toHaveLength(1)
    expect(second.events.some((event) => event.t === 'summon')).toBe(false)
    expect(second.events.findIndex((event) => event.t === 'secretTrigger')).toBeLessThan(
      second.events.findIndex((event) => event.t === 'gameover'),
    )
  })

  it('Protocolo de Emergência deixa o herói em 1 contra dano normal', () => {
    const base = newGame(setup('protocolo-emergencia'))
    base.sides.player.coherence = 3
    const result = damageTarget(base, { kind: 'hero', owner: 'player' }, 7)
    expect(result.state.sides.player.coherence).toBe(1)
    expect(result.state.winner).toBeNull()
    expect(result.state.sides.player.activeSecret).toBeNull()
  })

  it('dano de contramedida não ativa Protocolo de Emergência', () => {
    const base = newGame(setup('protocolo-emergencia', ['reacao-em-cadeia']))
    base.sides.player.coherence = 3
    givePlayable(base, 'player', 'foton', 914)
    givePlayable(base, 'player', 'neutrino', 915)
    const first = playCreature(base, 'player', 914)
    const second = playCreature(first.state, 'player', 915)
    expect(second.state.winner).toBe('ai')
    expect(second.state.sides.player.activeSecret?.id).toBe('protocolo-emergencia')
    expect(second.events.filter((event) => event.t === 'secretTrigger')).toHaveLength(1)
  })

  it('Cópia Carbono compra duas fichas após o protocolo resolver', () => {
    const base = newGame(setup('copia-carbono'))
    const before = base.sides.player.hand.length
    const result = finishProtocol(base, 'ai')
    expect(result.state.sides.player.hand.length).toBe(before + 2)
    expect(result.state.sides.player.activeSecret).toBeNull()
  })

  it('Resíduo de Energia pune o adversário que termina com três qubits', () => {
    const base = newGame(setup('residuo-energia'))
    base.active = 'ai'
    base.sides.ai.qubits = 3
    const result = endTurn(base)
    expect(result.state.sides.ai.coherence).toBe(21)
    expect(result.state.active).toBe('player')
    expect(result.state.sides.player.activeSecret).toBeNull()
  })

  it('arma a segunda contramedida do chefe somente após a primeira disparar', () => {
    const base = newGame(setup('copia-carbono', ['efeito-zeno', 'residuo-energia'], [], true))
    base.board.ai.push(creature('foton', 916, 'ai', 0))
    const first = damageTarget(base, { kind: 'creature', uid: 916 }, 5)
    expect(first.state.sides.ai.activeSecret?.id).toBe('residuo-energia')
    expect(first.state.sides.ai.queuedSecrets).toEqual([])
    expect(first.state.sides.ai.revealedSecrets).toEqual(['efeito-zeno'])
    expect(first.events).toContainEqual({ t: 'secretArmed', owner: 'ai', id: 'residuo-energia' })

    first.state.active = 'player'
    first.state.sides.player.qubits = 3
    const second = endTurn(first.state)
    expect(second.state.sides.ai.activeSecret).toBeNull()
    expect(second.state.sides.ai.revealedSecrets).toEqual(['efeito-zeno', 'residuo-energia'])
    expect(second.state.sides.player.coherence).toBe(21)
  })
})

describe('regressões e Diretrizes', () => {
  it('mantém Barreira, Fantasma, Veloz e colapso forçado', () => {
    const base = newGame(setup())
    const attacker = creature('foton', 920, 'player', 0)
    attacker.summonedTurn = base.turn
    const barrier = creature('sentinela', 921, 'ai', 0)
    base.board.player.push(attacker)
    base.board.ai.push(barrier)
    expect(canAttack(base, attacker)).toBe(true)
    expect(validAttackTargets(base, attacker)).toEqual([{ kind: 'creature', uid: barrier.uid }])
    attacker.tempKeywords = ['fantasma']
    expect(validAttackTargets(base, attacker)).toContainEqual({ kind: 'hero', owner: 'ai' })

    const superposed = creature('gato', 922, 'player')
    base.board.player.push(superposed)
    expect(collapseCreature(base, superposed.uid, 1).state.board.player.at(-1)?.collapsed).toBe(1)
  })

  it('mantém Medição em 50/50 e Polarização com face garantida', () => {
    const base = newGame(setup())
    base.board.ai.push(creature('gato', 923, 'ai'))
    expect(collapseCreature(base, 923, undefined, true, 0.49999).state.board.ai[0].collapsed).toBe(0)
    expect(collapseCreature(base, 923, undefined, true, 0.5).state.board.ai[0].collapsed).toBe(1)
    expect(collapseCreature(base, 923, 0, true, 0.99).state.board.ai[0].collapsed).toBe(0)
  })

  it('aplica vida do chefe, Blindagem, Núcleo, Arquivo e Linha de Montagem', () => {
    const base = newGame(
      setup('copia-carbono', ['retaliacao-q88'], [
        'blindagem-reforcada',
        'nucleo-adiantado',
        'arquivo-prioritario',
        'linha-de-montagem',
      ], true),
    )
    expect(base.sides.ai.coherence).toBe(34)
    expect(base.sides.ai.maxQubits).toBe(1)
    expect(base.sides.ai.hand).toHaveLength(6)

    const uid = 930
    givePlayable(base, 'ai', 'foton', uid)
    base.sides.ai.qubits = 0
    const played = playCreature(base, 'ai', uid)
    expect(played.state.board.ai.some((item) => item.uid === uid)).toBe(true)
  })

  it('refila a mão, recarrega qubits e encerra ao zerar Coerência', () => {
    const base = newGame(setup())
    base.sides.player.hand = base.sides.player.hand.slice(0, 2)
    const started = startTurn(base)
    expect(started.state.sides.player.hand).toHaveLength(5)
    expect(started.state.sides.player.qubits).toBe(1)
    const ended = damageTarget(started.state, { kind: 'hero', owner: 'ai' }, 99)
    expect(ended.state.winner).toBe('player')
    expect(ended.events.at(-1)).toEqual({ t: 'gameover', winner: 'player' })
  })
})
