import { useEffect } from 'react'
import { cancelSelection, toggleMute, useStore } from './state/store'
import { Background } from './ui/Background'
import { GameBoard } from './ui/GameBoard'
import { GameOverOverlay } from './ui/Overlays'
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
    <>
      <div className="bg-nebula" />
      <Background />
      <button className="btn-mute" onClick={toggleMute} title={st.muted ? 'Ativar som' : 'Silenciar'}>
        {st.muted ? '🔇' : '🔊'}
      </button>
      {st.phase === 'title' ? <TitleScreen /> : <GameBoard />}
      {st.phase === 'over' && <GameOverOverlay />}
    </>
  )
}
