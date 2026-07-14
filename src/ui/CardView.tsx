import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { getDef } from '../engine/cards'
import type { Face, Keyword } from '../engine/types'
import { CharacterArt } from './characters'

const KW_TIP: Record<Keyword, string> = {
  barreira: 'Barreira: os inimigos são obrigados a atacar este sujeito antes de qualquer outro alvo.',
  veloz: 'Veloz: pode atacar no mesmo turno em que entra em campo.',
  fantasma: 'Fantasma: ignora Barreira; pode atacar qualquer alvo, inclusive o Observador inimigo.',
}

interface CardViewProps {
  defId: string
  collapsed?: 0 | 1 | null
  hp?: number
  size: 'hand' | 'board'
  tempKeywords?: Keyword[]
  showCost?: boolean
}

export function CardView({ defId, collapsed = null, hp, size, tempKeywords = [], showCost = false }: CardViewProps) {
  const def = getDef(defId)
  const isCreature = def.type === 'criatura'

  // revelação do colapso: pulso acelerado → carimbo OBSERVADO → linha ativa acesa
  const [stage, setStage] = useState<'idle' | 'flicker' | 'stamp'>('idle')
  const prev = useRef<0 | 1 | null>(collapsed)
  useEffect(() => {
    const was = prev.current
    prev.current = collapsed
    if (was === null && collapsed !== null) {
      setStage('flicker')
      const t1 = setTimeout(() => setStage('stamp'), 380)
      const t2 = setTimeout(() => setStage('idle'), 1400)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [collapsed])

  const showSuperposed = isCreature && (collapsed === null || stage === 'flicker')

  const classes = [
    'card',
    `size-${size}`,
    showSuperposed ? 'superposed' : '',
    stage === 'flicker' ? 'collapsing-fast' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className="card-head">
        <div className="card-name">{def.name}</div>
        <div className="card-title">{def.title}</div>
      </div>

      <div className="card-window">
        <CharacterArt defId={defId} />
        {isCreature && !showSuperposed && collapsed !== null && hp !== undefined && (
          <div className="hp-now">
            <span>{hp}</span>
            <small>vida</small>
          </div>
        )}
      </div>

      {isCreature && (
        <div className="state-rows">
          <StateRow idx={0} face={def.faces![0]} collapsed={showSuperposed ? null : collapsed} />
          <StateRow idx={1} face={def.faces![1]} collapsed={showSuperposed ? null : collapsed} />
          {tempKeywords.length > 0 && (
            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
              {tempKeywords.map((k) => (
                <span key={k} className="kw kw-temp" data-tip={`${KW_TIP[k]} (só neste turno)`}>
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {size === 'hand' && <div className="card-text">{def.text}</div>}
      {size === 'hand' && (
        <div className="card-footer">
          <span>IMV·{def.id}</span>
          <span>{isCreature ? 'sujeito' : 'protocolo'}</span>
        </div>
      )}

      {showCost && (
        <div className="card-cost" data-tip={`Custa ${def.cost} qubit${def.cost > 1 ? 's' : ''} para jogar`}>
          {def.cost}
        </div>
      )}

      {showSuperposed && (
        <div className="super-seal" data-tip="Em superposição: os dois estados coexistem até alguém observar.">
          <span className="super-a">A</span>
          <span className="super-b">B</span>
        </div>
      )}

      {stage === 'stamp' && collapsed !== null && <StampFx face={collapsed} />}
    </div>
  )
}

function StateRow({
  idx,
  face,
  collapsed,
}: {
  idx: 0 | 1
  face: Face
  collapsed: 0 | 1 | null
}) {
  const active = collapsed === idx
  const dead = collapsed !== null && collapsed !== idx
  return (
    <div className={`state-row state-${idx}${active ? ' active-row' : ''}${dead ? ' dead-row' : ''}`}>
      <span className="state-tag">{idx === 0 ? 'A' : 'B'}</span>
      <span className="state-name">{face.label}</span>
      {face.keywords.map((k) => (
        <span key={k} className="kw" data-tip={KW_TIP[k]}>
          {k}
        </span>
      ))}
      <span className="state-stats">
        <span className="atk">{face.attack}</span>/<span className="hp">{face.health}</span>
      </span>
    </div>
  )
}

function StampFx({ face }: { face: 0 | 1 }) {
  const splats = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + 0.7
    return {
      key: i,
      x: Math.cos(a) * (34 + (i % 3) * 16),
      y: Math.sin(a) * (30 + (i % 2) * 18),
      s: 3 + (i % 3) * 2.5,
    }
  })
  const color = face === 0 ? 'var(--particle)' : 'var(--wave)'
  return (
    <div className="stamp-overlay">
      <motion.div
        className={`stamp-mark${face === 1 ? ' stamp-b' : ''}`}
        initial={{ scale: 2.6, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 1, rotate: -14 }}
        transition={{ duration: 0.22, ease: [0.6, 0, 0.8, 0.4] }}
      >
        Observado
      </motion.div>
      {splats.map((p) => (
        <motion.span
          key={p.key}
          className="ink-splat"
          style={{ background: color, width: p.s, height: p.s, left: '50%', top: '50%' }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: p.x, y: p.y, opacity: [0, 1, 1, 0.7] }}
          transition={{ duration: 0.4, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  )
}
