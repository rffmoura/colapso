import { useCallback, useMemo } from 'react'
import type { Owner } from '../engine/types'
import { HERO_POWER_COST, STARTING_QUBITS } from '../engine/types'
import { clickHero, clickHeroPower, inspectSecret, refRegistry, useStore, validTargetKeys } from '../state/store'
import { FloatFxList } from './FloatFxList'
import { SecretCard } from './SecretCard'

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
  const aiName = st.game.setup.boss ? 'Autômato Supervisor' : 'O Autômato'
  const openingQubits =
    STARTING_QUBITS +
    (!isPlayer && st.game.setup.directives.includes('nucleo-adiantado') ? 1 : 0)
  const powerReady = isPlayer && !side.heroPowerUsed && side.qubits >= HERO_POWER_COST
  const powerArmed = st.selection?.type === 'heropower'
  const lastRevealedSecret = side.revealedSecrets.at(-1)
  const coherenceTip = isPlayer
    ? 'Coerência: sua vida. Chegou a zero, acabou o plantão.'
    : 'Coerência do Autômato: zere para vencer.'
  const qubitsTip = `Qubits: energia do turno (${side.qubits}/${side.maxQubits}). Primeiro turno: ${openingQubits}; depois, o máximo cresce 1 por turno.`
  // no painel do topo (Autômato), tooltips abrem para baixo para não sair da tela
  const tipDown = isPlayer ? '' : ' tip-down'

  return (
    <div
      ref={registerRef}
      className={`hero-panel ${isPlayer ? 'mine' : 'theirs'}${isValidTarget ? ' valid-target' : ''}`}
      role={isValidTarget ? 'button' : undefined}
      aria-label={`${isPlayer ? 'Você, Observador' : aiName}, ${side.coherence} de coerência`}
      tabIndex={isValidTarget ? 0 : -1}
      onClick={(e) => {
        e.stopPropagation()
        clickHero(owner)
      }}
      onKeyDown={(e) => {
        if (!isValidTarget || (e.key !== 'Enter' && e.key !== ' ')) return
        e.preventDefault()
        e.stopPropagation()
        clickHero(owner)
      }}
    >
      <div className="hero-identity">
        <div className="hero-avatar">{isPlayer ? <ObserverFace /> : <AutomatonFace />}</div>
        <span className="hero-code">{isPlayer ? 'OBS-01' : st.game.setup.boss ? 'AUT-Ω' : 'AUT-25'}</span>
      </div>
      <div className="hero-vitals">
        <div className="hero-name">{isPlayer ? 'Você · Observador' : aiName}</div>
        <div
          className={`hero-readout${side.coherence <= 8 ? ' low' : ''}${tipDown}`}
          data-tip={coherenceTip}
          aria-label={coherenceTip}
          tabIndex={0}
        >
          <span className="hero-coherence">{side.coherence}</span>
          <span className="hero-readout-copy">
            <b>coerência</b>
            <small>{side.coherence <= 8 ? 'sinal instável' : 'sinal estável'}</small>
          </span>
        </div>
        <div
          className={`qubit-meter${tipDown}`}
          data-tip={qubitsTip}
          aria-label={qubitsTip}
          tabIndex={0}
        >
          <div className="qubit-meter-head">
            <span>qubits</span>
            <b>{side.qubits}/{side.maxQubits}</b>
          </div>
          <div className="qubit-row">
            {Array.from({ length: side.maxQubits }, (_, i) => (
              <span key={i} className={`qubit${i < side.qubits ? ' full' : ''}`} />
            ))}
          </div>
        </div>
      </div>
      <div className={`deck-count${tipDown}`} data-tip="Fichas na mão." aria-label="Fichas na mão." tabIndex={0}>
        <span>mão</span>
        <b>{side.hand.length}</b>
        <small>fichas</small>
      </div>
      {isPlayer && (
        <button
          className={`btn-heropower${powerArmed ? ' armed' : ''}`}
          disabled={!powerReady || st.busy || st.game.active !== 'player'}
          aria-label={`Observar por ${HERO_POWER_COST} qubits`}
          data-tip={`Observar (${HERO_POWER_COST} qubits, 1x por turno): escolha A ou B com 75% de influência.`}
          onClick={(e) => {
            e.stopPropagation()
            clickHeroPower()
          }}
        >
          <EyeIcon />
          <small>observar</small>
        </button>
      )}
      <div
        className={`hero-secret-slot${side.activeSecret ? ' armed' : lastRevealedSecret ? ' revealed' : ' empty'}${tipDown}`}
        data-tip={
          side.activeSecret
            ? isPlayer
              ? 'Sua contramedida está armada. Clique para consultar o efeito.'
              : `Contramedida inimiga confidencial${side.queuedSecrets.length > 0 ? '; há uma reserva para depois do disparo.' : '.'}`
            : lastRevealedSecret
              ? 'Contramedida já utilizada. Clique para reler o efeito.'
              : 'Nenhuma contramedida registrada neste duelo.'
        }
      >
        {side.activeSecret ? (
          <SecretCard
            id={isPlayer ? side.activeSecret.id : undefined}
            hidden={!isPlayer}
            compact
            reserve={isPlayer ? 0 : side.queuedSecrets.length}
            onClick={isPlayer ? () => inspectSecret(owner, side.activeSecret!.id, 'armed') : undefined}
            ariaLabel={isPlayer ? 'Consultar sua contramedida armada' : undefined}
          />
        ) : lastRevealedSecret ? (
          <SecretCard
            id={lastRevealedSecret}
            compact
            used
            onClick={() => inspectSecret(owner, lastRevealedSecret, 'used')}
            ariaLabel="Consultar contramedida utilizada"
          />
        ) : (
          <span className="secret-spent-mark">sem registro</span>
        )}
        {side.activeSecret && lastRevealedSecret && (
          <button
            className="secret-history-tab"
            onClick={(event) => {
              event.stopPropagation()
              inspectSecret(owner, lastRevealedSecret, 'used')
            }}
            aria-label="Consultar última contramedida revelada"
          >
            {side.revealedSecrets.length} revelada{side.revealedSecrets.length > 1 ? 's' : ''}
          </button>
        )}
      </div>
      <FloatFxList fxKey={key} />
    </div>
  )
}
