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

  const Protocol = PROTOCOLS[defId]
  return (
    <svg
      className={`char-svg protocol-art${Protocol ? ` protocol-${defId}` : ''}`}
      viewBox="0 0 180 120"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {Protocol ? <Protocol /> : <Unknown />}
    </svg>
  )
}

/* ---------- protocolos: pranchas vetoriais do Instituto ---------- */

function ProtocolPlate({
  code,
  accent,
  children,
}: {
  code: string
  accent: string
  children: ReactNode
}) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <rect width="180" height="120" fill={PAPER} />

      <g fill="none" stroke={INK} strokeWidth="0.7" opacity="0.14">
        <path d="M18 34 H162 M18 60 H162 M18 86 H162" />
        <path d="M36 18 V102 M72 18 V102 M108 18 V102 M144 18 V102" />
        <circle cx="90" cy="60" r="42" />
        <circle cx="90" cy="60" r="25" strokeDasharray="2 5" />
      </g>

      <path
        d="M8 28 V8 H28 M152 8 H172 V28 M172 92 V112 H152 M28 112 H8 V92"
        fill="none"
        stroke={INK}
        strokeWidth="1.5"
        opacity="0.7"
      />
      <rect x="12" y="10" width="38" height="15" fill={accent} stroke={INK} strokeWidth="1.4" />
      <text
        x="31"
        y="20.8"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="8.5"
        fill={accent === GOLD ? INK : PAPER}
        letterSpacing="0.8"
      >
        {code}
      </text>

      <g transform="translate(158 18)" fill="none" stroke={accent} opacity="0.75">
        <circle r="5" strokeWidth="1.2" />
        <path d="M-8 0 H8 M0 -8 V8" strokeWidth="0.8" />
      </g>

      {children}

      <path d="M56 108 H168" stroke={INK} strokeWidth="0.8" opacity="0.42" />
      <text
        x="166"
        y="105"
        textAnchor="end"
        fontFamily="var(--font-type)"
        fontSize="5.4"
        fill={INK}
        opacity="0.62"
        letterSpacing="0.75"
      >
        IMV · DIVISÃO DE OBSERVAÇÃO
      </text>
    </g>
  )
}

function Medicao() {
  return (
    <ProtocolPlate code="M-01" accent={PURPLE}>
      <rect x="27" y="30" width="126" height="63" fill={PAPER} stroke={INK} strokeWidth="2.2" />
      <path d="M39 62 Q63 38 90 61 Q63 84 39 62 Z" fill="none" stroke={RED} strokeWidth="4.5" opacity="0.82" />
      <path d="M89 61 Q116 38 141 62 Q116 84 89 61 Z" fill="none" stroke={TEAL} strokeWidth="4.5" opacity="0.82" />
      <path d="M39 62 Q90 24 141 62 Q90 98 39 62 Z" fill={PAPER} stroke={INK} strokeWidth="2.7" />
      <circle cx="90" cy="62" r="15" fill={GOLD} stroke={INK} strokeWidth="2.5" />
      <circle cx="90" cy="62" r="7" fill={INK} />
      <circle cx="86" cy="58" r="2.2" fill={PAPER} />
      <g className="protocol-scan" fill="none" stroke={PURPLE}>
        <path d="M90 34 V90" strokeWidth="1.8" />
        <path d="M84 41 H96 M84 83 H96" strokeWidth="1.1" />
      </g>
      <path d="M31 99 H53 L59 94 L65 102 L72 97 H108 L114 94 L121 100 H149" fill="none" stroke={PURPLE} strokeWidth="1.5" />
      <text x="34" y="43" fontFamily="var(--font-display)" fontSize="8" fill={RED}>A</text>
      <text x="136" y="43" fontFamily="var(--font-display)" fontSize="8" fill={TEAL}>B</text>
    </ProtocolPlate>
  )
}

function Polarizacao() {
  return (
    <ProtocolPlate code="P-02" accent={TEAL}>
      <path d="M20 43 H74" stroke={RED} strokeWidth="7" opacity="0.84" />
      <path d="M20 77 H74" stroke={TEAL} strokeWidth="7" opacity="0.84" />
      <path d="M106 60 H160" stroke={GOLD} strokeWidth="8" />
      <path d="M146 53 L160 60 L146 67" fill={GOLD} stroke={INK} strokeWidth="1.4" />

      <rect x="75" y="26" width="30" height="68" fill={INK} stroke={INK} strokeWidth="2" />
      <rect x="84" y="32" width="12" height="56" fill={PAPER} transform="rotate(-16 90 60)" />
      <g className="protocol-selector">
        <circle cx="90" cy="60" r="17" fill={PAPER} stroke={INK} strokeWidth="2.3" />
        <path d="M90 60 L78 49" stroke={RED} strokeWidth="4" />
        <circle cx="90" cy="60" r="4.2" fill={INK} />
      </g>

      <rect x="25" y="34" width="13" height="13" fill={RED} stroke={INK} strokeWidth="1.2" />
      <text x="31.5" y="43.5" textAnchor="middle" fontFamily="var(--font-display)" fontSize="7.5" fill={PAPER}>A</text>
      <rect x="25" y="73" width="13" height="13" fill={TEAL} stroke={INK} strokeWidth="1.2" />
      <text x="31.5" y="82.5" textAnchor="middle" fontFamily="var(--font-display)" fontSize="7.5" fill={PAPER}>B</text>
      <text x="122" y="50" fontFamily="var(--font-type)" fontSize="6" fill={INK} opacity="0.7">ESTADO</text>
      <text x="122" y="76" fontFamily="var(--font-display)" fontSize="10" fill={INK}>FIXO</text>
    </ProtocolPlate>
  )
}

function Emaranhar() {
  return (
    <ProtocolPlate code="E-03" accent={PURPLE}>
      <g className="protocol-link" fill="none" stroke={PURPLE}>
        <path d="M57 70 C65 30 115 30 123 70" strokeWidth="3.2" />
        <path d="M57 61 C72 91 108 91 123 61" strokeWidth="2" strokeDasharray="5 4" />
        <path d="M65 47 C79 66 101 66 115 47" strokeWidth="1.5" opacity="0.8" />
      </g>

      <g>
        <path d="M35 85 V48 C35 36 43 29 54 29 C65 29 73 36 73 48 V85" fill={PAPER} stroke={INK} strokeWidth="2.3" />
        <path d="M31 85 H77 V95 H31 Z" fill={INK} />
        <circle cx="54" cy="58" r="12" fill={RED} stroke={INK} strokeWidth="2" />
        <path d="M48 58 Q54 48 60 58 Q54 68 48 58 Z" fill={PAPER} opacity="0.7" />
        <path d="M42 40 H66" stroke={RED} strokeWidth="2" opacity="0.7" />
      </g>

      <g>
        <path d="M107 85 V48 C107 36 115 29 126 29 C137 29 145 36 145 48 V85" fill={PAPER} stroke={INK} strokeWidth="2.3" />
        <path d="M103 85 H149 V95 H103 Z" fill={INK} />
        <circle cx="126" cy="58" r="12" fill={TEAL} stroke={INK} strokeWidth="2" />
        <path d="M120 58 Q126 48 132 58 Q126 68 120 58 Z" fill={PAPER} opacity="0.7" />
        <path d="M114 40 H138" stroke={TEAL} strokeWidth="2" opacity="0.7" />
      </g>

      <circle cx="90" cy="65" r="6" fill={PURPLE} stroke={INK} strokeWidth="1.5" />
      <path d="M84 65 H96 M90 59 V71" stroke={PAPER} strokeWidth="1.5" />
    </ProtocolPlate>
  )
}

function Tunel() {
  return (
    <ProtocolPlate code="T-04" accent={GOLD}>
      <path d="M20 67 H158" stroke={GOLD} strokeWidth="4" strokeDasharray="7 6" />
      <path d="M145 59 L159 67 L145 75" fill={GOLD} stroke={INK} strokeWidth="1.4" />

      <g>
        <rect x="74" y="25" width="34" height="73" fill={PAPER} stroke={INK} strokeWidth="2.5" />
        <path d="M74 39 H108 M74 55 H108 M74 71 H108 M74 87 H108" stroke={INK} strokeWidth="1.2" />
        <path d="M91 25 V39 M82 39 V55 M98 55 V71 M84 71 V87 M96 87 V98" stroke={INK} strokeWidth="1.1" />
        <path d="M86 48 Q91 42 96 48 V82 H86 Z" fill={INK} opacity="0.18" />
      </g>

      <Specimen x={49} y={59} color={INK} />
      <Specimen x={133} y={59} color={TEAL} outline className="protocol-ghost" />
      <path d="M60 45 C73 34 107 34 120 45" fill="none" stroke={PURPLE} strokeWidth="1.6" strokeDasharray="3 4" />
      <text x="119" y="91" fontFamily="var(--font-type)" fontSize="6" fill={INK} opacity="0.72">OUTRO LADO</text>
    </ProtocolPlate>
  )
}

function Pulso() {
  return (
    <ProtocolPlate code="D-05" accent={RED}>
      <g>
        <circle cx="55" cy="62" r="26" fill={PAPER} stroke={INK} strokeWidth="2.3" />
        <ellipse cx="55" cy="62" rx="25" ry="10" fill="none" stroke={TEAL} strokeWidth="2" transform="rotate(-24 55 62)" />
        <ellipse cx="55" cy="62" rx="25" ry="10" fill="none" stroke={GOLD} strokeWidth="2" transform="rotate(58 55 62)" />
        <circle cx="55" cy="62" r="10" fill={RED} stroke={INK} strokeWidth="2" />
        <circle cx="51" cy="59" r="2.2" fill={PAPER} />
      </g>

      <g className="protocol-pulse" fill="none" stroke={RED}>
        <path d="M81 62 H94 L101 44 L110 81 L119 53 L126 68 H154" strokeWidth="4.2" />
        <path d="M84 52 Q91 62 84 72 M91 45 Q104 62 91 79" strokeWidth="1.4" opacity="0.65" />
      </g>
      <circle cx="148" cy="62" r="13" fill="none" stroke={INK} strokeWidth="2" />
      <path d="M139 53 L157 71 M157 53 L139 71" stroke={INK} strokeWidth="2.6" />
      <text x="31" y="98" fontFamily="var(--font-display)" fontSize="8" fill={RED}>½ VIDA</text>
    </ProtocolPlate>
  )
}

function Decoerencia() {
  return (
    <ProtocolPlate code="Ω-06" accent={RED}>
      <path d="M20 39 C31 21 42 57 53 39 C64 21 75 57 86 39" fill="none" stroke={TEAL} strokeWidth="3" />
      <path d="M20 47 C31 65 42 29 53 47 C64 65 75 29 86 47" fill="none" stroke={RED} strokeWidth="3" />

      <g className="protocol-noise" fill={RED} stroke={INK} strokeWidth="0.7">
        <circle cx="95" cy="34" r="2.2" />
        <circle cx="105" cy="47" r="3" />
        <circle cx="115" cy="30" r="1.8" />
        <circle cx="124" cy="52" r="2.5" />
        <circle cx="135" cy="38" r="3.4" />
        <circle cx="146" cy="48" r="1.8" />
        <path d="M94 52 l7 7 M101 52 l-7 7 M118 40 l8 8 M126 40 l-8 8 M145 28 l7 7 M152 28 l-7 7" />
      </g>

      <path d="M89 22 L159 86 L145 96 L79 34 Z" fill={RED} opacity="0.18" />
      <path d="M86 27 L153 91" stroke={RED} strokeWidth="4" strokeDasharray="10 5" />

      <Specimen x={47} y={79} color={INK} outline />
      <Specimen x={90} y={79} color={INK} outline />
      <Specimen x={133} y={79} color={INK} outline />
      <path d="M37 94 H143" stroke={INK} strokeWidth="2.2" />
      <text x="23" y="101" fontFamily="var(--font-type)" fontSize="6" fill={INK} opacity="0.72">AMBIENTE CLÁSSICO</text>
    </ProtocolPlate>
  )
}

function Requisicao() {
  return (
    <ProtocolPlate code="R-07" accent={GOLD}>
      <g>
        <rect x="24" y="30" width="67" height="66" fill={PAPER} stroke={INK} strokeWidth="2.5" />
        <path d="M24 48 H91 M24 72 H91" stroke={INK} strokeWidth="1.6" />
        <rect x="32" y="36" width="51" height="7" fill={INK} opacity="0.72" />
        <rect x="32" y="54" width="51" height="12" fill={PAPER} stroke={INK} strokeWidth="1.5" />
        <circle cx="75" cy="60" r="2.3" fill={INK} />
        <rect x="32" y="78" width="51" height="12" fill={PAPER} stroke={INK} strokeWidth="1.5" />
        <circle cx="75" cy="84" r="2.3" fill={INK} />
      </g>

      <path d="M85 62 C101 52 117 52 139 57" fill="none" stroke={GOLD} strokeWidth="5" strokeDasharray="7 5" />
      <path d="M130 49 L143 57 L129 64" fill={GOLD} stroke={INK} strokeWidth="1.3" />

      <g className="protocol-sheet protocol-sheet-back" transform="rotate(7 125 56)">
        <rect x="105" y="31" width="44" height="56" fill={TEAL} stroke={INK} strokeWidth="2" />
        <rect x="109" y="35" width="36" height="48" fill={PAPER} />
        <path d="M114 44 H139 M114 52 H139 M114 60 H134" stroke={INK} strokeWidth="1.4" />
        <rect x="132" y="70" width="9" height="7" fill={TEAL} />
      </g>
      <g className="protocol-sheet protocol-sheet-front" transform="rotate(-8 119 67)">
        <rect x="96" y="42" width="44" height="56" fill={RED} stroke={INK} strokeWidth="2" />
        <rect x="100" y="46" width="36" height="48" fill={PAPER} />
        <path d="M105 55 H130 M105 63 H130 M105 71 H125" stroke={INK} strokeWidth="1.4" />
        <circle cx="124" cy="83" r="5" fill={GOLD} stroke={INK} strokeWidth="1" />
      </g>

      <rect x="145" y="81" width="21" height="16" fill={GOLD} stroke={INK} strokeWidth="1.5" transform="rotate(-5 155 89)" />
      <text x="155.5" y="92" textAnchor="middle" fontFamily="var(--font-display)" fontSize="8" fill={INK}>2×</text>
    </ProtocolPlate>
  )
}

function Specimen({
  x,
  y,
  color,
  outline = false,
  className,
}: {
  x: number
  y: number
  color: string
  outline?: boolean
  className?: string
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className} fill={outline ? PAPER : color} stroke={color} strokeWidth="2">
        <circle cy="-13" r="7" />
        <path d="M-11 12 V2 C-11 -5 -6 -9 0 -9 C6 -9 11 -5 11 2 V12 Z" />
      </g>
    </g>
  )
}

function Unknown() {
  return (
    <ProtocolPlate code="?" accent={INK}>
      <circle cx="90" cy="62" r="28" fill="none" stroke={INK} strokeWidth="3" strokeDasharray="6 5" />
      <text x="90" y="73" textAnchor="middle" fontSize="34" fill={INK} fontFamily="var(--font-display)">?</text>
    </ProtocolPlate>
  )
}

const PROTOCOLS: Partial<Record<string, () => React.JSX.Element>> = {
  medicao: Medicao,
  polarizacao: Polarizacao,
  emaranhar: Emaranhar,
  tunel: Tunel,
  pulso: Pulso,
  decoerencia: Decoerencia,
  flutuacao: Requisicao,
}
