import { AnimatePresence, LayoutGroup } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { cancelSelection, endPlayerTurn, useStore } from '../state/store'
import { BoardCreature } from './BoardCreature'
import { AiHand, PlayerHand } from './Hand'
import { HeroPanel } from './HeroPanel'
import { EntangleLayer, TargetingArrow, TurnBanner } from './Overlays'

export function GameBoard() {
  const st = useStore()
  const canEnd = !st.busy && st.phase === 'game' && st.game.active === 'player'

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

  return (
    <LayoutGroup>
      <div className="game" onClick={cancelSelection}>
        <div className="row-top">
          <HeroPanel owner="ai" />
          <AiHand />
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
              endPlayerTurn()
            }}
          >
            {canEnd ? 'Encerrar turno' : st.game.active === 'ai' ? 'Turno do Autômato' : 'Processando…'}
          </button>
        </div>

        <div className="row-bottom">
          <HeroPanel owner="player" />
          <PlayerHand />
        </div>
      </div>

      <EntangleLayer />
      <TargetingArrow />
      <TurnBanner />
    </LayoutGroup>
  )
}
