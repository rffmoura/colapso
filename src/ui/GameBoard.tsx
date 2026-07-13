import { AnimatePresence, LayoutGroup } from 'motion/react'
import { cancelSelection, endPlayerTurn, useStore } from '../state/store'
import { BoardCreature } from './BoardCreature'
import { AiHand, PlayerHand } from './Hand'
import { HeroPanel } from './HeroPanel'
import { EntangleLayer, TargetingArrow, TurnBanner } from './Overlays'

export function GameBoard() {
  const st = useStore()
  const canEnd = !st.busy && st.phase === 'game' && st.game.active === 'player'

  return (
    <LayoutGroup>
      <div className="game" onClick={cancelSelection}>
        <div className="row-top">
          <HeroPanel owner="ai" />
          <AiHand />
          {st.aiThinking && <div className="ai-thinking">o autômato pondera…</div>}
        </div>

        <div className="battlefield">
          <div className="field-divider" />
          <div className="field-row">
            {st.game.board.ai.length === 0 && <span className="field-empty-hint">vácuo</span>}
            <AnimatePresence mode="popLayout">
              {st.game.board.ai.map((c) => (
                <BoardCreature key={c.uid} c={c} />
              ))}
            </AnimatePresence>
          </div>
          <div className="field-row">
            {st.game.board.player.length === 0 && <span className="field-empty-hint">vácuo</span>}
            <AnimatePresence mode="popLayout">
              {st.game.board.player.map((c) => (
                <BoardCreature key={c.uid} c={c} />
              ))}
            </AnimatePresence>
          </div>
          <button className="btn-endturn" disabled={!canEnd} onClick={(e) => { e.stopPropagation(); endPlayerTurn() }}>
            {canEnd ? 'Encerrar turno' : st.game.active === 'ai' ? 'Turno inimigo' : 'Resolvendo…'}
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
