import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { refRegistry, restart, useStore } from '../state/store'

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
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(8px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={`turn-banner-text ${mine ? 'mine' : 'theirs'}`}>
              {mine ? 'Seu turno' : 'Turno da IA'}
            </div>
            <div className="turn-banner-sub">turno {b.turn}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
  key: string
}

/** Linhas de emaranhamento entre pares vinculados, recalculadas a cada frame. */
export function EntangleLayer() {
  const st = useStore()
  const [lines, setLines] = useState<Line[]>([])
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
      const next: Line[] = []
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
        const my = (l.y1 + l.y2) / 2 - 30
        return <path key={l.key} className="entangle-line" d={`M ${l.x1} ${l.y1} Q ${mx} ${my} ${l.x2} ${l.y2}`} />
      })}
    </svg>
  )
}

/** Seta de mira: da origem da ação até o cursor. */
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
      <path
        className={`arrow-line${isSpell ? ' spell' : ''}`}
        d={`M ${x1} ${y1} Q ${mx} ${my} ${mouse.x} ${mouse.y}`}
      />
      <circle
        cx={mouse.x}
        cy={mouse.y}
        r={7}
        fill={isSpell ? 'var(--entangle)' : 'var(--particle)'}
        opacity={0.9}
      />
    </svg>
  )
}

export function GameOverOverlay() {
  const st = useStore()
  const won = st.game.winner === 'player'
  const burst = useRef(
    Array.from({ length: 26 }, (_, i) => ({
      key: i,
      x: (Math.random() - 0.5) * 560,
      y: (Math.random() - 0.5) * 420,
      delay: Math.random() * 0.4,
    })),
  )
  return (
    <motion.div
      className={`gameover ${won ? 'win' : 'lose'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {won &&
        burst.current.map((p) => (
          <motion.span
            key={p.key}
            className="collapse-particle"
            style={{
              position: 'fixed',
              left: '50%',
              top: '42%',
              background: p.key % 2 === 0 ? 'var(--particle)' : 'var(--wave)',
              width: 7,
              height: 7,
            }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: p.x, y: p.y, opacity: 0 }}
            transition={{ duration: 1.4, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      <motion.h1
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 18 }}
      >
        {won ? 'Coerência total' : 'Decoerência'}
      </motion.h1>
      <p>
        {won
          ? 'A função de onda do oponente foi reduzida a ruído. O universo escolheu você.'
          : 'Sua função de onda se dissolveu no ambiente. O universo insiste em ser clássico.'}
      </p>
      <button className="btn-start" onClick={restart}>
        Jogar de novo
      </button>
    </motion.div>
  )
}
