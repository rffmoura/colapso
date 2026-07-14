import { AnimatePresence, motion } from 'motion/react'
import { useCallback } from 'react'
import type { CSSProperties } from 'react'
import { getDef } from '../engine/cards'
import { canPlay } from '../engine/game'
import { clickHandCard, refRegistry, useStore } from '../state/store'
import { CardView } from './CardView'

export function PlayerHand() {
  const st = useStore()
  const hand = st.game.sides.player.hand
  const myTurn = st.game.active === 'player' && !st.busy && st.phase === 'game'
  const n = hand.length
  const registerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) refRegistry.set('hand-player', el)
    else refRegistry.delete('hand-player')
  }, [])

  return (
    <div className="hand" ref={registerRef}>
      {hand.map((h, i) => {
        const spread = (i - (n - 1) / 2) / Math.max(1, n - 1)
        // sobreposição cresce com o tamanho da mão para o leque caber na tela
        const overlap = -(1.2 + n * 0.16)
        const playable = myTurn && canPlay(st.game, 'player', h.uid)
        const style = {
          marginInline: `${overlap}rem`,
          zIndex: i,
          '--fan-y': `${Math.abs(spread) * 14}px`,
          '--fan-rot': `${spread * 8}deg`,
        } as CSSProperties
        return (
          <button
            type="button"
            key={h.uid}
            className={`hand-card ${playable ? 'playable' : 'unplayable'}`}
            style={style}
            aria-label={`Jogar ficha ${getDef(h.defId).name}`}
            onClick={(e) => {
              e.stopPropagation()
              clickHandCard(h.uid)
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return
              e.preventDefault()
              e.stopPropagation()
              clickHandCard(h.uid)
            }}
          >
            <div className="hand-card-inner">
              <CardView defId={h.defId} size="hand" showCost />
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function AiHand() {
  const st = useStore()
  const count = st.game.sides.ai.hand.length
  const registerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) refRegistry.set('hand-ai', el)
    else refRegistry.delete('hand-ai')
  }, [])
  return (
    <div className="ai-hand" ref={registerRef}>
      <AnimatePresence>
        {Array.from({ length: count }, (_, i) => (
          <motion.div
            key={i}
            className="card-back"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
