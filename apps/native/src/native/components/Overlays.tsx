import { getDef, getSecret, type HandCard, type Keyword, type Owner, type SecretId } from '@colapso/game-core'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, shadow } from '../theme'
import { NativeCard } from './Card'
import { PaperButton } from './Controls'
import { NativeSecretCard } from './SecretCard'

interface SheetProps {
  visible: boolean
  title: string
  kicker?: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}

export function PaperSheet({ visible, title, kicker, onClose, children, wide }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" supportedOrientations={['landscape']} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Fechar" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, wide && styles.sheetWide]}>
          <Text style={styles.kicker}>{kicker ?? 'instituto meia-vida · consulta autorizada'}</Text>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.sheetBody}>{children}</View>
          <PaperButton label="Fechar arquivo" onPress={onClose} compact />
        </View>
      </View>
    </Modal>
  )
}

export function CardInspector({
  card,
  visible,
  canPlay,
  onClose,
  onPlay,
  onKeyword,
}: {
  card: HandCard | null
  visible: boolean
  canPlay: boolean
  onClose: () => void
  onPlay: () => void
  onKeyword: (keyword: Keyword) => void
}) {
  if (!card) return null
  const def = getDef(card.defId)
  return (
    <Modal visible={visible} transparent animationType="fade" supportedOrientations={['landscape']} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Voltar para a mão" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.cardInspection}>
          <NativeCard defId={card.defId} width={176} height={248} mode="detail" onKeywordPress={onKeyword} />
          <View style={styles.inspectCopy}>
            <Text style={styles.kicker}>ficha selecionada · custo {def.cost} qubit{def.cost === 1 ? '' : 's'}</Text>
            <Text style={styles.inspectTitle}>{def.name}</Text>
            <Text style={styles.inspectText}>{def.type === 'criatura' ? 'Este sujeito entra em superposição e se decide quando for observado ou entrar em combate.' : 'Este Protocolo resolve seu efeito e vai para o descarte.'}</Text>
            <View style={styles.inspectActions}>
              <PaperButton label="Voltar" onPress={onClose} compact />
              <PaperButton
                label={canPlay ? 'Jogar ficha' : 'Qubits insuficientes'}
                onPress={onPlay}
                variant="stamp"
                disabled={!canPlay}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export function SecretInspector({ id, used, visible, onClose }: { id: SecretId | null; used: boolean; visible: boolean; onClose: () => void }) {
  if (!id) return null
  const def = getSecret(id)
  return (
    <PaperSheet visible={visible} title={def.name} kicker={used ? 'arquivo utilizado · efeito consumido' : 'seu arquivo de segurança · armado'} onClose={onClose}>
      <View style={styles.secretInspect}>
        <NativeSecretCard id={id} used={used} />
        <View style={styles.secretCopy}>
          <Text style={styles.subheading}>QUANDO DISPARA</Text>
          <Text style={styles.paragraph}>{def.trigger}</Text>
          <Text style={styles.subheading}>O QUE ACONTECE</Text>
          <Text style={styles.paragraph}>{def.text}</Text>
          {used && <Text style={styles.usedNote}>Permanece no painel para consulta, mas não pode disparar novamente neste duelo.</Text>}
        </View>
      </View>
    </PaperSheet>
  )
}

const manualSections = [
  {
    title: '1 · Seu plantão',
    text: 'Você é o Observador humano do Instituto Meia-Vida. Seu objetivo é reduzir a Coerência do Autômato a zero antes que ele faça o mesmo com você.',
  },
  {
    title: '2 · Qubits e fichas',
    text: 'Qubits são sua energia. Você começa com 2 e seu máximo aumenta em 1 a cada turno, até 8. No começo do turno, o Arquivo compra fichas até sua mão voltar a 5.',
  },
  {
    title: '3 · Sujeitos e superposição',
    text: 'Sujeitos são as fichas que permanecem na bancada. Cada um entra em superposição: os estados A e B existem ao mesmo tempo, mas nenhum está ativo ainda.',
  },
  {
    title: '4 · Colapso e combate',
    text: 'Ao atacar, ser atacado ou sofrer uma medição, o sujeito colapsa e apenas A ou B fica ativo. Em combate, os dois sujeitos causam dano ao mesmo tempo. Um ataque direto reduz a Coerência.',
  },
  {
    title: '5 · Observar',
    text: 'Uma vez por turno, gaste 2 qubits para escolher A ou B de qualquer sujeito em superposição. O estado desejado tem 75% de chance; o outro, 25%.',
  },
  {
    title: '6 · Protocolos e palavras-chave',
    text: 'Protocolos têm efeito imediato. Barreira precisa ser atacada primeiro; Oscilação troca o estado após sobreviver a um combate; Fantasma ignora Barreira e, quando concedido por Túnel, fica intangível até o próximo turno.',
  },
  {
    title: '7 · Contramedidas e Plantão',
    text: 'Cada lado leva uma Contramedida que dispara uma vez. A inimiga é secreta até ativar. Vença três setores e o Supervisor; entre vitórias, novas Diretrizes fortalecem o Autômato e seu arsenal cresce.',
  },
]

export function ManualSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <PaperSheet visible={visible} title="Manual do Observador" kicker="leitura rápida · tudo que decide uma partida" onClose={onClose} wide>
      <ScrollView contentContainerStyle={styles.manual} showsVerticalScrollIndicator={false}>
        {manualSections.map((section) => (
          <View key={section.title} style={styles.manualItem}>
            <Text style={styles.subheading}>{section.title}</Text>
            <Text style={styles.paragraph}>{section.text}</Text>
          </View>
        ))}
      </ScrollView>
    </PaperSheet>
  )
}

export function KeywordSheet({ keyword, onClose }: { keyword: Keyword | null; onClose: () => void }) {
  const content: Record<Keyword, { title: string; text: string }> = {
    barreira: { title: 'Barreira', text: 'Enquanto este estado estiver ativo, o adversário precisa atacar sujeitos com Barreira antes dos outros alvos.' },
    oscilacao: { title: 'Oscilação', text: 'Se sobreviver a um combate, o sujeito muda para seu outro estado. A vida perdida não é recuperada.' },
    fantasma: { title: 'Fantasma', text: 'Pode ignorar Barreira. Quando concedido pelo Túnel Quântico, também pode atacar imediatamente e fica protegido de ataques até o próximo turno.' },
  }
  if (!keyword) return null
  return (
    <PaperSheet visible title={content[keyword].title} onClose={onClose}>
      <Text style={styles.paragraph}>{content[keyword].text}</Text>
    </PaperSheet>
  )
}

export function HeroInfoSheet({ owner, visible, onClose }: { owner: Owner | null; visible: boolean; onClose: () => void }) {
  if (!owner) return null
  const ai = owner === 'ai'
  return (
    <PaperSheet visible={visible} title={ai ? 'Autômato' : 'Observador'} onClose={onClose}>
      <Text style={styles.paragraph}>
        {ai
          ? 'A Coerência é a vida do Autômato. Qubits são sua energia do turno, e Mão indica quantas fichas ele pode usar. A identidade da Contramedida permanece secreta até disparar.'
          : 'Sua Coerência é sua vida. Qubits são a energia disponível neste turno; o máximo aumenta até 8. Toque em sua Contramedida para consultar a estratégia.'}
      </Text>
    </PaperSheet>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(31,27,23,0.67)' },
  sheet: {
    width: '72%',
    maxWidth: 720,
    maxHeight: '90%',
    padding: 22,
    backgroundColor: colors.paperCard,
    borderColor: colors.ink,
    borderWidth: 3,
    borderRadius: 5,
    ...shadow,
  },
  sheetWide: { width: '88%', maxWidth: 980 },
  kicker: { color: colors.particle, fontFamily: fonts.type, fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase' },
  title: { color: colors.ink, fontFamily: fonts.display, fontSize: 26, lineHeight: 28, marginTop: 7, marginBottom: 14, textTransform: 'uppercase' },
  sheetBody: { flexShrink: 1, marginBottom: 16 },
  cardInspection: {
    width: 570,
    maxWidth: '94%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    padding: 20,
    backgroundColor: colors.paper,
    borderColor: colors.ink,
    borderWidth: 3,
    borderRadius: 5,
    ...shadow,
  },
  inspectCopy: { flex: 1, gap: 12 },
  inspectTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 27, textTransform: 'uppercase' },
  inspectText: { color: colors.ink, fontFamily: fonts.type, fontSize: 12, lineHeight: 17 },
  inspectActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  secretInspect: { flexDirection: 'row', gap: 22 },
  secretCopy: { flex: 1, justifyContent: 'center', gap: 7 },
  subheading: { color: colors.particle, fontFamily: fonts.display, fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase' },
  paragraph: { color: colors.ink, fontFamily: fonts.type, fontSize: 12, lineHeight: 17 },
  usedNote: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 10, lineHeight: 14, marginTop: 9 },
  manual: { flexDirection: 'row', flexWrap: 'wrap', gap: 13, paddingBottom: 6 },
  manualItem: { width: '48%', minWidth: 250, padding: 12, borderColor: colors.inkFaint, borderWidth: 1, backgroundColor: colors.paper },
})
