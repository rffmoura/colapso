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
      <div className="orientation-notice" role="dialog" aria-modal="true" aria-label="Orientação da bancada">
        <div className="orientation-ticket">
          <span>orientação da bancada</span>
          <div className="orientation-device" aria-hidden="true">
            <i />
          </div>
          <strong>Gire o aparelho</strong>
          <p>O Plantão foi preparado para jogar com a tela na horizontal.</p>
        </div>
      </div>
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
