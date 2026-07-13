import { AnimatePresence, motion } from 'motion/react'
import { canPlay } from '../engine/game'
import { clickHandCard, useStore } from '../state/store'
import { CardView } from './CardView'

export function PlayerHand() {
  const st = useStore()
  const hand = st.game.sides.player.hand
  const myTurn = st.game.active === 'player' && !st.busy && st.phase === 'game'
  const n = hand.length

  return (
    <div className="hand">
      <AnimatePresence>
        {hand.map((h, i) => {
          const spread = (i - (n - 1) / 2) / Math.max(1, n - 1)
          const rotate = spread * 12
          const y = Math.abs(spread) * 16
          const playable = myTurn && canPlay(st.game, 'player', h.uid)
          return (
            <motion.div
              key={h.uid}
              layout
              layoutId={`unit-${h.uid}`}
              className={`hand-card ${playable ? 'playable' : 'unplayable'}`}
              initial={{ y: 160, opacity: 0, rotate: 0 }}
              animate={{ y, opacity: 1, rotate }}
              exit={{ y: -40, opacity: 0, scale: 0.8, transition: { duration: 0.25 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              whileHover={{ y: y - 46, rotate: 0, scale: 1.14, zIndex: 20, transition: { duration: 0.18 } }}
              style={{ transformOrigin: 'bottom center' }}
              role="button"
              aria-label={`jogar carta ${h.defId}`}
              onClick={(e) => {
                e.stopPropagation()
                clickHandCard(h.uid)
              }}
            >
              <CardView defId={h.defId} size="hand" showCost />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export function AiHand() {
  const st = useStore()
  const count = st.game.sides.ai.hand.length
  return (
    <div className="ai-hand">
      <AnimatePresence>
        {Array.from({ length: count }, (_, i) => (
          <motion.div
            key={i}
            className="card-back"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
