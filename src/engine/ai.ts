import { getDef } from './cards'
import {
  canAttack,
  canPlay,
  expectedAttack,
  expectedHealth,
  influenceChance,
  keywordsOf,
  validAttackTargets,
} from './game'
import type { GameState, SpellKind, TargetRef } from './types'
import { HERO_POWER_COST, MAX_BOARD } from './types'

export type AiAction =
  | { kind: 'playCreature'; handUid: number }
  | { kind: 'spell'; handUid: number; spell: SpellKind; targets: TargetRef[]; face?: 0 | 1 }
  | { kind: 'attack'; attackerUid: number; target: TargetRef }
  | { kind: 'heropower'; targetUid: number; face: 0 | 1 }
  | { kind: 'end' }

/** Decide UMA próxima ação da IA; o orquestrador chama em loop até 'end'. */
export function decideAi(s: GameState): AiAction {
  if (s.winner) return { kind: 'end' }
  const me = s.sides.ai
  const myBoard = s.board.ai
  const foeBoard = s.board.player

  const playable = me.hand.filter((h) => canPlay(s, 'ai', h.uid))

  // 1. Decoerência quando o tabuleiro inimigo está cheio
  const deco = playable.find((h) => getDef(h.defId).spell === 'decoerencia')
  if (deco && foeBoard.length >= 3) {
    return { kind: 'spell', handUid: deco.uid, spell: 'decoerencia', targets: [] }
  }

  // 2. Pulso para remover ameaça barata ou fechar o jogo
  const pulso = playable.find((h) => getDef(h.defId).spell === 'pulso')
  if (pulso) {
    if (s.sides.player.coherence <= 3) {
      return { kind: 'spell', handUid: pulso.uid, spell: 'pulso', targets: [{ kind: 'hero', owner: 'player' }] }
    }
    const kill = foeBoard.find((c) => c.collapsed !== null && c.hp <= 3 && expectedAttack(c) >= 3)
    if (kill) {
      return { kind: 'spell', handUid: pulso.uid, spell: 'pulso', targets: [{ kind: 'creature', uid: kill.uid }] }
    }
  }

  // 3. Criatura mais cara que couber
  const creatures = playable
    .filter((h) => getDef(h.defId).type === 'criatura')
    .sort((a, b) => getDef(b.defId).cost - getDef(a.defId).cost)
  if (creatures.length > 0 && myBoard.length < MAX_BOARD) {
    return { kind: 'playCreature', handUid: creatures[0].uid }
  }

  // 4. Polarização na melhor criatura própria em superposição
  const pola = playable.find((h) => getDef(h.defId).spell === 'polarizar')
  if (pola) {
    const superposed = myBoard.filter((c) => c.collapsed === null)
    if (superposed.length > 0) {
      const best = superposed.sort((a, b) => bestFaceAttack(b.defId) - bestFaceAttack(a.defId))[0]
      const faces = getDef(best.defId).faces!
      const face: 0 | 1 = faces[0].attack >= faces[1].attack ? 0 : 1
      return { kind: 'spell', handUid: pola.uid, spell: 'polarizar', targets: [{ kind: 'creature', uid: best.uid }], face }
    }
  }

  // 5. Medição: fixa a pior face de uma ameaça ou a melhor face de um aliado
  const medir = playable.find((h) => getDef(h.defId).spell === 'medir')
  if (medir) {
    const scary = foeBoard
      .filter((c) => c.collapsed === null)
      .sort((a, b) => expectedAttack(b) - expectedAttack(a))[0]
    if (scary && expectedAttack(scary) >= 2.5) {
      return {
        kind: 'spell',
        handUid: medir.uid,
        spell: 'medir',
        targets: [{ kind: 'creature', uid: scary.uid }],
        face: worstFace(scary.defId),
      }
    }
    const ally = myBoard
      .filter((c) => c.collapsed === null)
      .sort((a, b) => bestFaceValue(b.defId) - bestFaceValue(a.defId))[0]
    if (ally) {
      return {
        kind: 'spell',
        handUid: medir.uid,
        spell: 'medir',
        targets: [{ kind: 'creature', uid: ally.uid }],
        face: bestFace(ally.defId),
      }
    }
  }

  // 6. Emaranhar a própria criatura mais fraca com a mais forte do inimigo
  const ema = playable.find((h) => getDef(h.defId).spell === 'emaranhar')
  if (ema && myBoard.length > 0 && foeBoard.length > 0) {
    const mineFree = myBoard.filter((c) => c.entangledWith === null)
    const foeFree = foeBoard.filter((c) => c.entangledWith === null)
    if (mineFree.length > 0 && foeFree.length > 0) {
      const mine = mineFree.sort((a, b) => expectedHealth(a) - expectedHealth(b))[0]
      const foe = foeFree.sort((a, b) => expectedAttack(b) + expectedHealth(b) - (expectedAttack(a) + expectedHealth(a)))[0]
      if (expectedAttack(foe) + expectedHealth(foe) >= 7) {
        return {
          kind: 'spell',
          handUid: ema.uid,
          spell: 'emaranhar',
          targets: [
            { kind: 'creature', uid: mine.uid },
            { kind: 'creature', uid: foe.uid },
          ],
        }
      }
    }
  }

  // 7. Flutuação com a mão vazia
  const flut = playable.find((h) => getDef(h.defId).spell === 'flutuacao')
  if (flut && me.hand.length <= 2) {
    return { kind: 'spell', handUid: flut.uid, spell: 'flutuacao', targets: [] }
  }

  // 8. Túnel para dano letal por cima de Barreira
  const tun = playable.find((h) => getDef(h.defId).spell === 'tunel')
  if (tun) {
    const blocked = myBoard.find(
      (c) =>
        canAttack(s, c) &&
        c.collapsed !== null &&
        expectedAttack(c) >= s.sides.player.coherence &&
        !keywordsOf(c).includes('fantasma'),
    )
    const playerHasBarrier = foeBoard.some((c) => keywordsOf(c).includes('barreira'))
    if (blocked && playerHasBarrier) {
      return { kind: 'spell', handUid: tun.uid, spell: 'tunel', targets: [{ kind: 'creature', uid: blocked.uid }] }
    }
  }

  // 9. Poder de herói: observar a superposição inimiga mais perigosa
  if (!me.heroPowerUsed && me.qubits >= HERO_POWER_COST) {
    const candidates = foeBoard
      .filter((c) => c.collapsed === null)
      .map((c) => ({ c, ...bestInfluenceAgainst(s, c.defId) }))
      .sort((a, b) => b.priority - a.priority)
    const best = candidates[0]
    if (best && best.priority >= 1.4) {
      return { kind: 'heropower', targetUid: best.c.uid, face: best.face }
    }
  }

  // 10. Ataques
  const attacker = myBoard.find((c) => canAttack(s, c))
  if (attacker) {
    const targets = validAttackTargets(s, attacker)
    const heroTarget = targets.find((t) => t.kind === 'hero')
    const myAtk = expectedAttack(attacker)

    if (heroTarget && myAtk >= s.sides.player.coherence) {
      return { kind: 'attack', attackerUid: attacker.uid, target: heroTarget }
    }

    const creatureTargets = targets.filter((t) => t.kind === 'creature')
    let best: { target: TargetRef; score: number } | null = null
    for (const t of creatureTargets) {
      if (t.kind !== 'creature') continue
      const foe = s.board.player.find((c) => c.uid === t.uid)
      if (!foe) continue
      const kills = myAtk >= expectedHealth(foe)
      const survives = expectedAttack(foe) < expectedHealth(attacker)
      let score = 0
      if (kills && survives) score = 10 + expectedAttack(foe)
      else if (kills && getDef(foe.defId).cost > getDef(attacker.defId).cost) score = 5 + expectedAttack(foe)
      else if (!heroTarget) score = 1 + expectedAttack(foe) / 10 // barreira obriga: ataca mesmo assim
      if (score > 0 && (!best || score > best.score)) best = { target: t, score }
    }
    if (best) return { kind: 'attack', attackerUid: attacker.uid, target: best.target }
    if (heroTarget) return { kind: 'attack', attackerUid: attacker.uid, target: heroTarget }
    // sem alvo que valha a pena: marca como usado atacando... não; apenas encerra os ataques desta criatura
  }

  return { kind: 'end' }
}

function bestFaceAttack(defId: string): number {
  const faces = getDef(defId).faces!
  return Math.max(faces[0].attack, faces[1].attack)
}

function faceTacticalValue(defId: string, face: 0 | 1): number {
  const state = getDef(defId).faces![face]
  const keywordValue = state.keywords.reduce((total, keyword) => {
    if (keyword === 'barreira') return total + 1.8
    if (keyword === 'veloz') return total + 1.4
    return total + 2.6
  }, 0)
  return state.attack * 1.35 + state.health + keywordValue
}

function bestFace(defId: string): 0 | 1 {
  return faceTacticalValue(defId, 0) >= faceTacticalValue(defId, 1) ? 0 : 1
}

function worstFace(defId: string): 0 | 1 {
  return faceTacticalValue(defId, 0) <= faceTacticalValue(defId, 1) ? 0 : 1
}

function bestFaceValue(defId: string): number {
  return Math.max(faceTacticalValue(defId, 0), faceTacticalValue(defId, 1))
}

export function bestInfluenceAgainst(s: GameState, defId: string): { face: 0 | 1; priority: number } {
  const a = faceTacticalValue(defId, 0)
  const b = faceTacticalValue(defId, 1)
  const face: 0 | 1 = a <= b ? 0 : 1
  const low = Math.min(a, b)
  const high = Math.max(a, b)
  const chance = influenceChance(s, 'ai')
  const biasedExpected = low * chance + high * (1 - chance)
  const randomExpected = (a + b) / 2
  const disruption = randomExpected - biasedExpected
  return { face, priority: disruption + randomExpected * 0.12 }
}
