import { AnimatePresence } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { cancelSelection, endPlayerTurn, useStore } from '../state/store'
import { BoardCreature } from './BoardCreature'
import { AiHand, PlayerHand } from './Hand'
import { HeroPanel } from './HeroPanel'
import { EntangleLayer, TargetingArrow, TurnBanner } from './Overlays'
import { DrawFxLayer, PileGroup } from './Piles'
import { useTouchControls } from './useTouchControls'

export function GameBoard() {
  const st = useStore()
  const canEnd = !st.busy && st.phase === 'game' && st.game.active === 'player'
  const touchControls = useTouchControls()
  const [handLowered, setHandLowered] = useState(false)
  const [previewedHandUid, setPreviewedHandUid] = useState<number | null>(null)

  // sacode a bancada a cada impacto
  const [shaking, setShaking] = useState(false)
  const lastTick = useRef(st.shakeTick)
  useEffect(() => {
    if (st.shakeTick !== lastTick.current) {
      lastTick.current = st.shakeTick
      setShaking(true)
      const t = setTimeout(() => setShaking(false), 380)
      return () => clearTimeout(t)
    }
  }, [st.shakeTick])

  useEffect(() => {
    if (touchControls) return
    setHandLowered(false)
    setPreviewedHandUid(null)
  }, [touchControls])

  return (
    <>
      <div
        className={`game${touchControls ? ' touch-controls' : ''}${handLowered ? ' hand-lowered' : ''}`}
        onClick={() => {
          cancelSelection()
          setPreviewedHandUid(null)
        }}
      >
        <div className="row-top">
          <HeroPanel owner="ai" />
          <AiHand />
          <PileGroup owner="ai" />
          {st.aiThinking && <div className="ai-thinking">o autômato datilografa uma resposta…</div>}
        </div>

        <div className={`battlefield${shaking ? ' board-shake' : ''}`}>
          <div className="zone">
            <span className="zone-label">bancada do autômato</span>
            {st.game.board.ai.length === 0 && <span className="zone-empty">área desocupada</span>}
            <AnimatePresence mode="popLayout">
              {st.game.board.ai.map((c) => (
                <BoardCreature key={c.uid} c={c} />
              ))}
            </AnimatePresence>
          </div>
          <div className="zone">
            <span className="zone-label">sua bancada</span>
            {st.game.board.player.length === 0 && <span className="zone-empty">área desocupada</span>}
            <AnimatePresence mode="popLayout">
              {st.game.board.player.map((c) => (
                <BoardCreature key={c.uid} c={c} />
              ))}
            </AnimatePresence>
          </div>
          <button
            className="btn-endturn"
            disabled={!canEnd}
            onClick={(e) => {
              e.stopPropagation()
              setPreviewedHandUid(null)
              endPlayerTurn()
            }}
          >
            {canEnd ? 'Encerrar turno' : st.game.active === 'ai' ? 'Turno do Autômato' : 'Processando…'}
          </button>
        </div>

        <div className="row-bottom">
          {touchControls && (
            <button
              type="button"
              className="btn-hand-toggle"
              aria-controls="player-hand"
              aria-expanded={!handLowered}
              onClick={(event) => {
                event.stopPropagation()
                setPreviewedHandUid(null)
                setHandLowered((lowered) => !lowered)
              }}
            >
              <span className="hand-toggle-chevron" aria-hidden="true" />
              <span>{handLowered ? `Mostrar mão (${st.game.sides.player.hand.length})` : 'Abaixar mão'}</span>
            </button>
          )}
          <HeroPanel owner="player" />
          <PlayerHand
            hidden={handLowered}
            touchControls={touchControls}
            previewedUid={previewedHandUid}
            onPreviewChange={setPreviewedHandUid}
          />
          <PileGroup owner="player" />
        </div>
      </div>

      <EntangleLayer />
      <TargetingArrow />
      <TurnBanner />
      <DrawFxLayer />
    </>
  )
}
