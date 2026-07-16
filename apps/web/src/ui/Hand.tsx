import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { canPlay, getDef } from '@colapso/game-core'
import { clickHandCard, refRegistry, useStore } from '../state/store'
import { CardView } from './CardView'

type PlayerHandProps = {
  hidden?: boolean
  touchControls: boolean
  previewedUid: number | null
  onPreviewChange: (uid: number | null) => void
}

export function PlayerHand({ hidden = false, touchControls, previewedUid, onPreviewChange }: PlayerHandProps) {
  const st = useStore()
  const hand = st.game.sides.player.hand
  const myTurn = st.game.active === 'player' && !st.busy && st.phase === 'game'
  const n = hand.length
  const registerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) refRegistry.set('hand-player', el)
    else refRegistry.delete('hand-player')
  }, [])

  useEffect(() => {
    if ((!touchControls || hidden) && previewedUid !== null) onPreviewChange(null)
  }, [hidden, onPreviewChange, previewedUid, touchControls])

  return (
    <div
      id="player-hand"
      className={`hand${previewedUid !== null ? ' is-previewing' : ''}`}
      ref={registerRef}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      {hand.map((h, i) => {
        const spread = (i - (n - 1) / 2) / Math.max(1, n - 1)
        // sobreposição cresce com o tamanho da mão para o leque caber na tela
        const overlap = -(1.2 + n * 0.16)
        const playable = myTurn && canPlay(st.game, 'player', h.uid)
        const def = getDef(h.defId)
        const previewed = touchControls && previewedUid === h.uid
        const unavailableReason = !myTurn
          ? 'Aguarde seu turno'
          : def.cost > st.game.sides.player.qubits
            ? `Faltam ${def.cost - st.game.sides.player.qubits} qubit${def.cost - st.game.sides.player.qubits > 1 ? 's' : ''}`
            : 'Bancada cheia'
        const style = {
          marginInline: `${overlap}rem`,
          zIndex: i,
          '--fan-y': `${Math.abs(spread) * 14}px`,
          '--fan-y-mobile': `${Math.abs(spread) * 8}px`,
          '--fan-rot': `${spread * 8}deg`,
          '--preview-x-mobile': `${spread * -72}px`,
        } as CSSProperties

        const inspectOrPlay = () => {
          if (touchControls) {
            onPreviewChange(h.uid)
            return
          }
          clickHandCard(h.uid)
        }

        return (
          <div
            key={h.uid}
            className={`hand-card ${playable ? 'playable' : 'unplayable'}${previewed ? ' previewed' : ''}`}
            style={style}
          >
            <div className="hand-card-inner">
              <button
                type="button"
                className="hand-card-inspect"
                aria-label={`${touchControls ? 'Examinar' : 'Jogar'} ficha ${def.name}`}
                aria-expanded={touchControls ? previewed : undefined}
                aria-controls={touchControls ? `hand-play-${h.uid}` : undefined}
                onClick={(event) => {
                  event.stopPropagation()
                  inspectOrPlay()
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return
                  event.preventDefault()
                  event.stopPropagation()
                  inspectOrPlay()
                }}
              >
                <CardView defId={h.defId} size="hand" showCost />
              </button>
              {previewed && (
                <button
                  type="button"
                  id={`hand-play-${h.uid}`}
                  className="hand-play-confirm"
                  disabled={!playable}
                  aria-label={playable ? `Jogar ${def.name} por ${def.cost} qubits` : unavailableReason}
                  onClick={(event) => {
                    event.stopPropagation()
                    onPreviewChange(null)
                    clickHandCard(h.uid)
                  }}
                >
                  <span>{playable ? 'Jogar ficha' : unavailableReason}</span>
                  <b>{def.cost}Q</b>
                </button>
              )}
            </div>
          </div>
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
