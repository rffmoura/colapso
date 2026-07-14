import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import {
  dismissAllMemos,
  dismissMemo,
  refRegistry,
  restart,
  toggleManual,
  useStore,
} from '../state/store'
import { MEMOS } from './didactics'

export function TurnBanner() {
  const st = useStore()
  const b = st.banner
  const mine = b?.owner === 'player'
  return (
    <div className="turn-banner">
      <AnimatePresence>
        {b && (
          <motion.div
            key={`${b.owner}-${b.turn}`}
            className="telegram"
            initial={{ opacity: 0, x: -70, rotate: -1.5 }}
            animate={{ opacity: 1, x: 0, rotate: -0.5 }}
            exit={{ opacity: 0, x: 70 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={`telegram-text ${mine ? 'mine' : 'theirs'}`}>
              {mine ? 'Seu plantão' : 'Vez do Autômato'}
            </div>
            <div className="telegram-sub">turno {b.turn} · instituto meia-vida</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface StringLine {
  x1: number
  y1: number
  x2: number
  y2: number
  key: string
}

/** Barbante vermelho de mural de evidências entre sujeitos emaranhados. */
export function EntangleLayer() {
  const st = useStore()
  const [lines, setLines] = useState<StringLine[]>([])
  const pairs: Array<[number, number]> = []
  for (const c of [...st.game.board.player, ...st.game.board.ai]) {
    if (c.entangledWith !== null && c.uid < c.entangledWith) pairs.push([c.uid, c.entangledWith])
  }
  const pairsKey = pairs.map((p) => p.join('-')).join(',')

  useEffect(() => {
    if (!pairsKey) {
      setLines([])
      return
    }
    let raf = 0
    const tick = () => {
      const next: StringLine[] = []
      for (const part of pairsKey.split(',')) {
        const [a, b] = part.split('-').map(Number)
        const ea = refRegistry.get(`c-${a}`)
        const eb = refRegistry.get(`c-${b}`)
        if (!ea || !eb) continue
        const ra = ea.getBoundingClientRect()
        const rb = eb.getBoundingClientRect()
        next.push({
          x1: ra.x + ra.width / 2,
          y1: ra.y + ra.height / 2,
          x2: rb.x + rb.width / 2,
          y2: rb.y + rb.height / 2,
          key: part,
        })
      }
      setLines(next)
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [pairsKey])

  if (lines.length === 0) return null
  return (
    <svg className="entangle-svg">
      {lines.map((l) => {
        const mx = (l.x1 + l.x2) / 2
        const sag = Math.min(46, Math.abs(l.x2 - l.x1) * 0.12 + 18)
        const my = (l.y1 + l.y2) / 2 + sag
        return (
          <g key={l.key}>
            <path className="string-line" d={`M ${l.x1} ${l.y1} Q ${mx} ${my} ${l.x2} ${l.y2}`} />
            <circle className="string-pin" cx={l.x1} cy={l.y1} r="5" />
            <circle className="string-pin" cx={l.x2} cy={l.y2} r="5" />
          </g>
        )
      })}
    </svg>
  )
}

/** Linha de mira: traço de lápis da origem até o cursor. */
export function TargetingArrow() {
  const st = useStore()
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
  const active = st.selection !== null && st.selection.type !== 'polarizeFace'

  useEffect(() => {
    if (!active) {
      setMouse(null)
      return
    }
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [active])

  if (!active || !mouse) return null

  const sel = st.selection!
  const sourceKey = sel.type === 'attacker' ? `c-${sel.uid}` : 'hero-player'
  const el = refRegistry.get(sourceKey)
  if (!el) return null
  const r = el.getBoundingClientRect()
  const x1 = r.x + r.width / 2
  const y1 = r.y + r.height / 2
  const isSpell = sel.type !== 'attacker'
  const mx = (x1 + mouse.x) / 2
  const my = Math.min(y1, mouse.y) - 60

  return (
    <svg className="arrow-svg">
      <path className={`arrow-line${isSpell ? ' spell' : ''}`} d={`M ${x1} ${y1} Q ${mx} ${my} ${mouse.x} ${mouse.y}`} />
      <circle cx={mouse.x} cy={mouse.y} r={8} fill="none" stroke={isSpell ? 'var(--entangle)' : 'var(--ink)'} strokeWidth={3} />
      <circle cx={mouse.x} cy={mouse.y} r={2.4} fill={isSpell ? 'var(--entangle)' : 'var(--ink)'} />
    </svg>
  )
}

export function GameOverOverlay() {
  const st = useStore()
  const won = st.game.winner === 'player'
  return (
    <motion.div
      className="gameover"
      role="dialog"
      aria-modal="true"
      aria-label={won ? 'Relatório final: aprovado' : 'Relatório final: arquivado'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={`report ${won ? 'win' : 'lose'}`}
        initial={{ y: 60, rotate: -3, opacity: 0 }}
        animate={{ y: 0, rotate: -0.8, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 210, damping: 20 }}
      >
        <motion.div
          className="verdict"
          initial={{ scale: 2.4, opacity: 0, rotate: 24 }}
          animate={{ scale: 1, opacity: 1, rotate: 12 }}
          transition={{ delay: 0.45, duration: 0.2, ease: [0.6, 0, 0.8, 0.4] }}
        >
          {won ? 'Aprovado' : 'Arquivado'}
        </motion.div>
        <div className="report-kicker">instituto meia-vida · relatório de plantão</div>
        <h1>{won ? 'Coerência total' : 'Decoerência'}</h1>
        <p>
          {won
            ? 'A função de onda do Autômato foi reduzida a ruído de fundo. O Supervisor deixou um bilhete: "aceitável". É o maior elogio registrado desde 1953.'
            : 'Sua função de onda se dissolveu no ambiente. O Autômato já datilografou o relatório em três vias. Requisite um novo plantão.'}
        </p>
        <button className="btn-stamp" onClick={restart}>
          Novo plantão
        </button>
      </motion.div>
    </motion.div>
  )
}

/** Memorando didático do Supervisor (um por vez, sem cobrir as ações da mesa). */
export function MemoToast() {
  const st = useStore()
  const memo = st.memoQueue.length > 0 ? MEMOS[st.memoQueue[0]] : null
  return (
    <AnimatePresence>
      {memo && (
        <motion.div
          key={memo.id}
          className="memo"
          role="status"
          aria-live="polite"
          initial={{ y: 90, opacity: 0, rotate: 5 }}
          animate={{ y: 0, opacity: 1, rotate: 1.2 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="memo-kicker">memorando do supervisor</div>
          <div className="memo-title">{memo.title}</div>
          <div className="memo-text">{memo.text}</div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="memo-btn" onClick={dismissMemo}>
              Entendido
            </button>
            <button className="memo-btn" style={{ opacity: 0.65 }} onClick={dismissAllMemos}>
              Já sei jogar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ManualOverlay() {
  const st = useStore()
  if (!st.manualOpen) return null
  return (
    <div className="manual-overlay" onClick={toggleManual}>
      <motion.div
        className="manual"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-title"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 id="manual-title">Manual do Observador</h2>
        <div className="manual-sub">instituto meia-vida · circular interna nº 7 · leia antes de tocar em qualquer coisa</div>

        <h3><span className="dot" style={{ background: 'var(--approve)' }} />Objetivo</h3>
        <p>
          Zere a Coerência do Autômato (ele começa com 25; você também). Sujeitos em campo atacam uma
          vez por turno; protocolos são efeitos de uso único. Tudo custa Qubits; você ganha 1 de
          máximo por turno (até 8) e eles recarregam inteiros a cada plantão.
        </p>

        <h3><span className="dot" style={{ background: 'var(--ink)' }} />Combate</h3>
        <p>
          Cada estado tem ATAQUE (vermelho) e VIDA (azul). Após o colapso, o selo azul VIDA sobre a
          arte mostra a vida ATUAL do sujeito. Combate entre sujeitos é uma troca simultânea: cada
          um causa seu ataque na vida do outro, e o dano acumula entre turnos; morre quem chegar a
          zero (às vezes, os dois). Atacar o Observador inimigo não gera revide. Sujeito inimigo
          vivo ataca todo turno: às vezes vale mais removê-lo do que ir na cara.
        </p>

        <h3><span className="dot" style={{ background: 'linear-gradient(90deg, var(--particle) 50%, var(--wave) 50%)' }} />Superposição</h3>
        <p>
          Toda ficha de sujeito tem DOIS estados: a linha A (vermelha) e a linha B (azul), com ataque,
          vida e habilidades próprios. Enquanto as duas linhas pulsam, o sujeito está em superposição:
          é os dois ao mesmo tempo e não tem palavra-chave nenhuma.
        </p>

        <h3><span className="dot" style={{ background: 'var(--particle)' }} />Colapso</h3>
        <p>
          Quando um sujeito em superposição ataca, é atacado ou é medido, ele COLAPSA: um carimbo
          sorteia um dos dois estados (50/50) para sempre. Protocolos como Medição e o poder Observar
          forçam o colapso na hora que for melhor para você.
        </p>

        <h3><span className="dot" style={{ background: 'var(--entangle)' }} />Emaranhamento</h3>
        <p>
          O Protocolo E-03 amarra um sujeito seu a um inimigo com barbante vermelho: quando um
          colapsa, o outro colapsa junto (no mesmo estado, A com A, B com B); quando um morre, o outro
          sofre 2 de dano de eco.
        </p>

        <h3><span className="dot" style={{ background: 'var(--ink)' }} />Palavras-chave</h3>
        <p>
          BARREIRA: precisa ser atacado primeiro. VELOZ: ataca no turno em que entra. FANTASMA:
          ignora Barreira. Lembre: só valem no estado colapsado que as possui.
        </p>

        <h3><span className="dot" style={{ background: 'var(--energy)' }} />Arquivo e refil</h3>
        <p>
          No início do seu turno você compra até ficar com 5 fichas (sempre ao menos 1). Quando o
          arquivo esvazia, o descarte inteiro volta embaralhado. Nunca existe turno sem jogada.
        </p>

        <div className="close-row">
          <button className="btn-paper" onClick={toggleManual}>
            Voltar ao plantão
          </button>
        </div>
      </motion.div>
    </div>
  )
}
