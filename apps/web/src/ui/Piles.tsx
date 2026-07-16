import { AnimatePresence, motion } from 'motion/react'
import { useCallback } from 'react'
import { getDef, type Owner } from '@colapso/game-core'
import { refRegistry, useStore } from '../state/store'
import { CharacterArt } from './characters'

/** Pilhas físicas de arquivo (deck) e descarte na bancada. */
export function PileGroup({ owner }: { owner: Owner }) {
  const st = useStore()
  const side = st.game.sides[owner]
  const tipDown = owner === 'ai' ? ' tip-down' : ''

  const registerDeck = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) refRegistry.set(`pile-deck-${owner}`, el)
      else refRegistry.delete(`pile-deck-${owner}`)
    },
    [owner],
  )

  const topDiscard = side.discard.length > 0 ? side.discard[side.discard.length - 1] : null

  return (
    <div className="pile-group">
      <div
        className={`pile${tipDown}`}
        data-tip="Arquivo: no início do turno, compra-se até ter 5 fichas. Quando esvazia, o descarte volta embaralhado."
        tabIndex={0}
        onClick={(event) => event.stopPropagation()}
      >
        <div ref={registerDeck} className={`pile-stack${side.deck.length === 0 ? ' empty' : ''}`}>
          {side.deck.length > 0 && (
            <>
              <div className="pile-back b2" />
              <div className="pile-back b1" />
              <div className="pile-back" />
            </>
          )}
          <div className="pile-count">{side.deck.length}</div>
        </div>
        <div className="pile-label">arquivo</div>
      </div>

      <div
        className={`pile${tipDown}`}
        data-tip={
          topDiscard
            ? `Descarte: protocolos usados e sujeitos arquivados. No topo: ${getDef(topDiscard).name}.`
            : 'Descarte: protocolos usados e sujeitos arquivados vêm parar aqui.'
        }
        tabIndex={0}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`pile-stack${topDiscard ? '' : ' empty'}`}>
          <AnimatePresence>
            {topDiscard && (
              <motion.div
                key={`${topDiscard}-${side.discard.length}`}
                className="pile-discard-top"
                initial={{ scale: 1.5, rotate: 14, opacity: 0 }}
                animate={{ scale: 1, rotate: -2, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              >
                <CharacterArt defId={topDiscard} />
              </motion.div>
            )}
          </AnimatePresence>
          {side.discard.length > 0 && <div className="pile-count">{side.discard.length}</div>}
        </div>
        <div className="pile-label">descarte</div>
      </div>
    </div>
  )
}

/** Cartas-fantasma voando do arquivo para a mão a cada compra. */
export function DrawFxLayer() {
  const st = useStore()
  return (
    <>
      {st.drawFx.map((d) => (
        <DrawGhosts key={d.id} owner={d.owner} count={d.count} />
      ))}
    </>
  )
}

function DrawGhosts({ owner, count }: { owner: Owner; count: number }) {
  const from = refRegistry.get(`pile-deck-${owner}`)?.getBoundingClientRect()
  const to = refRegistry.get(`hand-${owner}`)?.getBoundingClientRect()
  if (!from || !to) return null
  const tx = to.x + to.width / 2 - from.x
  const ty = to.y + to.height * 0.35 - from.y
  return (
    <>
      {Array.from({ length: Math.min(count, 5) }, (_, i) => (
        <motion.div
          key={i}
          className="draw-ghost"
          style={{ left: from.x, top: from.y }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 5, scale: 1 }}
          animate={{
            x: [0, tx * 0.55, tx],
            y: [0, ty * 0.5 - 46, ty],
            opacity: [0, 1, 0],
            rotate: -8,
            scale: 1.05,
          }}
          transition={{ duration: 0.6, delay: i * 0.11, ease: 'easeInOut' }}
        />
      ))}
    </>
  )
}
