import { useEffect } from 'react'
import { cancelSelection, closeSecretInspector, toggleManual, toggleMute, useStore } from './state/store'
import { GameBoard } from './ui/GameBoard'
import { ManualOverlay, MemoToast, ProtocolRevealLayer, SecretInspector, SecretRevealLayer } from './ui/Overlays'
import { BriefingScreen, RewardScreen, RunEndScreen, SecretDraftScreen } from './ui/RunScreens'
import { TitleScreen } from './ui/TitleScreen'

export default function App() {
  const st = useStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSecretInspector()
        cancelSelection()
      }
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
      {st.phase === 'title' && <TitleScreen />}
      {st.phase === 'draft' && <SecretDraftScreen />}
      {st.phase === 'briefing' && <BriefingScreen />}
      {st.phase === 'game' && <GameBoard />}
      {st.phase === 'reward' && <RewardScreen />}
      {st.phase === 'run-lost' && <RunEndScreen won={false} />}
      {st.phase === 'run-won' && <RunEndScreen won />}
      <ProtocolRevealLayer />
      <SecretRevealLayer />
      <SecretInspector />
      <MemoToast />
      <ManualOverlay />
    </div>
  )
}
