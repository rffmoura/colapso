import { getSecret } from '../engine/secrets'
import type { SecretId } from '../engine/types'

interface SecretCardProps {
  id?: SecretId
  hidden?: boolean
  compact?: boolean
  used?: boolean
  reserve?: number
  onClick?: () => void
  actionLabel?: string
  ariaLabel?: string
}

export function SecretCard({
  id,
  hidden = false,
  compact = false,
  used = false,
  reserve = 0,
  onClick,
  actionLabel,
  ariaLabel,
}: SecretCardProps) {
  const def = id ? getSecret(id) : null
  const content = (
    <>
      <span className="secret-notch" aria-hidden="true" />
      <div className="secret-code">{hidden ? 'CT-??' : def?.code}</div>
      <div className="secret-seal" aria-hidden="true">C</div>
      <div className="secret-name">{hidden ? 'Contramedida confidencial' : def?.name}</div>
      {!compact && <div className="secret-trigger">{hidden ? 'gatilho sob sigilo' : def?.trigger}</div>}
      {!compact && <p>{hidden ? 'O Autômato lacrou este protocolo. Só será identificado quando disparar.' : def?.text}</p>}
      {reserve > 0 && <span className="secret-reserve">+{reserve} em reserva</span>}
      {used && <span className="secret-used-stamp">utilizada</span>}
      {actionLabel && <span className="secret-action">{actionLabel}</span>}
    </>
  )

  if (onClick) {
    return (
      <button
        className={`secret-card${hidden ? ' hidden' : ''}${compact ? ' compact' : ''}${used ? ' used' : ''}`}
        onClick={(event) => {
          event.stopPropagation()
          onClick()
        }}
        aria-label={ariaLabel}
      >
        {content}
      </button>
    )
  }

  return <div className={`secret-card${hidden ? ' hidden' : ''}${compact ? ' compact' : ''}${used ? ' used' : ''}`}>{content}</div>
}
