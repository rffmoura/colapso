import type { ReactNode } from 'react'
import colapsadorArt from '../assets/characters/colapsador.webp'
import eletronArt from '../assets/characters/eletron.webp'
import fotonArt from '../assets/characters/foton.webp'
import gatoArt from '../assets/characters/gato.webp'
import neutrinoArt from '../assets/characters/neutrino.webp'
import ondapilotoArt from '../assets/characters/ondapiloto.webp'
import quasarArt from '../assets/characters/quasar.webp'
import sentinelaArt from '../assets/characters/sentinela.webp'
import singularidadeArt from '../assets/characters/singularidade.webp'

const INK = 'var(--ink)'
const PAPER = 'var(--paper-card)'
const RED = 'var(--particle)'
const TEAL = 'var(--wave)'
const GOLD = 'var(--energy)'
const PURPLE = 'var(--entangle)'

const CHARACTER_ART: Record<string, string> = {
  foton: fotonArt,
  neutrino: neutrinoArt,
  sentinela: sentinelaArt,
  eletron: eletronArt,
  gato: gatoArt,
  colapsador: colapsadorArt,
  ondapiloto: ondapilotoArt,
  quasar: quasarArt,
  singularidade: singularidadeArt,
}

/**
 * Retratos dos sujeitos e selos dos protocolos.
 * A assinatura permanece estável para cartas, título e pilhas de descarte.
 */
export function CharacterArt({ defId }: { defId: string }) {
  const portrait = CHARACTER_ART[defId]
  if (portrait) {
    return (
      <span className={`character-portrait art-${defId}`} aria-hidden="true">
        <img src={portrait} alt="" draggable={false} decoding="async" />
      </span>
    )
  }

  const Protocol = PROTOCOLS[defId] ?? Unknown
  return (
    <svg className="char-svg" viewBox="0 0 120 120" aria-hidden="true">
      <Protocol />
    </svg>
  )
}

/* ---------- protocolos: selos vetoriais do Instituto ---------- */

function Seal({ children, color = PURPLE }: { children: ReactNode; color?: string }) {
  return (
    <g>
      <circle cx="60" cy="60" r="42" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="60" cy="60" r="35" fill="none" stroke={color} strokeWidth="1.4" strokeDasharray="3 4" />
      {children}
    </g>
  )
}

function Medicao() {
  return (
    <Seal>
      <path d="M34 60 Q60 38 86 60 Q60 82 34 60 Z" fill="none" stroke={PURPLE} strokeWidth="3" />
      <circle cx="60" cy="60" r="9" fill={PURPLE} />
      <circle cx="60" cy="60" r="3.4" fill={PAPER} />
      <path d="M60 30 L60 22 M60 90 L60 98" stroke={PURPLE} strokeWidth="2.6" />
    </Seal>
  )
}

function Polarizacao() {
  return (
    <Seal>
      <path d="M46 78 L46 44 M46 44 l-8 10 M46 44 l8 10" fill="none" stroke={RED} strokeWidth="3.6" />
      <path d="M74 42 L74 76 M74 76 l-8 -10 M74 76 l8 -10" fill="none" stroke={TEAL} strokeWidth="3.6" />
    </Seal>
  )
}

function Emaranhar() {
  return (
    <Seal>
      <circle cx="47" cy="60" r="15" fill="none" stroke={RED} strokeWidth="3.4" />
      <circle cx="73" cy="60" r="15" fill="none" stroke={TEAL} strokeWidth="3.4" />
      <path d="M47 45 Q60 38 73 45" fill="none" stroke={PURPLE} strokeWidth="2" strokeDasharray="4 3" />
      <path d="M47 75 Q60 82 73 75" fill="none" stroke={PURPLE} strokeWidth="2" strokeDasharray="4 3" />
    </Seal>
  )
}

function Tunel() {
  return (
    <Seal>
      <path d="M52 36 V84 M60 36 V84" stroke={PURPLE} strokeWidth="3" />
      <path d="M30 60 H82 M82 60 l-9 -8 M82 60 l-9 8" fill="none" stroke={GOLD} strokeWidth="3.6" strokeDasharray="6 4" />
    </Seal>
  )
}

function Pulso() {
  return (
    <Seal>
      <path d="M50 30 L68 52 L56 58 L74 88" fill="none" stroke={RED} strokeWidth="4" />
      <path d="M40 70 Q36 62 40 54 M32 76 Q26 62 32 48" fill="none" stroke={PURPLE} strokeWidth="2" />
    </Seal>
  )
}

function Decoerencia() {
  return (
    <Seal color={RED}>
      <path d="M60 32 A28 28 0 1 1 34 74" fill="none" stroke={RED} strokeWidth="3.4" />
      <circle cx="42" cy="84" r="2.6" fill={RED} />
      <circle cx="32" cy="90" r="2" fill={RED} />
      <circle cx="46" cy="94" r="1.6" fill={RED} />
      <path d="M52 52 L68 68 M68 52 L52 68" stroke={INK} strokeWidth="3" />
    </Seal>
  )
}

function Requisicao() {
  return (
    <Seal color={GOLD}>
      <rect x="42" y="34" width="36" height="48" rx="3" fill={PAPER} stroke={INK} strokeWidth="2.4" />
      <path d="M48 44 H72 M48 52 H72 M48 60 H66" stroke={INK} strokeWidth="1.8" />
      <rect x="36" y="42" width="36" height="48" rx="3" fill={PAPER} stroke={INK} strokeWidth="2.4" transform="rotate(-6 54 66)" />
      <path d="M43 53 H66 M43.5 61 H66.5 M44 69 H60" stroke={INK} strokeWidth="1.8" transform="rotate(-6 54 66)" />
      <path d="M76 80 h12 M82 74 v12" stroke={GOLD} strokeWidth="3.4" />
    </Seal>
  )
}

function Unknown() {
  return (
    <g>
      <circle cx="60" cy="60" r="30" fill="none" stroke={INK} strokeWidth="3" strokeDasharray="6 5" />
      <text x="60" y="70" textAnchor="middle" fontSize="30" fill={INK} fontFamily="var(--font-display)">?</text>
    </g>
  )
}

const PROTOCOLS: Record<string, () => React.JSX.Element> = {
  medicao: Medicao,
  polarizacao: Polarizacao,
  emaranhar: Emaranhar,
  tunel: Tunel,
  pulso: Pulso,
  decoerencia: Decoerencia,
  flutuacao: Requisicao,
}
