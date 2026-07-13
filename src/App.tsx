import { useEffect } from 'react'
import { cancelSelection, toggleManual, toggleMute, useStore } from './state/store'
import { GameBoard } from './ui/GameBoard'
import { GameOverOverlay, ManualOverlay, MemoToast } from './ui/Overlays'
import { TitleScreen } from './ui/TitleScreen'

export default function App() {
  const st = useStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelSelection()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="paper-grain paper-vignette">
      <div className="top-controls">
        <button className="btn-icon" onClick={toggleManual} data-tip="Manual do Observador" aria-label="Manual">
          ?
        </button>
        <button
          className={`btn-icon${st.muted ? ' off' : ''}`}
          onClick={toggleMute}
          data-tip={st.muted ? 'Reativar som' : 'Silenciar'}
          aria-label="Som"
        >
          S
        </button>
      </div>
      {st.phase === 'title' ? <TitleScreen /> : <GameBoard />}
      {st.phase === 'over' && <GameOverOverlay />}
      <MemoToast />
      <ManualOverlay />
    </div>
  )
}
