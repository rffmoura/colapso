import { describe, expect, it } from 'vitest'
import { getDef } from './cards'
import {
  canAttack,
  collapseCreature,
  damageTarget,
  endTurn,
  finishProtocol,
  grantTunnel,
  influenceCreature,
  keywordsOf,
  newGame,
  playCreature,
  resolveCombat,
  startTurn,
  validAttackTargets,
} from './game'
import type { Creature, MatchSetup, Owner, SecretId } from './types'
import { STARTING_QUBITS } from './types'

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
    ghostProtected: false,
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
    expect(success.events).toContainEqual({
      t: 'damage',
      target: { kind: 'hero', owner: 'ai' },
      amount: 5,
      source: 'secret',
    })
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
    expect(result.events).toContainEqual({
      t: 'damage',
      target: { kind: 'creature', uid: attacker.uid },
      amount: 4,
      source: 'secret',
    })
    expect(result.events).toContainEqual({
      t: 'death',
      uid: attacker.uid,
      defId: attacker.defId,
      owner: 'ai',
      source: 'secret',
    })
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
    expect(second.events).toContainEqual({
      t: 'damage',
      target: { kind: 'hero', owner: 'player' },
      amount: 4,
      source: 'secret',
    })
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
    expect(result.events).toContainEqual({
      t: 'damage',
      target: { kind: 'hero', owner: 'ai' },
      amount: 4,
      source: 'secret',
    })
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
  it('mantém Barreira, Fantasma, preparação e colapso forçado', () => {
    const base = newGame(setup())
    const attacker = creature('foton', 920, 'player', 0)
    attacker.summonedTurn = base.turn
    const barrier = creature('sentinela', 921, 'ai', 0)
    base.board.player.push(attacker)
    base.board.ai.push(barrier)
    expect(canAttack(base, attacker)).toBe(false)
    attacker.summonedTurn = base.turn - 1
    expect(canAttack(base, attacker)).toBe(true)
    expect(validAttackTargets(base, attacker)).toEqual([{ kind: 'creature', uid: barrier.uid }])
    attacker.tempKeywords = ['fantasma']
    expect(validAttackTargets(base, attacker)).toContainEqual({ kind: 'hero', owner: 'ai' })

    const superposed = creature('gato', 922, 'player')
    base.board.player.push(superposed)
    expect(collapseCreature(base, superposed.uid, 1).state.board.player.at(-1)?.collapsed).toBe(1)
  })

  it('mantém o colapso comum em 50/50 e aceita uma face garantida', () => {
    const base = newGame(setup())
    base.board.ai.push(creature('gato', 923, 'ai'))
    expect(collapseCreature(base, 923, undefined, true, 0.49999).state.board.ai[0].collapsed).toBe(0)
    expect(collapseCreature(base, 923, undefined, true, 0.5).state.board.ai[0].collapsed).toBe(1)
    expect(collapseCreature(base, 923, 0, true, 0.99).state.board.ai[0].collapsed).toBe(0)
    expect(getDef('medicao').cost).toBe(3)
  })

  it('Fantasma protege de ataques até o próximo turno do dono', () => {
    const base = newGame(setup())
    base.turn = 2
    const ghost = creature('neutrino', 924, 'player')
    const attacker = creature('foton', 925, 'ai', 0)
    base.board.player.push(ghost)
    base.board.ai.push(attacker)

    const collapsed = collapseCreature(base, ghost.uid, 0)
    expect(collapsed.state.board.player[0].ghostProtected).toBe(true)
    collapsed.state.active = 'ai'
    expect(validAttackTargets(collapsed.state, collapsed.state.board.ai[0])).toEqual([
      { kind: 'hero', owner: 'player' },
    ])

    collapsed.state.active = 'player'
    const nextOwnerTurn = startTurn(collapsed.state)
    expect(nextOwnerTurn.state.board.player[0].ghostProtected).toBe(false)
  })

  it('Túnel mantém Fantasma durante o turno inimigo e ainda permite revide', () => {
    const base = newGame(setup())
    base.turn = 3
    const ghost = creature('neutrino', 926, 'player', 0)
    ghost.summonedTurn = base.turn
    const defender = creature('sentinela', 927, 'ai', 0)
    base.board.player.push(ghost)
    base.board.ai.push(defender)

    expect(canAttack(base, ghost)).toBe(false)
    const granted = grantTunnel(base, ghost.uid)
    expect(canAttack(granted.state, granted.state.board.player[0])).toBe(true)
    const enemyTurn = startTurn(endTurn(granted.state).state)
    expect(enemyTurn.state.board.player[0].tempKeywords).toContain('fantasma')
    expect(enemyTurn.state.board.player[0].ghostProtected).toBe(true)

    const countered = resolveCombat(granted.state, ghost.uid, { kind: 'creature', uid: defender.uid })
    expect(countered.state.board.player).toHaveLength(0)

    const ownerTurn = startTurn(endTurn(enemyTurn.state).state)
    expect(ownerTurn.state.board.player[0].tempKeywords).toEqual([])
    expect(ownerTurn.state.board.player[0].ghostProtected).toBe(false)
  })

  it('Túnel continua protegendo um sujeito que colapsa em uma face sem Fantasma', () => {
    const base = newGame(setup())
    const subject = creature('neutrino', 928, 'player')
    base.board.player.push(subject)

    const granted = grantTunnel(base, subject.uid)
    const collapsed = collapseCreature(granted.state, subject.uid, 1)

    expect(collapsed.state.board.player[0].collapsed).toBe(1)
    expect(collapsed.state.board.player[0].tempKeywords).toContain('fantasma')
    expect(collapsed.state.board.player[0].ghostProtected).toBe(true)
  })

  it('Oscilação troca o estado depois do ataque sem recuperar Vida', () => {
    const base = newGame(setup('copia-carbono', ['copia-carbono']))
    base.turn = 2
    const cat = creature('gato', 929, 'player', 0)
    const partner = creature('sentinela', 933, 'ai')
    cat.hp = 1
    cat.entangledWith = partner.uid
    partner.entangledWith = cat.uid
    base.board.player.push(cat)
    base.board.ai.push(partner)

    const result = resolveCombat(base, cat.uid, { kind: 'hero', owner: 'ai' })
    const shifted = result.state.board.player[0]

    expect(result.state.sides.ai.coherence).toBe(21)
    expect(shifted.collapsed).toBe(1)
    expect(shifted.hp).toBe(1)
    expect(keywordsOf(shifted)).toContain('barreira')
    expect(result.state.board.ai[0].collapsed).toBeNull()
    expect(result.events).toContainEqual({ t: 'oscillate', uid: cat.uid, from: 0, to: 1 })
  })

  it('Oscilação limita a Vida atual ao máximo do novo estado', () => {
    const base = newGame(setup('copia-carbono', ['copia-carbono']))
    base.turn = 2
    const hunger = creature('singularidade', 930, 'player', 1)
    base.board.player.push(hunger)

    const result = resolveCombat(base, hunger.uid, { kind: 'hero', owner: 'ai' })
    expect(result.state.board.player[0].collapsed).toBe(0)
    expect(result.state.board.player[0].hp).toBe(6)
  })

  it('Oscilação não acontece quando o atacante morre no combate', () => {
    const base = newGame(setup('copia-carbono', ['copia-carbono']))
    base.turn = 2
    const photon = creature('foton', 931, 'player', 0)
    const guard = creature('sentinela', 932, 'ai', 1)
    base.board.player.push(photon)
    base.board.ai.push(guard)

    const result = resolveCombat(base, photon.uid, { kind: 'creature', uid: guard.uid })
    expect(result.state.board.player).toHaveLength(0)
    expect(result.events.some((event) => event.t === 'oscillate')).toBe(false)
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
    expect(base.sides.ai.hand).toHaveLength(6)

    base.active = 'ai'
    const firstAiTurn = startTurn(base)
    expect(firstAiTurn.state.sides.ai.maxQubits).toBe(STARTING_QUBITS + 1)
    expect(firstAiTurn.state.sides.ai.qubits).toBe(STARTING_QUBITS + 1)

    const uid = 930
    givePlayable(firstAiTurn.state, 'ai', 'foton', uid)
    firstAiTurn.state.sides.ai.qubits = 0
    const played = playCreature(firstAiTurn.state, 'ai', uid)
    expect(played.state.board.ai.some((item) => item.uid === uid)).toBe(true)
  })

  it('inicia os dois lados com 2 Qubits e cresce normalmente nos turnos seguintes', () => {
    const base = newGame(setup())
    const playerTurn = startTurn(base)
    expect(playerTurn.state.sides.player.maxQubits).toBe(STARTING_QUBITS)
    expect(playerTurn.state.sides.player.qubits).toBe(STARTING_QUBITS)

    const aiTurn = startTurn(endTurn(playerTurn.state).state)
    expect(aiTurn.state.sides.ai.maxQubits).toBe(STARTING_QUBITS)
    expect(aiTurn.state.sides.ai.qubits).toBe(STARTING_QUBITS)

    const nextPlayerTurn = startTurn(endTurn(aiTurn.state).state)
    expect(nextPlayerTurn.state.sides.player.maxQubits).toBe(STARTING_QUBITS + 1)
    expect(nextPlayerTurn.state.sides.player.qubits).toBe(STARTING_QUBITS + 1)
  })

  it('refila a mão, recarrega os Qubits e encerra ao zerar Coerência', () => {
    const base = newGame(setup())
    base.sides.player.hand = base.sides.player.hand.slice(0, 2)
    const started = startTurn(base)
    expect(started.state.sides.player.hand).toHaveLength(5)
    expect(started.state.sides.player.qubits).toBe(STARTING_QUBITS)
    const ended = damageTarget(started.state, { kind: 'hero', owner: 'ai' }, 99)
    expect(ended.state.winner).toBe('player')
    expect(ended.events.at(-1)).toEqual({ t: 'gameover', winner: 'player' })
  })
})
