import { useCallback, useMemo } from 'react'
import type { Owner } from '../engine/types'
import { HERO_POWER_COST } from '../engine/types'
import { clickHero, clickHeroPower, refRegistry, useStore, validTargetKeys } from '../state/store'
import { FloatFxList } from './FloatFxList'

function ObserverFace() {
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="22" fill="var(--paper-card)" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M14 30 Q30 16 46 30 Q30 44 14 30 Z" fill="none" stroke="var(--ink)" strokeWidth="2.4" />
      <circle cx="30" cy="30" r="6" fill="var(--wave)" stroke="var(--ink)" strokeWidth="2" />
      <circle cx="30" cy="30" r="2" fill="var(--ink)" />
      <path d="M30 8 V14 M30 46 V52" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function AutomatonFace() {
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <rect x="14" y="16" width="32" height="30" rx="5" fill="var(--paper-card)" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M30 16 V8" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" />
      <circle className="antenna-blink" cx="30" cy="7" r="2.6" fill="var(--particle)" />
      <circle cx="23" cy="28" r="4" fill="var(--particle)" stroke="var(--ink)" strokeWidth="1.8" />
      <circle cx="37" cy="28" r="4" fill="var(--particle)" stroke="var(--ink)" strokeWidth="1.8" />
      <path d="M22 38 H38" stroke="var(--ink)" strokeWidth="2.2" strokeDasharray="3 2.4" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 34 22" aria-hidden="true">
      <path d="M2 11 Q17 -4 32 11 Q17 26 2 11 Z" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="17" cy="11" r="4.6" fill="currentColor" />
    </svg>
  )
}

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
  // no painel do topo (Autômato), tooltips abrem para baixo para não sair da tela
  const tipDown = isPlayer ? '' : ' tip-down'

  return (
    <div
      ref={registerRef}
      className={`hero-panel ${isPlayer ? 'mine' : 'theirs'}${isValidTarget ? ' valid-target' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        clickHero(owner)
      }}
    >
      <div className="hero-avatar">{isPlayer ? <ObserverFace /> : <AutomatonFace />}</div>
      <div>
        <div className="hero-name">{isPlayer ? 'Você · Observador' : 'O Autômato'}</div>
        <div
          className={`hero-coherence${side.coherence <= 8 ? ' low' : ''}${tipDown}`}
          data-tip={
            isPlayer
              ? 'Coerência: sua vida. Chegou a zero, acabou o plantão.'
              : 'Coerência do Autômato: zere para vencer.'
          }
        >
          {side.coherence}
          <small>coerência</small>
        </div>
        <div
          className={`qubit-row${tipDown}`}
          data-tip={`Qubits: energia do turno (${side.qubits}/${side.maxQubits}). Cresce 1 por turno.`}
        >
          {Array.from({ length: side.maxQubits }, (_, i) => (
            <span key={i} className={`qubit${i < side.qubits ? ' full' : ''}`} />
          ))}
        </div>
      </div>
      <div className={`deck-count${tipDown}`} data-tip="Fichas na mão.">
        mão
        <br />
        <b>{side.hand.length}</b>
      </div>
      {isPlayer && (
        <button
          className={`btn-heropower${powerArmed ? ' armed' : ''}`}
          disabled={!powerReady || st.busy || st.game.active !== 'player'}
          data-tip={`Observar (${HERO_POWER_COST} qubits, 1x por turno): colapsa qualquer sujeito.`}
          onClick={(e) => {
            e.stopPropagation()
            clickHeroPower()
          }}
        >
          <EyeIcon />
          <small>observar</small>
        </button>
      )}
      <FloatFxList fxKey={key} />
    </div>
  )
}
