import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { getDef } from '../engine/cards'
import type { Keyword } from '../engine/types'
import { CardArt } from './CardArt'

export const SIGILS: Record<string, string> = {
  foton: 'γ',
  neutrino: 'ν',
  sentinela: '◈',
  eletron: 'ε',
  gato: 'Ψ',
  colapsador: '◎',
  ondapiloto: '≈',
  quasar: '✺',
  singularidade: '◉',
  medicao: '⌖',
  polarizacao: '⇅',
  emaranhar: '∞',
  tunel: '⤳',
  pulso: '↯',
  decoerencia: '∅',
  flutuacao: '∿',
}

const KW_LABEL: Record<Keyword, string> = {
  barreira: 'barreira',
  veloz: 'veloz',
  fantasma: 'fantasma',
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

  // revelação do colapso: cintilação rápida → flash → face final
  const [reveal, setReveal] = useState<'idle' | 'flicker' | 'burst'>('idle')
  const prev = useRef<0 | 1 | null>(collapsed)
  useEffect(() => {
    const was = prev.current
    prev.current = collapsed
    if (was === null && collapsed !== null) {
      setReveal('flicker')
      const t1 = setTimeout(() => setReveal('burst'), 470)
      const t2 = setTimeout(() => setReveal('idle'), 1150)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [collapsed])

  const showSuperposed = isCreature && (collapsed === null || reveal === 'flicker')
  const face = !showSuperposed && collapsed !== null ? def.faces![collapsed] : null

  const frameClass = [
    'card',
    `size-${size}`,
    showSuperposed ? 'superposed superposed-frame' : '',
    reveal === 'flicker' ? 'collapsing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={frameClass}>
      <div className="card-inner">
        <div className="card-name">{def.name}</div>
        <div className="card-art">
          {isCreature ? (
            showSuperposed ? (
              <>
                <FaceArt idx={0} label={def.faces![0].label} sigil={SIGILS[defId] ?? '✦'} defId={defId} />
                <FaceArt idx={1} label={def.faces![1].label} sigil={SIGILS[defId] ?? '✦'} defId={defId} />
              </>
            ) : (
              <FaceArt idx={collapsed!} label={face!.label} sigil={SIGILS[defId] ?? '✦'} defId={defId} />
            )
          ) : (
            <div className="card-face-art" style={{ color: 'var(--entangle)' }}>
              <CardArt defId={defId} />
              <span className="face-sigil">{SIGILS[defId] ?? '✦'}</span>
            </div>
          )}
          {isCreature && (
            <div className="kw-row">
              {face?.keywords.map((k) => (
                <span key={k} className="kw">
                  {KW_LABEL[k]}
                </span>
              ))}
              {tempKeywords.map((k) => (
                <span key={`t-${k}`} className="kw kw-temp">
                  {KW_LABEL[k]}
                </span>
              ))}
            </div>
          )}
        </div>
        {size === 'hand' && <div className="card-text">{def.text}</div>}
      </div>

      {showCost && <div className="card-cost">{def.cost}</div>}

      {isCreature &&
        (showSuperposed ? (
          <>
            <div className="stat stat-attack">
              <span className="stat-range">
                {def.faces![0].attack}·{def.faces![1].attack}
              </span>
            </div>
            <div className="stat stat-health">
              <span className="stat-range">
                {def.faces![0].health}·{def.faces![1].health}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="stat stat-attack">{face!.attack}</div>
            <div className={`stat stat-health${hp !== undefined && hp < face!.health ? ' hurt' : ''}`}>
              {hp ?? face!.health}
            </div>
          </>
        ))}

      {reveal === 'burst' && <CollapseBurst face={collapsed ?? 0} />}
    </div>
  )
}

function FaceArt({ idx, label, sigil, defId }: { idx: 0 | 1; label: string; sigil: string; defId: string }) {
  return (
    <div className={`card-face-art face-${idx}`}>
      <CardArt defId={defId} />
      <span className="face-label">{label}</span>
      <span className="face-sigil">{sigil}</span>
    </div>
  )
}

function CollapseBurst({ face }: { face: 0 | 1 }) {
  const color = face === 0 ? 'var(--particle)' : 'var(--wave)'
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.5
    const dist = 46 + Math.random() * 46
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, key: i }
  })
  return (
    <>
      <motion.div
        className="collapse-flash"
        initial={{ opacity: 0.95 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      {particles.map((p) => (
        <motion.span
          key={p.key}
          className="collapse-particle"
          style={{ background: p.key % 3 === 0 ? 'var(--flash)' : color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </>
  )
}
