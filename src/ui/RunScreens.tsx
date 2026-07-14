import { motion } from 'motion/react'
import { DIRECTIVES, getDirective } from '../engine/secrets'
import type { DirectiveId } from '../engine/types'
import {
  beginDuel,
  chooseInitialSecret,
  chooseRewardSecret,
  equipSecret,
  restart,
  useStore,
} from '../state/store'
import { SecretCard } from './SecretCard'

const DUELS = ['Arquivo Norte', 'Câmara de Ondas', 'Subsolo Zero', 'Autômato Supervisor']

function ShiftTrack({ stage }: { stage: number }) {
  return (
    <ol className="shift-track" aria-label={`Duelo ${stage + 1} de 4`}>
      {DUELS.map((name, index) => (
        <li key={name} className={`${index < stage ? 'cleared' : ''}${index === stage ? 'current' : ''}`}>
          <span>{index + 1}</span>
          <small>{name}</small>
        </li>
      ))}
    </ol>
  )
}

function RunShell({ children, tab }: { children: React.ReactNode; tab: string }) {
  return (
    <div className="run-screen">
      <motion.main
        className="run-folder"
        initial={{ opacity: 0, y: 24, rotate: -0.8 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="run-folder-tab">{tab}</div>
        {children}
      </motion.main>
    </div>
  )
}

export function SecretDraftScreen() {
  const st = useStore()
  if (!st.run) return null
  return (
    <RunShell tab="credenciamento · acesso restrito">
      <div className="run-heading">
        <div>
          <div className="run-kicker">plantão contínuo · formulário 1 de 4</div>
          <h1>Escolha sua primeira contramedida</h1>
          <p>Ela entra armada sem custo e dispara uma vez neste duelo. O Autômato também levará uma, mas manterá o texto sob sigilo.</p>
        </div>
        <div className="run-stamp">uma escolha<br />sem revisão</div>
      </div>
      <ShiftTrack stage={0} />
      <div className="secret-draft-grid">
        {st.run.offeredSecrets.map((id) => (
          <SecretCard key={id} id={id} actionLabel="Equipar e prosseguir" onClick={() => chooseInitialSecret(id)} />
        ))}
      </div>
    </RunShell>
  )
}

function DirectiveList({ ids }: { ids: DirectiveId[] }) {
  if (ids.length === 0) return <p className="directive-empty">Nenhuma alteração hostil registrada.</p>
  return (
    <div className="directive-list">
      {ids.map((id) => {
        const directive = getDirective(id)
        return (
          <div className="directive-ticket" key={id}>
            <span>{directive.code}</span>
            <b>{directive.name}</b>
            <small>{directive.text}</small>
          </div>
        )
      })}
    </div>
  )
}

export function BriefingScreen() {
  const st = useStore()
  if (!st.run) return null
  const boss = st.run.stage === 3
  const coherence = st.game.sides.ai.coherence
  return (
    <RunShell tab={boss ? 'ordem de contenção máxima' : `ordem de serviço · setor ${st.run.stage + 1}`}>
      <div className="briefing-layout">
        <section className="briefing-main">
          <div className="run-kicker">próximo confronto · duelo {st.run.stage + 1} de 4</div>
          <h1>{boss ? 'Autômato Supervisor' : DUELS[st.run.stage]}</h1>
          <p>
            {boss
              ? 'O Supervisor assumiu o terminal. Ele começa reforçado e possui duas contramedidas diferentes, armadas em sequência.'
              : 'As Diretrizes permanecem ativas até o fim do Plantão. Confira o dossiê antes de entrar na bancada.'}
          </p>
          <div className="briefing-facts">
            <div><small>coerência inimiga</small><b>{coherence}</b></div>
            <div><small>contramedidas ocultas</small><b>{boss ? 2 : 1}</b></div>
            <div><small>sua escolha</small><b>{st.run.equippedSecret ? 'armada' : 'pendente'}</b></div>
          </div>
          <button className="btn-stamp" onClick={beginDuel}>Entrar no setor</button>
        </section>
        <aside className="briefing-file">
          <div className="briefing-label">Diretrizes cumulativas</div>
          <DirectiveList ids={st.run.directives} />
          <div className="briefing-label own-secret-label">Sua contramedida</div>
          {st.run.equippedSecret && <SecretCard id={st.run.equippedSecret} compact />}
        </aside>
      </div>
      <ShiftTrack stage={st.run.stage} />
    </RunShell>
  )
}

export function RewardScreen() {
  const st = useStore()
  if (!st.run) return null
  const nextStage = st.run.stage + 1
  if (st.run.rewardStep === 'equip') {
    return (
      <RunShell tab={`arsenal autorizado · setor ${nextStage + 1}`}>
        <div className="run-heading compact-heading">
          <div>
            <div className="run-kicker">última assinatura antes do próximo setor</div>
            <h1>Equipe uma contramedida</h1>
            <p>Seu arsenal cresce, mas apenas uma carta pode permanecer armada em cada duelo.</p>
          </div>
        </div>
        <ShiftTrack stage={nextStage} />
        <div className="arsenal-grid">
          {st.run.arsenal.map((id) => (
            <SecretCard key={id} id={id} actionLabel="Armar para o próximo duelo" onClick={() => equipSecret(id)} />
          ))}
        </div>
      </RunShell>
    )
  }

  const pending = st.run.pendingDirective ? DIRECTIVES[st.run.pendingDirective] : null
  return (
    <RunShell tab="adendo do supervisor · obrigatório">
      <div className="reward-layout">
        <section className="reward-directive">
          <div className="run-kicker">vitória registrada · dificuldade elevada</div>
          <h1>Nova Diretriz do Autômato</h1>
          {pending && (
            <div className="directive-large">
              <span>{pending.code}</span>
              <h2>{pending.name}</h2>
              <p>{pending.text}</p>
              <div className="directive-stamp">cumulativa</div>
            </div>
          )}
          <p className="reward-note">A Diretriz já foi protocolada. Agora escolha uma nova resposta para seu arsenal.</p>
        </section>
        <section className="reward-secrets">
          <h2>Requisite uma contramedida</h2>
          <div className="secret-draft-grid reward-grid">
            {st.run.offeredSecrets.map((id) => (
              <SecretCard key={id} id={id} actionLabel="Adicionar ao arsenal" onClick={() => chooseRewardSecret(id)} />
            ))}
          </div>
        </section>
      </div>
    </RunShell>
  )
}

export function RunEndScreen({ won }: { won: boolean }) {
  return (
    <div className="gameover" role="dialog" aria-modal="true" aria-label={won ? 'Plantão concluído' : 'Plantão encerrado'}>
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
          transition={{ delay: 0.4, duration: 0.2 }}
        >
          {won ? 'Plantão cumprido' : 'Arquivo reiniciado'}
        </motion.div>
        <div className="report-kicker">instituto meia-vida · relatório de plantão contínuo</div>
        <h1>{won ? 'Supervisor neutralizado' : 'Sequência encerrada'}</h1>
        <p>
          {won
            ? 'Quatro setores, três Diretrizes e um Supervisor depois, sua Coerência continua registrada. O turno da noite foi aprovado.'
            : 'A derrota apagou estágio, arsenal e Diretrizes. O Instituto já separou três novas contramedidas para outra tentativa.'}
        </p>
        <button className="btn-stamp" onClick={restart}>{won ? 'Novo Plantão' : 'Tentar novamente'}</button>
      </motion.div>
    </div>
  )
}
