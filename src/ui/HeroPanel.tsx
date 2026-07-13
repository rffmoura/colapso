import { useCallback, useMemo } from 'react'
import type { Owner } from '../engine/types'
import { HERO_POWER_COST } from '../engine/types'
import { clickHero, clickHeroPower, refRegistry, useStore, validTargetKeys } from '../state/store'
import { FloatFxList } from './FloatFxList'

export function HeroPanel({ owner }: { owner: Owner }) {
  const st = useStore()
  const side = st.game.sides[owner]
  const key = `hero-${owner}`

  const registerRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) refRegistry.set(key, el)
      else refRegistry.delete(key)
    },
    [key],
  )

  const validKeys = useMemo(() => validTargetKeys(st), [st.selection, st.game])
  const isValidTarget = validKeys.has(key)

  const isPlayer = owner === 'player'
  const powerReady = isPlayer && !side.heroPowerUsed && side.qubits >= HERO_POWER_COST
  const powerArmed = st.selection?.type === 'heropower'

  return (
    <div
      ref={registerRef}
      className={`hero-panel${isValidTarget ? ' valid-target' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        clickHero(owner)
      }}
    >
      <div className="hero-avatar">{isPlayer ? '◉' : '⌬'}</div>
      <div>
        <div className="hero-name">{isPlayer ? 'Você · Observador' : 'Autômato · IA'}</div>
        <div className={`hero-coherence${side.coherence <= 8 ? ' low' : ''}`}>
          {side.coherence}
          <small>coerência</small>
        </div>
        <div className="qubit-row" title={`${side.qubits}/${side.maxQubits} qubits`}>
          {Array.from({ length: side.maxQubits }, (_, i) => (
            <span key={i} className={`qubit${i < side.qubits ? ' full' : ''}`} />
          ))}
        </div>
      </div>
      <div className="deck-count">
        deck <b>{side.deck.length}</b>
        <br />
        mão <b>{side.hand.length}</b>
      </div>
      {isPlayer && (
        <button
          className={`btn-heropower${powerArmed ? ' armed' : ''}`}
          disabled={!powerReady || st.busy || st.game.active !== 'player'}
          title={`Observar (${HERO_POWER_COST}): colapsa qualquer criatura`}
          onClick={(e) => {
            e.stopPropagation()
            clickHeroPower()
          }}
        >
          👁
          <small>observar</small>
        </button>
      )}
      <FloatFxList fxKey={key} />
    </div>
  )
}
