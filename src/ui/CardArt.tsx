/** Arte procedural em SVG por carta — traços finos na cor do estado, atrás do sigilo. */

const PATTERN: Record<string, string> = {
  foton: 'rays',
  neutrino: 'trail',
  sentinela: 'lattice',
  eletron: 'orbits',
  gato: 'box',
  colapsador: 'crosshair',
  ondapiloto: 'waves',
  quasar: 'burst',
  singularidade: 'rings',
  medicao: 'crosshair',
  polarizacao: 'split',
  emaranhar: 'knot',
  tunel: 'trail',
  pulso: 'zigzag',
  decoerencia: 'scatter',
  flutuacao: 'waves',
}

export function CardArt({ defId }: { defId: string }) {
  const kind = PATTERN[defId] ?? 'rings'
  return (
    <svg className="card-art-svg" viewBox="0 0 100 100" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5">
        {renderPattern(kind)}
      </g>
    </svg>
  )
}

function renderPattern(kind: string) {
  switch (kind) {
    case 'rays':
      return Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <line
            key={i}
            x1={50 + Math.cos(a) * 14}
            y1={50 + Math.sin(a) * 14}
            x2={50 + Math.cos(a) * (30 + (i % 3) * 8)}
            y2={50 + Math.sin(a) * (30 + (i % 3) * 8)}
          />
        )
      })
    case 'trail':
      return (
        <>
          <path d="M 8 78 Q 50 60 92 22" strokeDasharray="2 5" />
          <path d="M 8 62 Q 50 46 92 10" strokeDasharray="2 7" opacity="0.5" />
          <circle cx="78" cy="27" r="3" />
        </>
      )
    case 'lattice':
      return (
        <>
          <polygon points="50,12 82,31 82,69 50,88 18,69 18,31" />
          <polygon points="50,26 70,38 70,62 50,74 30,62 30,38" opacity="0.6" />
          <line x1="50" y1="12" x2="50" y2="26" />
          <line x1="82" y1="69" x2="70" y2="62" />
          <line x1="18" y1="69" x2="30" y2="62" />
        </>
      )
    case 'orbits':
      return (
        <>
          <ellipse cx="50" cy="50" rx="38" ry="14" transform="rotate(-24 50 50)" />
          <ellipse cx="50" cy="50" rx="38" ry="14" transform="rotate(52 50 50)" />
          <circle cx="76" cy="34" r="2.4" fill="currentColor" stroke="none" />
        </>
      )
    case 'box':
      return (
        <>
          <rect x="22" y="26" width="56" height="52" rx="6" />
          <path d="M 22 40 L 78 40" opacity="0.5" />
          <path d="M 38 58 q 4 -5 8 0" />
          <path d="M 56 58 q 4 -5 8 0" />
        </>
      )
    case 'crosshair':
      return (
        <>
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="18" opacity="0.6" />
          <line x1="50" y1="8" x2="50" y2="28" />
          <line x1="50" y1="72" x2="50" y2="92" />
          <line x1="8" y1="50" x2="28" y2="50" />
          <line x1="72" y1="50" x2="92" y2="50" />
        </>
      )
    case 'waves':
      return (
        <>
          <path d="M 6 38 q 11 -14 22 0 t 22 0 t 22 0 t 22 0" />
          <path d="M 6 56 q 11 -14 22 0 t 22 0 t 22 0 t 22 0" opacity="0.65" />
          <path d="M 6 74 q 11 -14 22 0 t 22 0 t 22 0 t 22 0" opacity="0.35" />
        </>
      )
    case 'burst':
      return (
        <>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2 + 0.4
            return (
              <line
                key={i}
                x1={50 + Math.cos(a) * 10}
                y1={50 + Math.sin(a) * 10}
                x2={50 + Math.cos(a) * (i % 2 === 0 ? 40 : 26)}
                y2={50 + Math.sin(a) * (i % 2 === 0 ? 40 : 26)}
              />
            )
          })}
          <circle cx="50" cy="50" r="7" />
        </>
      )
    case 'rings':
      return (
        <>
          <circle cx="50" cy="50" r="10" />
          <circle cx="50" cy="50" r="19" opacity="0.75" />
          <circle cx="50" cy="50" r="29" opacity="0.5" />
          <circle cx="50" cy="50" r="40" opacity="0.28" />
        </>
      )
    case 'split':
      return (
        <>
          <path d="M 34 18 L 34 74 M 34 74 l -6 -9 M 34 74 l 6 -9" />
          <path d="M 66 82 L 66 26 M 66 26 l -6 9 M 66 26 l 6 9" />
        </>
      )
    case 'knot':
      return (
        <>
          <circle cx="38" cy="50" r="17" />
          <circle cx="62" cy="50" r="17" />
        </>
      )
    case 'zigzag':
      return <path d="M 30 12 L 58 40 L 42 48 L 70 88" strokeWidth="1.6" />
    case 'scatter':
      return (
        <>
          {Array.from({ length: 14 }, (_, i) => {
            const a = i * 2.4
            const rad = 12 + (i * 5.3) % 34
            return (
              <circle
                key={i}
                cx={50 + Math.cos(a) * rad}
                cy={50 + Math.sin(a) * rad}
                r={1 + (i % 3) * 0.7}
                fill="currentColor"
                stroke="none"
                opacity={0.8 - (i % 4) * 0.15}
              />
            )
          })}
        </>
      )
    default:
      return <circle cx="50" cy="50" r="26" />
  }
}
