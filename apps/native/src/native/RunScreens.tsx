import { characterArt } from '@colapso/game-assets/native'
import { DIRECTIVES, getDirective, type DirectiveId, type SecretId } from '@colapso/game-core'
import { useGameSession, type GameSessionController } from '@colapso/game-session'
import { Image } from 'expo-image'
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { LabelRule, PaperButton, RoundButton } from './components/Controls'
import { QuantumMark } from './components/QuantumMark'
import { NativeSecretCard } from './components/SecretCard'
import { colors, fonts, shadow } from './theme'

const DUELS = ['Arquivo Norte', 'Câmara de Ondas', 'Subsolo Zero', 'Autômato Supervisor']
const CAST = ['gato', 'colapsador', 'sentinela', 'ondapiloto', 'eletron', 'singularidade'] as const

export function TitleScreen({ onStart, onManual, onSettings }: { onStart: () => void; onManual: () => void; onSettings: () => void }) {
  const compact = useWindowDimensions().height < 500
  return (
    <View style={[styles.titleScreen, compact && styles.titleScreenCompact]}>
      <View style={styles.titleCopy}>
        <Text style={styles.kicker}>INSTITUTO MEIA-VIDA · DIVISÃO DE OBSERVAÇÃO · TURNO DA NOITE</Text>
        <View accessibilityLabel="COLAPSO" style={styles.wordmark}>
          <Text style={[styles.word, compact && styles.wordCompact]}>COLA</Text>
          <Text style={[styles.word, styles.particle, compact && styles.wordCompact]}>P</Text>
          <Text style={[styles.word, styles.wave, compact && styles.wordCompact]}>S</Text>
          <QuantumMark size={compact ? 56 : 82} />
        </View>
        <Text style={styles.subtitle}>Um duelo de fichas onde nada está decidido até alguém olhar.</Text>
        <LabelRule>ordem de serviço</LabelRule>
        <Text style={styles.lore}>O Instituto estuda o que o universo faz quando ninguém está olhando. Você é o Observador desta noite: dispute a custódia de sujeitos em dois estados e preserve sua Coerência.</Text>
        <View style={styles.titleActions}>
          <PaperButton label="Assumir o plantão" variant="stamp" onPress={onStart} />
          <PaperButton label="Manual do Observador" onPress={onManual} />
        </View>
      </View>
      <View style={styles.castFile}>
        <Text style={styles.fileTab}>ARQUIVO DE SUJEITOS · ACESSO RESTRITO</Text>
        <View style={styles.castGrid}>
          {CAST.map((id, index) => (
            <View key={id} style={[styles.castSlot, { transform: [{ rotate: `${index % 2 === 0 ? -1.5 : 1.5}deg` }] }]}> 
              <Image source={characterArt[id]} style={styles.castImage} contentFit="cover" contentPosition={{ top: '22%', left: '50%' }} />
              <Text style={styles.castName}>{id === 'colapsador' ? 'O AUDITOR' : id.toUpperCase()}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.confidential}>CONFIDENCIAL</Text>
      </View>
      <View style={styles.titleSettings}><RoundButton label="Ajustes" glyph="S" onPress={onSettings} /></View>
    </View>
  )
}

export function DraftScreen({ controller }: { controller: GameSessionController }) {
  const state = useGameSession(controller)
  if (!state.run) return null
  return (
    <RunShell tab="credenciamento · acesso restrito" stage={0}>
      <RunHeading kicker="PLANTÃO CONTÍNUO · FORMULÁRIO 1 DE 4" title="Escolha sua primeira contramedida" text="Ela entra armada sem custo e dispara uma vez. A carta do Autômato fica sob sigilo." stamp />
      <SecretRow ids={state.run.offeredSecrets} action="Equipar e prosseguir" onChoose={(secret) => void controller.send({ type: 'CHOOSE_INITIAL_SECRET', secret })} />
    </RunShell>
  )
}

export function BriefingScreen({ controller }: { controller: GameSessionController }) {
  const state = useGameSession(controller)
  if (!state.run) return null
  const boss = state.run.stage === 3
  return (
    <RunShell tab={boss ? 'ordem de contenção máxima' : `ordem de serviço · setor ${state.run.stage + 1}`} stage={state.run.stage}>
      <View style={styles.briefing}>
        <View style={styles.briefingMain}>
          <Text style={styles.kickerRed}>PRÓXIMO CONFRONTO · DUELO {state.run.stage + 1} DE 4</Text>
          <Text style={styles.runTitle}>{boss ? 'Autômato Supervisor' : DUELS[state.run.stage]}</Text>
          <Text style={styles.runText}>{boss ? 'O Supervisor inicia reforçado e leva duas Contramedidas diferentes, armadas em sequência.' : 'As Diretrizes abaixo permanecem ativas até o fim do Plantão.'}</Text>
          <View style={styles.facts}>
            <Fact label="COERÊNCIA INIMIGA" value={String(state.game.sides.ai.coherence)} />
            <Fact label="ARQUIVOS OCULTOS" value={boss ? '2' : '1'} />
            <Fact label="SUA RESPOSTA" value="ARMADA" />
          </View>
          <PaperButton label="Entrar no setor" variant="stamp" onPress={() => void controller.send({ type: 'BEGIN_DUEL' })} />
        </View>
        <View style={styles.briefingFile}>
          <Text style={styles.fileLabel}>DIRETRIZES CUMULATIVAS</Text>
          <DirectiveList ids={state.run.directives} />
          <Text style={styles.fileLabel}>SUA CONTRAMEDIDA</Text>
          {state.run.equippedSecret && <NativeSecretCard id={state.run.equippedSecret} compact width={142} />}
        </View>
      </View>
    </RunShell>
  )
}

export function RewardScreen({ controller }: { controller: GameSessionController }) {
  const state = useGameSession(controller)
  if (!state.run) return null
  const run = state.run
  if (run.rewardStep === 'equip') {
    return (
      <RunShell tab={`arsenal autorizado · setor ${run.stage + 2}`} stage={run.stage + 1}>
        <RunHeading kicker="ÚLTIMA ASSINATURA ANTES DO PRÓXIMO SETOR" title="Equipe uma contramedida" text="Seu arsenal cresce, mas apenas um arquivo permanece armado por duelo." />
        <SecretRow ids={run.arsenal} action="Armar para o próximo duelo" onChoose={(secret) => void controller.send({ type: 'EQUIP_SECRET', secret })} />
      </RunShell>
    )
  }
  const directive = run.pendingDirective ? DIRECTIVES[run.pendingDirective] : null
  return (
    <RunShell tab="adendo do supervisor · obrigatório" stage={run.stage + 1}>
      <View style={styles.rewardLayout}>
        <View style={styles.rewardDirective}>
          <Text style={styles.kickerRed}>VITÓRIA REGISTRADA · DIFICULDADE ELEVADA</Text>
          <Text style={styles.runTitle}>Nova Diretriz</Text>
          {directive && <View style={styles.directiveLarge}><Text style={styles.directiveCode}>{directive.code}</Text><Text style={styles.directiveName}>{directive.name}</Text><Text style={styles.runText}>{directive.text}</Text><Text style={styles.directiveStamp}>CUMULATIVA</Text></View>}
        </View>
        <View style={styles.rewardCards}>
          <Text style={styles.fileLabel}>REQUISITE UMA CONTRAMEDIDA</Text>
          <SecretRow ids={run.offeredSecrets} action="Adicionar ao arsenal" onChoose={(secret) => void controller.send({ type: 'CHOOSE_REWARD_SECRET', secret })} compact />
        </View>
      </View>
    </RunShell>
  )
}

export function RunEndScreen({ won, controller }: { won: boolean; controller: GameSessionController }) {
  return (
    <View style={styles.endScreen}>
      <View style={[styles.report, won ? styles.reportWin : styles.reportLose]}>
        <Text style={styles.reportKicker}>INSTITUTO MEIA-VIDA · RELATÓRIO DE PLANTÃO CONTÍNUO</Text>
        <Text style={styles.runTitle}>{won ? 'Supervisor neutralizado' : 'Sequência encerrada'}</Text>
        <Text style={styles.runText}>{won ? 'Quatro setores concluídos. Sua Coerência permanece registrada e o turno da noite foi aprovado.' : 'A derrota apagou estágio, arsenal e Diretrizes. Três novos arquivos aguardam outra tentativa.'}</Text>
        <Text style={[styles.verdict, won ? styles.verdictWin : styles.verdictLose]}>{won ? 'PLANTÃO CUMPRIDO' : 'ARQUIVO REINICIADO'}</Text>
        <PaperButton label={won ? 'Novo Plantão' : 'Tentar novamente'} variant="stamp" onPress={() => void controller.send({ type: 'START_RUN' })} />
      </View>
    </View>
  )
}

function RunHeading({ kicker, title, text, stamp }: { kicker: string; title: string; text: string; stamp?: boolean }) {
  const compact = useWindowDimensions().height < 500
  return <View style={[styles.runHeading, compact && styles.runHeadingCompact]}><View style={styles.runHeadingCopy}><Text style={[styles.kickerRed, compact && styles.kickerRedCompact]}>{kicker}</Text><Text style={[styles.runTitle, compact && styles.runTitleCompact]}>{title}</Text><Text style={[styles.runText, compact && styles.runTextCompact]}>{text}</Text></View>{stamp && <Text style={[styles.choiceStamp, compact && styles.choiceStampCompact]}>UMA ESCOLHA{`\n`}SEM REVISÃO</Text>}</View>
}

function RunShell({ children, tab, stage }: { children: React.ReactNode; tab: string; stage: number }) {
  const compact = useWindowDimensions().height < 500
  return <View style={[styles.runScreen, compact && styles.runScreenCompact]}><View style={[styles.runFolder, compact && styles.runFolderCompact]}><Text style={[styles.runTab, compact && styles.runTabCompact]}>{tab}</Text><ShiftTrack stage={stage} compact={compact} /><View style={styles.runContent}>{children}</View></View></View>
}

function ShiftTrack({ stage, compact }: { stage: number; compact: boolean }) {
  return <View accessibilityLabel={`Duelo ${Math.min(4, stage + 1)} de 4`} style={[styles.track, compact && styles.trackCompact]}>{DUELS.map((duel, index) => <View key={duel} style={styles.trackItem}><View style={[styles.trackNumber, compact && styles.trackNumberCompact, index < stage && styles.trackDone, index === stage && styles.trackCurrent]}><Text style={[styles.trackNumberText, compact && styles.trackNumberTextCompact]}>{index + 1}</Text></View><Text style={[styles.trackLabel, compact && styles.trackLabelCompact]} numberOfLines={1}>{duel}</Text>{index < DUELS.length - 1 && <View style={[styles.trackLine, index < stage && styles.trackLineDone]} />}</View>)}</View>
}

function SecretRow({ ids, action, onChoose, compact }: { ids: SecretId[]; action: string; onChoose: (id: SecretId) => void; compact?: boolean }) {
  const dense = useWindowDimensions().height < 500
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.secretRow, dense && styles.secretRowDense]}>{ids.map((id) => <NativeSecretCard key={id} id={id} dense={dense && !compact} compact={compact} width={dense ? (compact ? 142 : 174) : compact ? 168 : 196} actionLabel={action} onPress={() => onChoose(id)} />)}</ScrollView>
}

function DirectiveList({ ids }: { ids: DirectiveId[] }) {
  if (ids.length === 0) return <Text style={styles.emptyDirective}>Nenhuma alteração hostil registrada.</Text>
  return <View style={styles.directiveList}>{ids.map((id) => { const def = getDirective(id); return <View key={id} style={styles.directiveTicket}><Text style={styles.directiveCode}>{def.code}</Text><Text style={styles.directiveTicketName}>{def.name}</Text><Text style={styles.directiveTicketText}>{def.text}</Text></View> })}</View>
}

function Fact({ label, value }: { label: string; value: string }) { return <View style={styles.fact}><Text style={styles.factLabel}>{label}</Text><Text style={styles.factValue}>{value}</Text></View> }

const styles = StyleSheet.create({
  titleScreen: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 28, paddingHorizontal: '6%', paddingVertical: 26, backgroundColor: colors.paper },
  titleScreenCompact: { gap: 18, paddingHorizontal: '4%', paddingVertical: 12 }, titleCopy: { flex: 1.15, maxWidth: 670 },
  kicker: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 9, letterSpacing: 2, lineHeight: 13 }, wordmark: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  word: { color: colors.ink, fontFamily: fonts.display, fontSize: 75, lineHeight: 82, letterSpacing: -6 }, wordCompact: { fontSize: 52, lineHeight: 58, letterSpacing: -4 }, particle: { color: colors.particle }, wave: { color: colors.wave },
  subtitle: { color: colors.ink, fontFamily: fonts.type, fontSize: 14, lineHeight: 20, marginBottom: 13 }, lore: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 11, lineHeight: 16, marginTop: 12 }, titleActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  castFile: { flex: 0.85, maxWidth: 470, padding: 13, backgroundColor: colors.paperCard, borderColor: colors.ink, borderWidth: 2, borderRadius: 5, transform: [{ rotate: '0.8deg' }], ...shadow }, fileTab: { color: colors.paperCard, fontFamily: fonts.display, fontSize: 8, letterSpacing: 0.8, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 5, backgroundColor: colors.ink },
  castGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 }, castSlot: { width: '31%', height: 85, overflow: 'hidden', backgroundColor: colors.paperDim, borderColor: colors.ink, borderWidth: 1.5 }, castImage: { flex: 1 }, castName: { color: colors.paperCard, fontFamily: fonts.display, fontSize: 7, paddingHorizontal: 4, paddingVertical: 3, backgroundColor: colors.ink }, confidential: { alignSelf: 'flex-end', color: colors.particle, fontFamily: fonts.display, fontSize: 12, borderColor: colors.particle, borderWidth: 2, padding: 5, marginTop: 8, transform: [{ rotate: '-5deg' }] }, titleSettings: { position: 'absolute', right: 12, top: 12 },
  runScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: colors.paper }, runScreenCompact: { padding: 6 }, runFolder: { width: '94%', maxWidth: 1180, height: '91%', padding: 20, paddingTop: 42, backgroundColor: colors.paperCard, borderColor: colors.ink, borderWidth: 3, borderRadius: 5, ...shadow }, runFolderCompact: { width: '96%', height: '94%', padding: 9, paddingTop: 25 }, runTab: { position: 'absolute', top: -18, left: 28, color: colors.paperCard, fontFamily: fonts.type, fontSize: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.ink, textTransform: 'uppercase' }, runTabCompact: { top: -10, left: 14, fontSize: 7, paddingHorizontal: 9, paddingVertical: 5 },
  track: { height: 42, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 8 }, trackCompact: { height: 28, marginBottom: 3 }, trackItem: { width: '23%', flexDirection: 'row', alignItems: 'center' }, trackNumber: { zIndex: 2, width: 27, height: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paperDim, borderColor: colors.inkSoft, borderWidth: 2, borderRadius: 15 }, trackNumberCompact: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5 }, trackDone: { backgroundColor: colors.approve, borderColor: colors.approve }, trackCurrent: { backgroundColor: colors.energy, borderColor: colors.ink }, trackNumberText: { color: colors.ink, fontFamily: fonts.display, fontSize: 9 }, trackNumberTextCompact: { fontSize: 7 }, trackLabel: { position: 'absolute', left: 0, top: 29, width: '88%', color: colors.inkSoft, fontFamily: fonts.type, fontSize: 7, textAlign: 'center' }, trackLabelCompact: { top: 20, fontSize: 5.5 }, trackLine: { flex: 1, height: 2, backgroundColor: colors.paperDeep }, trackLineDone: { backgroundColor: colors.approve }, runContent: { flex: 1 },
  runHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 10 }, runHeadingCompact: { gap: 8, marginBottom: 3 }, runHeadingCopy: { flex: 1 }, kickerRed: { color: colors.particle, fontFamily: fonts.type, fontSize: 8, letterSpacing: 1.2 }, kickerRedCompact: { fontSize: 6, letterSpacing: 0.7 }, runTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 27, lineHeight: 29, textTransform: 'uppercase', marginVertical: 6 }, runTitleCompact: { fontSize: 17, lineHeight: 18, marginVertical: 2 }, runText: { color: colors.ink, fontFamily: fonts.type, fontSize: 11, lineHeight: 16 }, runTextCompact: { fontSize: 8, lineHeight: 10 }, choiceStamp: { color: colors.particle, fontFamily: fonts.display, fontSize: 11, textAlign: 'center', borderColor: colors.particle, borderWidth: 2, padding: 8, transform: [{ rotate: '-5deg' }] }, choiceStampCompact: { fontSize: 7, padding: 4 }, secretRow: { flexGrow: 1, justifyContent: 'center', gap: 13, paddingHorizontal: 5, paddingVertical: 7 }, secretRowDense: { gap: 6, paddingHorizontal: 2, paddingVertical: 2 },
  briefing: { flex: 1, flexDirection: 'row', gap: 28 }, briefingMain: { flex: 1.4, justifyContent: 'center' }, briefingFile: { flex: 0.8, gap: 10, padding: 14, backgroundColor: colors.paperDim, borderColor: colors.inkSoft, borderWidth: 1 }, facts: { flexDirection: 'row', gap: 9, marginVertical: 15 }, fact: { minWidth: 105, padding: 9, borderColor: colors.inkSoft, borderWidth: 1 }, factLabel: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 7 }, factValue: { color: colors.approve, fontFamily: fonts.display, fontSize: 22 }, fileLabel: { color: colors.particle, fontFamily: fonts.display, fontSize: 9, letterSpacing: 0.8 }, directiveList: { gap: 7 }, emptyDirective: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 10 }, directiveTicket: { padding: 7, backgroundColor: colors.paperCard, borderLeftColor: colors.particle, borderLeftWidth: 3 }, directiveCode: { color: colors.particle, fontFamily: fonts.type, fontSize: 7 }, directiveTicketName: { color: colors.ink, fontFamily: fonts.display, fontSize: 9, textTransform: 'uppercase' }, directiveTicketText: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 8, lineHeight: 11 },
  rewardLayout: { flex: 1, flexDirection: 'row', gap: 20 }, rewardDirective: { flex: 0.75, justifyContent: 'center' }, rewardCards: { flex: 1.25, gap: 7 }, directiveLarge: { padding: 14, backgroundColor: colors.paperDim, borderColor: colors.ink, borderWidth: 2, transform: [{ rotate: '-0.5deg' }] }, directiveName: { color: colors.ink, fontFamily: fonts.display, fontSize: 18, textTransform: 'uppercase', marginVertical: 4 }, directiveStamp: { alignSelf: 'flex-end', color: colors.particle, fontFamily: fonts.display, fontSize: 9, borderColor: colors.particle, borderWidth: 2, padding: 4, transform: [{ rotate: '-5deg' }] },
  endScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }, report: { width: '70%', maxWidth: 720, padding: 30, backgroundColor: colors.paperCard, borderColor: colors.ink, borderWidth: 3, transform: [{ rotate: '-0.8deg' }], ...shadow }, reportWin: { borderTopColor: colors.approve, borderTopWidth: 8 }, reportLose: { borderTopColor: colors.particle, borderTopWidth: 8 }, reportKicker: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 8, letterSpacing: 1.2 }, verdict: { alignSelf: 'flex-end', fontFamily: fonts.display, fontSize: 13, borderWidth: 3, padding: 7, marginVertical: 16, transform: [{ rotate: '6deg' }] }, verdictWin: { color: colors.approve, borderColor: colors.approve }, verdictLose: { color: colors.particle, borderColor: colors.particle },
})
