/**
 * Personagens do Instituto Meia-Vida — ilustração vetorial flat, estilo serigrafia
 * anos 50: contorno de tinta, cores chapadas, olhos expressivos.
 * Classes de animação idle (definidas em styles.css): blink, tail-sway, antenna-blink,
 * stamp-tap, orbit-spin, wave-drift, beam-sweep, maw-pulse, run-bob.
 */

const INK = 'var(--ink)'
const PAPER = 'var(--paper-card)'
const RED = 'var(--particle)'
const TEAL = 'var(--wave)'
const GOLD = 'var(--energy)'
const PURPLE = 'var(--entangle)'

export function CharacterArt({ defId }: { defId: string }) {
  const C = REGISTRY[defId] ?? Unknown
  return (
    <svg className="char-svg" viewBox="0 0 120 120" aria-hidden="true">
      <C />
    </svg>
  )
}

/* ---------- sujeitos ---------- */

function Gato() {
  return (
    <g strokeLinecap="round">
      {/* metade espectro (teal tracejado) */}
      <path
        d="M60 98 L60 44 L52 30 L58 38 L68 38 L74 30 L60 44"
        fill="none"
        stroke={TEAL}
        strokeWidth="2.4"
        strokeDasharray="4 4"
        transform="translate(9 0)"
        opacity="0.8"
      />
      <path
        d="M69 98 Q92 98 90 74 Q89 58 76 50"
        fill="none"
        stroke={TEAL}
        strokeWidth="2.4"
        strokeDasharray="4 4"
        opacity="0.8"
      />
      {/* corpo vivo (tinta sólida) */}
      <path d="M60 98 Q30 98 32 72 Q33 54 46 46 L42 28 L52 38 Q56 36 60 36 L60 98 Z" fill={INK} />
      {/* orelha frontal */}
      <path d="M46 46 L42 28 L52 38 Z" fill={INK} />
      {/* cauda */}
      <g className="tail-sway" style={{ transformOrigin: '38px 92px' }}>
        <path d="M38 92 Q18 88 22 70 Q24 60 32 60" fill="none" stroke={INK} strokeWidth="6" />
      </g>
      {/* olho vivo */}
      <g className="blink" style={{ transformOrigin: '50px 58px' }}>
        <ellipse cx="50" cy="58" rx="6" ry="8" fill={GOLD} />
        <ellipse cx="50" cy="58" rx="2.2" ry="6" fill={INK} />
      </g>
      {/* olho espectro */}
      <ellipse cx="72" cy="58" rx="5" ry="7" fill="none" stroke={TEAL} strokeWidth="2" strokeDasharray="3 3" />
      {/* bigodes */}
      <path d="M40 68 L28 66 M40 72 L29 73" stroke={INK} strokeWidth="1.6" />
      <path d="M78 68 L92 66 M78 72 L91 73" stroke={TEAL} strokeWidth="1.6" strokeDasharray="3 3" />
      {/* plaquinha nº 13 */}
      <circle cx="60" cy="86" r="7" fill={RED} />
      <text x="60" y="89.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill={PAPER} fontFamily="var(--font-display)">13</text>
    </g>
  )
}

function Foton() {
  return (
    <g strokeLinecap="round" className="run-bob">
      {/* raios */}
      <g stroke={GOLD} strokeWidth="3.4">
        <path d="M60 18 L60 6 M88 30 L97 21 M96 58 L109 58 M88 84 L97 93" />
      </g>
      <g stroke={RED} strokeWidth="2.4">
        <path d="M32 30 L23 21 M24 58 L11 58" />
      </g>
      {/* linhas de velocidade */}
      <path d="M8 76 L34 76 M4 86 L28 86 M12 96 L36 96" stroke={TEAL} strokeWidth="2.6" strokeDasharray="8 5" />
      {/* cabeça-sol */}
      <circle cx="60" cy="58" r="26" fill={GOLD} stroke={INK} strokeWidth="3" />
      {/* quepe de estafeta */}
      <path d="M38 48 Q60 34 82 48 L82 42 Q60 26 38 42 Z" fill={RED} stroke={INK} strokeWidth="2.4" />
      <rect x="52" y="30" width="16" height="6" rx="3" fill={RED} stroke={INK} strokeWidth="2" />
      {/* rosto decidido */}
      <g className="blink" style={{ transformOrigin: '60px 58px' }}>
        <circle cx="52" cy="57" r="3" fill={INK} />
        <circle cx="70" cy="57" r="3" fill={INK} />
      </g>
      <path d="M52 68 Q60 73 68 68" fill="none" stroke={INK} strokeWidth="2.6" />
      {/* perninhas correndo */}
      <path d="M50 84 L42 98 M70 84 L80 94" stroke={INK} strokeWidth="4" />
      <path d="M40 100 L46 98 M78 96 L84 92" stroke={INK} strokeWidth="4" />
      {/* bolsa de correio */}
      <path d="M76 62 L92 66 L90 80 L76 76 Z" fill={TEAL} stroke={INK} strokeWidth="2.4" />
      <path d="M78 68 L88 71" stroke={PAPER} strokeWidth="2" />
    </g>
  )
}

function Neutrina() {
  return (
    <g strokeLinecap="round">
      {/* parede de tijolos */}
      <g stroke={INK} strokeWidth="2" fill="var(--paper-dim)">
        <rect x="64" y="14" width="44" height="92" />
        <path d="M64 30 H108 M64 46 H108 M64 62 H108 M64 78 H108 M64 94 H108 M86 14 V30 M76 30 V46 M92 46 V62 M78 62 V78 M94 78 V94 M80 94 V106" fill="none" />
      </g>
      {/* silhueta que atravessa */}
      <g className="wave-drift">
        <path
          d="M46 22 Q56 30 52 44 Q50 52 56 58 L84 58 Q70 64 68 76 Q66 92 54 102 Q44 92 46 78 Q47 68 40 62 Q28 54 32 40 Q35 27 46 22 Z"
          fill={TEAL}
          opacity="0.85"
        />
        <path
          d="M46 22 Q56 30 52 44 Q50 52 56 58 L84 58 Q70 64 68 76"
          fill="none"
          stroke={INK}
          strokeWidth="2.2"
          strokeDasharray="5 4"
        />
        {/* rosto sereno */}
        <g className="blink" style={{ transformOrigin: '46px 38px' }}>
          <path d="M40 38 Q43 41 46 38 M50 38 Q53 41 56 38" fill="none" stroke={INK} strokeWidth="2" />
        </g>
        <circle cx="43" cy="46" r="2" fill={RED} opacity="0.6" />
        <circle cx="53" cy="46" r="2" fill={RED} opacity="0.6" />
      </g>
    </g>
  )
}

function Sentinela() {
  return (
    <g strokeLinecap="round">
      {/* antena */}
      <path d="M60 22 L60 10" stroke={INK} strokeWidth="3" />
      <circle className="antenna-blink" cx="60" cy="8" r="4" fill={RED} />
      {/* cabeça-domo */}
      <path d="M42 40 Q42 22 60 22 Q78 22 78 40 Z" fill={TEAL} stroke={INK} strokeWidth="3" />
      {/* olho único */}
      <g className="blink" style={{ transformOrigin: '60px 33px' }}>
        <circle cx="60" cy="33" r="6.5" fill={PAPER} stroke={INK} strokeWidth="2.4" />
        <circle cx="60" cy="33" r="2.6" fill={INK} />
      </g>
      {/* corpo */}
      <rect x="40" y="42" width="40" height="38" rx="4" fill="var(--paper-dim)" stroke={INK} strokeWidth="3" />
      {/* grade do peito */}
      <path d="M48 50 H72 M48 57 H72 M48 64 H72" stroke={INK} strokeWidth="2" />
      {/* rebites */}
      <circle cx="45" cy="47" r="1.6" fill={INK} />
      <circle cx="75" cy="47" r="1.6" fill={INK} />
      <circle cx="45" cy="75" r="1.6" fill={INK} />
      <circle cx="75" cy="75" r="1.6" fill={INK} />
      {/* braço com escudo */}
      <path d="M40 52 L28 60" stroke={INK} strokeWidth="4" />
      <path d="M30 48 Q16 60 30 78 Q40 66 30 48 Z" fill={RED} stroke={INK} strokeWidth="2.6" />
      {/* braço-lança */}
      <path d="M80 52 L94 46" stroke={INK} strokeWidth="4" />
      <path d="M92 30 L98 48 L88 44 Z" fill={GOLD} stroke={INK} strokeWidth="2.2" />
      {/* esteiras */}
      <rect x="36" y="82" width="48" height="14" rx="7" fill={INK} />
      <circle cx="46" cy="89" r="3" fill={PAPER} />
      <circle cx="60" cy="89" r="3" fill={PAPER} />
      <circle cx="74" cy="89" r="3" fill={PAPER} />
    </g>
  )
}

function Eletron() {
  return (
    <g strokeLinecap="round">
      {/* órbita */}
      <g className="orbit-spin" style={{ transformOrigin: '60px 62px' }}>
        <ellipse cx="60" cy="62" rx="44" ry="16" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeDasharray="6 5" transform="rotate(-18 60 62)" />
        <circle cx="100" cy="49" r="4.5" fill={GOLD} stroke={INK} strokeWidth="1.6" />
      </g>
      {/* corpo bolinha */}
      <circle cx="60" cy="62" r="22" fill={RED} stroke={INK} strokeWidth="3" />
      {/* cabelo em pé */}
      <path d="M48 44 L44 32 M56 41 L55 28 M66 41 L69 29 M73 46 L80 35" stroke={INK} strokeWidth="2.6" />
      {/* olhos arregalados */}
      <g className="blink" style={{ transformOrigin: '60px 58px' }}>
        <circle cx="52" cy="58" r="5.4" fill={PAPER} stroke={INK} strokeWidth="2" />
        <circle cx="69" cy="58" r="5.4" fill={PAPER} stroke={INK} strokeWidth="2" />
        <circle cx="53.5" cy="59" r="2" fill={INK} />
        <circle cx="70.5" cy="59" r="2" fill={INK} />
      </g>
      {/* boca trêmula */}
      <path d="M52 72 Q56 69 60 72 Q64 75 68 72" fill="none" stroke={INK} strokeWidth="2.2" />
      {/* xícara de café */}
      <path d="M84 78 L96 78 L94 90 L86 90 Z" fill={PAPER} stroke={INK} strokeWidth="2.2" />
      <path d="M96 80 Q102 82 96 86" fill="none" stroke={INK} strokeWidth="2" />
      <path d="M88 74 Q89 71 88 68 M92 74 Q93 71 92 68" fill="none" stroke={INK} strokeWidth="1.6" />
      {/* tremidinha */}
      <path d="M26 76 Q30 74 28 70 M22 62 Q26 60 24 56" stroke={INK} strokeWidth="1.8" fill="none" />
    </g>
  )
}

function Auditor() {
  return (
    <g strokeLinecap="round">
      {/* chapéu */}
      <path d="M40 30 H80 L76 18 H44 Z" fill={INK} />
      <rect x="34" y="28" width="52" height="5" rx="2.5" fill={INK} />
      {/* cabeça */}
      <rect x="46" y="33" width="28" height="20" rx="4" fill="var(--paper-dim)" stroke={INK} strokeWidth="2.6" />
      {/* óculos redondos */}
      <circle cx="54" cy="42" r="5" fill={PAPER} stroke={INK} strokeWidth="2.2" />
      <circle cx="67" cy="42" r="5" fill={PAPER} stroke={INK} strokeWidth="2.2" />
      <path d="M59 42 H62" stroke={INK} strokeWidth="2.2" />
      <circle cx="54" cy="42" r="1.6" fill={INK} />
      <circle cx="67" cy="42" r="1.6" fill={INK} />
      {/* boca reta de desaprovação */}
      <path d="M55 49.5 H66" stroke={INK} strokeWidth="2.2" />
      {/* sobretudo */}
      <path d="M40 96 L44 56 Q60 50 76 56 L80 96 Z" fill={TEAL} stroke={INK} strokeWidth="2.8" />
      <path d="M60 56 L60 96 M52 60 L54 68 M68 60 L66 68" stroke={INK} strokeWidth="2" />
      {/* gravata */}
      <path d="M60 56 L56 62 L60 78 L64 62 Z" fill={GOLD} stroke={INK} strokeWidth="1.8" />
      {/* braço do carimbo */}
      <g className="stamp-tap" style={{ transformOrigin: '78px 66px' }}>
        <path d="M76 62 L94 70" stroke={INK} strokeWidth="4" />
        <rect x="90" y="68" width="14" height="8" rx="2" fill={RED} stroke={INK} strokeWidth="2" transform="rotate(14 97 72)" />
        <path d="M95 64 L97 68" stroke={INK} strokeWidth="3" transform="rotate(14 97 72)" />
      </g>
      {/* prancheta */}
      <rect x="30" y="62" width="16" height="22" rx="2" fill={PAPER} stroke={INK} strokeWidth="2.2" transform="rotate(-8 38 73)" />
      <path d="M33 68 L42 67 M33.5 73 L42.5 72 M34 78 L40 77.5" stroke={INK} strokeWidth="1.4" transform="rotate(-8 38 73)" />
    </g>
  )
}

function MadameOnda() {
  return (
    <g strokeLinecap="round" className="wave-drift">
      {/* cabelo-onda */}
      <path
        d="M18 46 Q34 22 56 34 Q50 38 50 44 Q76 30 96 44 Q84 48 82 56 Q100 56 106 70 Q88 66 80 72"
        fill={TEAL}
        stroke={INK}
        strokeWidth="2.6"
      />
      {/* rosto de perfil */}
      <path d="M50 44 Q64 40 66 52 Q67 60 60 64 Q54 67 52 74" fill="var(--paper-dim)" stroke={INK} strokeWidth="2.6" />
      {/* olho fechado sereno */}
      <path d="M56 52 Q59 55 62 52" fill="none" stroke={INK} strokeWidth="2" />
      {/* brinco */}
      <circle cx="53" cy="62" r="2.4" fill={GOLD} stroke={INK} strokeWidth="1.4" />
      {/* vestido que vira mar */}
      <path
        d="M52 74 Q40 84 22 84 Q34 92 50 90 Q42 100 28 102 Q52 106 68 96 Q60 104 66 108 Q84 100 84 84 Q84 74 68 70 Q58 68 52 74 Z"
        fill={TEAL}
        stroke={INK}
        strokeWidth="2.6"
      />
      <path d="M34 86 Q44 88 50 84 M40 96 Q50 96 56 92" stroke={PAPER} strokeWidth="1.8" fill="none" />
      {/* braço e batuta */}
      <path d="M64 68 L84 52" stroke={INK} strokeWidth="3.4" />
      <path d="M84 52 L98 38" stroke={GOLD} strokeWidth="2.6" />
      <circle cx="99" cy="37" r="2.2" fill={GOLD} />
      {/* notas de probabilidade */}
      <text x="98" y="26" fontSize="10" fill={PURPLE} fontFamily="var(--font-type)">ψ</text>
      <text x="106" y="52" fontSize="8" fill={PURPLE} fontFamily="var(--font-type)">ψ</text>
    </g>
  )
}

function Quasar() {
  return (
    <g strokeLinecap="round">
      {/* facho de luz */}
      <g className="beam-sweep" style={{ transformOrigin: '60px 34px' }}>
        <path d="M60 34 L10 10 L10 38 Z" fill={GOLD} opacity="0.55" />
        <path d="M60 34 L110 12 L110 40 Z" fill={GOLD} opacity="0.35" />
      </g>
      {/* lanterna */}
      <rect x="48" y="24" width="24" height="18" rx="3" fill={PAPER} stroke={INK} strokeWidth="2.8" />
      <circle cx="60" cy="33" r="5.5" fill={RED} stroke={INK} strokeWidth="2" />
      {/* teto */}
      <path d="M44 24 L60 12 L76 24 Z" fill={RED} stroke={INK} strokeWidth="2.6" />
      {/* torre listrada */}
      <path d="M46 100 L52 42 H68 L74 100 Z" fill={PAPER} stroke={INK} strokeWidth="2.8" />
      <path d="M51 54 H69 L70 64 H50 Z M49 76 H71 L72 86 H48 Z" fill={RED} stroke={INK} strokeWidth="1.8" />
      {/* rostinho na torre */}
      <g className="blink" style={{ transformOrigin: '60px 70px' }}>
        <circle cx="56" cy="70" r="2" fill={INK} />
        <circle cx="64" cy="70" r="2" fill={INK} />
      </g>
      <path d="M56 75 Q60 78 64 75" fill="none" stroke={INK} strokeWidth="2" />
      {/* base */}
      <rect x="40" y="98" width="40" height="8" rx="3" fill={INK} />
      {/* estrelinhas */}
      <path d="M22 62 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 Z" fill={TEAL} />
      <circle cx="94" cy="70" r="2.4" fill={TEAL} />
    </g>
  )
}

function AFome() {
  return (
    <g strokeLinecap="round">
      {/* disco de acreção */}
      <g className="orbit-spin" style={{ transformOrigin: '60px 60px' }}>
        <ellipse cx="60" cy="60" rx="50" ry="18" fill="none" stroke={RED} strokeWidth="3" transform="rotate(-14 60 60)" />
        <ellipse cx="60" cy="60" rx="42" ry="13" fill="none" stroke={GOLD} strokeWidth="2" strokeDasharray="10 6" transform="rotate(-14 60 60)" />
      </g>
      {/* corpo */}
      <circle className="maw-pulse" cx="60" cy="60" r="26" fill={INK} style={{ transformOrigin: '60px 60px' }} />
      {/* dentes para dentro */}
      <g fill={PAPER}>
        <path d="M60 38 L57 46 L63 46 Z" />
        <path d="M60 82 L57 74 L63 74 Z" />
        <path d="M38 60 L46 57 L46 63 Z" />
        <path d="M82 60 L74 57 L74 63 Z" />
        <path d="M45 45 L47 52 L52 47 Z" />
        <path d="M75 45 L73 52 L68 47 Z" />
        <path d="M45 75 L52 73 L47 68 Z" />
        <path d="M75 75 L68 73 L73 68 Z" />
      </g>
      {/* olho único faminto */}
      <g className="blink" style={{ transformOrigin: '60px 60px' }}>
        <circle cx="60" cy="60" r="7" fill={RED} />
        <circle cx="60" cy="60" r="2.6" fill={PAPER} />
      </g>
      {/* itens sendo engolidos */}
      <g transform="rotate(-14 60 60)">
        <rect x="96" y="52" width="9" height="4" rx="1" fill={TEAL} stroke={INK} strokeWidth="1.2" />
        <circle cx="16" cy="66" r="3.4" fill={GOLD} stroke={INK} strokeWidth="1.2" />
      </g>
    </g>
  )
}

/* ---------- protocolos (selos circulares) ---------- */

function Seal({ children, color = PURPLE }: { children: React.ReactNode; color?: string }) {
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
      <path d="M74 74 L84 84 M84 74 L74 84" stroke={GOLD} strokeWidth="0" />
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

const REGISTRY: Record<string, () => React.JSX.Element> = {
  gato: Gato,
  foton: Foton,
  neutrino: Neutrina,
  sentinela: Sentinela,
  eletron: Eletron,
  colapsador: Auditor,
  ondapiloto: MadameOnda,
  quasar: Quasar,
  singularidade: AFome,
  medicao: Medicao,
  polarizacao: Polarizacao,
  emaranhar: Emaranhar,
  tunel: Tunel,
  pulso: Pulso,
  decoerencia: Decoerencia,
  flutuacao: Requisicao,
}
