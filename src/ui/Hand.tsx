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
          const rotate = spread * 8
          const y = Math.abs(spread) * 14
          const playable = myTurn && canPlay(st.game, 'player', h.uid)
          return (
            <motion.div
              key={h.uid}
              layoutId={`unit-${h.uid}`}
              layout="position"
              className={`hand-card ${playable ? 'playable' : 'unplayable'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.22 } }}
              role="button"
              aria-label={`jogar ficha ${h.defId}`}
              onClick={(e) => {
                e.stopPropagation()
                clickHandCard(h.uid)
              }}
            >
              <motion.div
                initial={{ y: 170 }}
                animate={{ y }}
                whileHover={{ y: y - 56, scale: 1.12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                style={{ rotate, transformOrigin: 'bottom center' }}
              >
                <CardView defId={h.defId} size="hand" showCost />
              </motion.div>
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
