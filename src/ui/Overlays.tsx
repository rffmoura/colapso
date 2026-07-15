import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { getSecret } from '../engine/secrets'
import {
  closeSecretInspector,
  dismissAllMemos,
  dismissMemo,
  inspectSecret,
  refRegistry,
  restart,
  toggleManual,
  useStore,
} from '../state/store'
import { MEMOS } from './didactics'
import { SecretCard } from './SecretCard'

export function TurnBanner() {
  const st = useStore()
  const b = st.banner
  const mine = b?.owner === 'player'
  return (
    <div className="turn-banner">
      <AnimatePresence>
        {b && (
          <motion.div
            key={`${b.owner}-${b.turn}`}
            className="telegram"
            initial={{ opacity: 0, x: -70, rotate: -1.5 }}
            animate={{ opacity: 1, x: 0, rotate: -0.5 }}
            exit={{ opacity: 0, x: 70 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={`telegram-text ${mine ? 'mine' : 'theirs'}`}>
              {mine ? 'Seu plantão' : 'Vez do Autômato'}
            </div>
            <div className="telegram-sub">turno {b.turn} · instituto meia-vida</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface StringLine {
  x1: number
  y1: number
  x2: number
  y2: number
  key: string
}

/** Barbante vermelho de mural de evidências entre sujeitos emaranhados. */
export function EntangleLayer() {
  const st = useStore()
  const [lines, setLines] = useState<StringLine[]>([])
  const pairs: Array<[number, number]> = []
  for (const c of [...st.game.board.player, ...st.game.board.ai]) {
    if (c.entangledWith !== null && c.uid < c.entangledWith) pairs.push([c.uid, c.entangledWith])
  }
  const pairsKey = pairs.map((p) => p.join('-')).join(',')

  useEffect(() => {
    if (!pairsKey) {
      setLines([])
      return
    }
    let raf = 0
    const tick = () => {
      const next: StringLine[] = []
      for (const part of pairsKey.split(',')) {
        const [a, b] = part.split('-').map(Number)
        const ea = refRegistry.get(`c-${a}`)
        const eb = refRegistry.get(`c-${b}`)
        if (!ea || !eb) continue
        const ra = ea.getBoundingClientRect()
        const rb = eb.getBoundingClientRect()
        next.push({
          x1: ra.x + ra.width / 2,
          y1: ra.y + ra.height / 2,
          x2: rb.x + rb.width / 2,
          y2: rb.y + rb.height / 2,
          key: part,
        })
      }
      setLines(next)
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [pairsKey])

  if (lines.length === 0) return null
  return (
    <svg className="entangle-svg">
      {lines.map((l) => {
        const mx = (l.x1 + l.x2) / 2
        const sag = Math.min(46, Math.abs(l.x2 - l.x1) * 0.12 + 18)
        const my = (l.y1 + l.y2) / 2 + sag
        return (
          <g key={l.key}>
            <path className="string-line" d={`M ${l.x1} ${l.y1} Q ${mx} ${my} ${l.x2} ${l.y2}`} />
            <circle className="string-pin" cx={l.x1} cy={l.y1} r="5" />
            <circle className="string-pin" cx={l.x2} cy={l.y2} r="5" />
          </g>
        )
      })}
    </svg>
  )
}

/** Linha de mira: traço de lápis da origem até o cursor. */
export function TargetingArrow() {
  const st = useStore()
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
  const active =
    st.selection !== null &&
    st.selection.type !== 'polarizeFace' &&
    st.selection.type !== 'measureFace' &&
    st.selection.type !== 'influenceFace'

  useEffect(() => {
    if (!active) {
      setMouse(null)
      return
    }
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [active])

  if (!active || !mouse) return null

  const sel = st.selection!
  const sourceKey = sel.type === 'attacker' ? `c-${sel.uid}` : 'hero-player'
  const el = refRegistry.get(sourceKey)
  if (!el) return null
  const r = el.getBoundingClientRect()
  const x1 = r.x + r.width / 2
  const y1 = r.y + r.height / 2
  const isSpell = sel.type !== 'attacker'
  const mx = (x1 + mouse.x) / 2
  const my = Math.min(y1, mouse.y) - 60

  return (
    <svg className="arrow-svg">
      <path className={`arrow-line${isSpell ? ' spell' : ''}`} d={`M ${x1} ${y1} Q ${mx} ${my} ${mouse.x} ${mouse.y}`} />
      <circle cx={mouse.x} cy={mouse.y} r={8} fill="none" stroke={isSpell ? 'var(--entangle)' : 'var(--ink)'} strokeWidth={3} />
      <circle cx={mouse.x} cy={mouse.y} r={2.4} fill={isSpell ? 'var(--entangle)' : 'var(--ink)'} />
    </svg>
  )
}

export function GameOverOverlay() {
  const st = useStore()
  const won = st.game.winner === 'player'
  return (
    <motion.div
      className="gameover"
      role="dialog"
      aria-modal="true"
      aria-label={won ? 'Relatório final: aprovado' : 'Relatório final: arquivado'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={`report ${won ? 'win' : 'lose'}`}
        initial={{ y: 60, rotate: -3, opacity: 0 }}
        animate={{ y: 0, rotate: -0.8, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 210, damping: 20 }}
      >
        <motion.div
          className="verdict"
          initial={{ scale: 2.4, opacity: 0, rotate: 24 }}
          animate={{ scale: 1, opacity: 1, rotate: 12 }}
          transition={{ delay: 0.45, duration: 0.2, ease: [0.6, 0, 0.8, 0.4] }}
        >
          {won ? 'Aprovado' : 'Arquivado'}
        </motion.div>
        <div className="report-kicker">instituto meia-vida · relatório de plantão</div>
        <h1>{won ? 'Coerência total' : 'Decoerência'}</h1>
        <p>
          {won
            ? 'A função de onda do Autômato foi reduzida a ruído de fundo. O Supervisor deixou um bilhete: "aceitável". É o maior elogio registrado desde 1953.'
            : 'Sua função de onda se dissolveu no ambiente. O Autômato já datilografou o relatório em três vias. Requisite um novo plantão.'}
        </p>
        <button className="btn-stamp" onClick={restart}>
          Novo plantão
        </button>
      </motion.div>
    </motion.div>
  )
}

export function SecretRevealLayer() {
  const st = useStore()
  return (
    <div className="secret-reveal-layer" aria-live="assertive">
      <AnimatePresence>
        {st.secretFx.slice(-1).map((item) => (
          <motion.div
            key={item.id}
            className={`secret-reveal ${item.owner === 'player' ? 'mine' : 'theirs'}`}
            initial={{ opacity: 0, y: item.owner === 'player' ? 70 : -70, rotateY: 90, scale: 0.82 }}
            animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, y: item.owner === 'player' ? 30 : -30, scale: 0.9 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="secret-reveal-kicker">
              {item.owner === 'player' ? 'sua contramedida disparou' : 'contramedida inimiga revelada'}
            </div>
            <SecretCard id={item.secretId} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function SecretInspector() {
  const st = useStore()
  const inspected = st.secretInspector
  const secret = inspected ? getSecret(inspected.secretId) : null
  const inspectedSide = inspected ? st.game.sides[inspected.owner] : null
  const resolvedStatus =
    inspected && inspectedSide?.activeSecret?.id === inspected.secretId
      ? 'armed'
      : inspected && inspectedSide?.revealedSecrets.includes(inspected.secretId)
        ? 'used'
        : inspected?.status

  return (
    <AnimatePresence>
      {inspected && secret && (
        <motion.div
          className="secret-inspector-overlay"
          onClick={closeSecretInspector}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.section
            className={`secret-inspector ${resolvedStatus}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="secret-inspector-title"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 26, rotate: -1.4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotate: -0.3, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="secret-inspector-copy">
              <div className="secret-inspector-kicker">
                {inspected.owner === 'player' ? 'seu arquivo de segurança' : 'arquivo interceptado do autômato'}
              </div>
              <h2 id="secret-inspector-title">{secret.name}</h2>
              <div className="secret-inspector-status">
                {resolvedStatus === 'armed' ? 'armada · disponível' : 'utilizada · efeito consumido'}
              </div>
              <p>
                {resolvedStatus === 'armed'
                  ? 'Esta contramedida ainda pode disparar neste duelo. Use o gatilho abaixo para planejar seu turno.'
                  : 'Esta contramedida já disparou e não pode ativar novamente neste duelo. Ela permanece no painel para consulta.'}
              </p>
              {resolvedStatus === 'used' && inspectedSide && inspectedSide.revealedSecrets.length > 1 && (
                <div className="secret-inspector-history" aria-label="Contramedidas já reveladas">
                  <span>registros revelados</span>
                  <div>
                    {inspectedSide.revealedSecrets.map((id) => (
                      <button
                        key={id}
                        className={id === inspected.secretId ? 'current' : ''}
                        onClick={() => inspectSecret(inspected.owner, id, 'used')}
                      >
                        {getSecret(id).code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button className="btn-paper secret-inspector-close" onClick={closeSecretInspector} autoFocus>
                Fechar ficha
              </button>
            </div>
            <SecretCard id={inspected.secretId} used={resolvedStatus === 'used'} />
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Memorando didático do Supervisor (um por vez, sem cobrir as ações da mesa). */
export function MemoToast() {
  const st = useStore()
  const memo = st.memoQueue.length > 0 ? MEMOS[st.memoQueue[0]] : null
  return (
    <AnimatePresence>
      {memo && (
        <motion.div
          key={memo.id}
          className="memo"
          role="status"
          aria-live="polite"
          initial={{ y: 90, opacity: 0, rotate: 5 }}
          animate={{ y: 0, opacity: 1, rotate: 1.2 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="memo-kicker">memorando do supervisor</div>
          <div className="memo-title">{memo.title}</div>
          <div className="memo-text">{memo.text}</div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="memo-btn" onClick={dismissMemo}>
              Entendido
            </button>
            <button className="memo-btn" style={{ opacity: 0.65 }} onClick={dismissAllMemos}>
              Já sei jogar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ManualOverlay() {
  const st = useStore()
  if (!st.manualOpen) return null
  return (
    <div className="manual-overlay" onClick={toggleManual}>
      <motion.div
        className="manual"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-title"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="manual-head">
          <div>
            <h2 id="manual-title">Manual do Observador</h2>
            <div className="manual-sub">instituto meia-vida · circular interna nº 7 · versão de bolso</div>
          </div>
          <button className="manual-top-close" onClick={toggleManual}>
            Fechar
          </button>
        </header>

        <div className="manual-mission">
          <span>seu posto no instituto</span>
          <p>
            Você é o Observador do turno da noite no Instituto Meia-Vida. Você e o Autômato disputam
            Sujeitos quânticos — seres que existem em dois estados ao mesmo tempo. A{' '}
            <strong>Coerência</strong> é a vida de vocês: ambos começam com 25. Zere a dele antes que
            ele zere a sua.
          </p>
        </div>

        <div className="manual-layout">
          <section className="manual-core" aria-labelledby="manual-core-title">
            <div className="manual-section-kicker">comece por aqui</div>
            <h3 id="manual-core-title">O básico em cinco passos</h3>

            <ol className="manual-steps">
              <li>
                <div>
                  <h4>Use sua energia</h4>
                  <p>
                    <strong>Qubits são sua energia.</strong> Você os gasta para jogar as fichas da sua
                    mão; o número no canto mostra o custo. No início de cada turno, seu máximo de
                    Qubits aumenta em 1 (até 8) e a energia recarrega. Seu <strong>Arquivo</strong> é o
                    monte de compra: dele você compra até ficar com 5 fichas na mão, sempre ao menos 1.
                    Se ele esvaziar, o monte de descarte é embaralhado e vira um novo Arquivo.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <h4>Conheça suas fichas</h4>
                  <p>
                    Há dois tipos. <strong>Sujeitos</strong> são os seres que você coloca na mesa para
                    lutar. <strong>Protocolos</strong> fazem um efeito e vão para o descarte. Um
                    Sujeito normalmente só ataca a partir do turno seguinte.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <h4>Dois estados ao mesmo tempo</h4>
                  <p>
                    Todo Sujeito entra em <strong>superposição</strong>: seus estados A e B existem ao
                    mesmo tempo. Cada um mostra Ataque em vermelho, Vida em azul e possíveis
                    habilidades. Enquanto os dois piscam, essas habilidades não funcionam.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <h4>Quando dois estados viram um</h4>
                  <p>
                    Quando um Sujeito ataca ou é atacado, apenas A ou B fica. Esse é o{' '}
                    <strong>colapso</strong>. Sem interferência, cada estado tem 50% de chance. Depois,
                    o selo azul mostra a Vida atual; o dano permanece entre turnos.
                  </p>
                  <p className="manual-emphasis">
                    <strong>Observar influencia o colapso.</strong> Por 2 Qubits, uma vez por turno,
                    escolha A ou B de qualquer Sujeito em superposição: 75% de chance para sua escolha
                    e 25% para a outra. Medição custa 3 Qubits e garante sua escolha em qualquer
                    Sujeito. Polarização custa 2 Qubits e faz o mesmo, mas apenas em um Sujeito seu.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <h4>Ataque e cause dano</h4>
                  <p>
                    Cada Sujeito ataca uma vez por turno. Contra outro Sujeito, ambos causam dano ao
                    mesmo tempo; quem chegar a 0 de Vida morre. Contra o Autômato, o Ataque reduz a
                    Coerência sem revide. Quem sobrevive pode atacar no turno seguinte.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section className="manual-reference" aria-labelledby="manual-reference-title">
            <div className="manual-section-kicker">consulte quando aparecer</div>
            <h3 id="manual-reference-title">Regras especiais</h3>

            <dl className="manual-rules">
              <div>
                <dt>Palavras-chave</dt>
                <dd>
                  Enquanto houver um inimigo com <strong>Barreira</strong>, seus ataques devem mirar
                  nele. <strong>Veloz</strong> permite atacar no turno em que o Sujeito entra.{' '}
                  <strong>Fantasma</strong> ignora Barreira ao atacar e, quando ativado, deixa o Sujeito
                  Intangível até seu próximo turno. Nesse período ele não pode ser alvo de ataques, mas
                  ainda sofre Protocolos e revides. Habilidades impressas em um estado só funcionam
                  após o colapso.
                </dd>
              </div>
              <div>
                <dt>Emaranhamento</dt>
                <dd>
                  O Protocolo Emaranhamento liga um Sujeito seu a um inimigo. Quando um colapsa, o
                  outro fica no mesmo estado. Quando um morre, o parceiro sofre 2 de dano. Esse colapso
                  indireto não conta como um novo uso de Observar.
                </dd>
              </div>
              <div>
                <dt>Contramedidas</dt>
                <dd>
                  São cartas especiais que reagem automaticamente a acontecimentos do duelo. A sua
                  fica aberta; a do Autômato, secreta até disparar. Cada uma funciona uma vez e não
                  ativa outra Contramedida. O Supervisor prepara uma segunda após a primeira. Clique
                  na carta do painel para reler o efeito, mesmo depois de usada.
                </dd>
              </div>
              <div>
                <dt>Plantão contínuo</dt>
                <dd>
                  Um Plantão tem três setores e a batalha final contra o Autômato Supervisor. Cada
                  vitória dá à máquina um bônus cumulativo, chamado Diretriz, e adiciona uma
                  Contramedida ao seu arsenal. Você equipa uma para o duelo seguinte. Uma derrota
                  apaga estágio, arsenal e Diretrizes.
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="close-row">
          <button className="btn-paper" onClick={toggleManual}>
            Voltar ao plantão
          </button>
        </div>
      </motion.div>
    </div>
  )
}
