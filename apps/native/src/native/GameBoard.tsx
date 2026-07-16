import {
  canPlay,
  findCreature,
  getDef,
  type Creature,
  type GameState,
  type HandCard,
  type Keyword,
  type Owner,
  type SecretId,
} from '@colapso/game-core'
import {
  targetKey,
  useGameSession,
  validTargetKeys,
  type GameCommand,
  type GameSessionController,
  type PresentationCue,
} from '@colapso/game-session'
import * as Haptics from 'expo-haptics'
import { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useSfx } from './audio'
import { NativeCard } from './components/Card'
import { CueHost } from './components/CueHost'
import { PaperButton, RoundButton } from './components/Controls'
import { HeroPanel } from './components/HeroPanel'
import { MemoHost } from './components/MemoHost'
import {
  CardInspector,
  HeroInfoSheet,
  KeywordSheet,
  ManualSheet,
  PaperSheet,
  SecretInspector,
} from './components/Overlays'
import { useNativeSettings } from './settings'
import { colors, fonts, responsiveMetrics, shadow } from './theme'

interface BoardProps {
  controller: GameSessionController
  onOpenSettings: () => void
}

export function NativeGameBoard({ controller, onOpenSettings }: BoardProps) {
  const state = useGameSession(controller)
  const { width, height } = useWindowDimensions()
  const metrics = responsiveMetrics(height)
  const [handOpen, setHandOpen] = useState(true)
  const [inspectedHand, setInspectedHand] = useState<HandCard | null>(null)
  const [inspectedCreature, setInspectedCreature] = useState<number | null>(null)
  const [keyword, setKeyword] = useState<Keyword | null>(null)
  const [secret, setSecret] = useState<{ id: SecretId; used: boolean } | null>(null)
  const [heroInfo, setHeroInfo] = useState<Owner | null>(null)
  const [manual, setManual] = useState(false)
  const { play } = useSfx()
  const { haptics } = useNativeSettings()
  const activeCue = state.cues[0]
  const valid = useMemo(() => validTargetKeys(state), [state])

  const send = useCallback((command: GameCommand) => void controller.send(command), [controller])
  const selectHand = (card: HandCard) => {
    setInspectedHand(card)
    play('select')
    if (haptics) void Haptics.selectionAsync()
  }
  const playInspected = () => {
    if (!inspectedHand) return
    const uid = inspectedHand.uid
    setInspectedHand(null)
    send({ type: 'PLAY_CARD', handUid: uid })
  }
  const inspectedDef = inspectedHand ? getDef(inspectedHand.defId) : null
  const canPlayInspected = !!inspectedHand && canPlay(state.game, 'player', inspectedHand.uid)

  const selectionHint = selectionLabel(state.selection)
  const inspectedBoard = inspectedCreature ? findCreature(state.game, inspectedCreature) : null

  return (
    <View style={styles.root}>
      <View style={[styles.topRail, { paddingHorizontal: metrics.gutter }]}> 
        <HeroPanel
          owner="ai"
          game={state.game}
          compact={metrics.compact}
          cue={activeCue}
          validTarget={valid.has('hero-ai')}
          onTarget={() => send({ type: 'SELECT_HERO', owner: 'ai' })}
          onInfo={() => setHeroInfo('ai')}
          onSecret={(id, used) => setSecret({ id, used })}
        />
        <View style={styles.topActions}>
          <RoundButton label="Abrir manual" glyph="?" onPress={() => setManual(true)} />
          <RoundButton label="Abrir ajustes" glyph="S" onPress={onOpenSettings} />
        </View>
      </View>

      <View style={[styles.playfieldWrap, { top: metrics.heroHeight + metrics.gutter, bottom: metrics.heroHeight + metrics.gutter }]}> 
        <EntangledPlayfield
          game={state.game}
          cue={activeCue}
          selectedUid={state.selection?.type === 'attacker' ? state.selection.uid : null}
          valid={valid}
          cardWidth={metrics.boardCardWidth}
          cardHeight={metrics.boardCardHeight}
          onCreature={(uid) => send({ type: 'SELECT_CREATURE', uid })}
          onInfo={setInspectedCreature}
          onKeyword={setKeyword}
        />
        <View style={styles.turnControls}>
          {state.selection && (
            <PaperButton label="Cancelar" compact variant="quiet" onPress={() => send({ type: 'CANCEL_SELECTION' })} />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Encerrar turno"
            disabled={state.busy || state.game.active !== 'player'}
            onPress={() => send({ type: 'END_TURN' })}
            style={({ pressed }) => [styles.endTurn, (state.busy || state.game.active !== 'player') && styles.endTurnDisabled, pressed && styles.endTurnPressed]}
          >
            <Text style={styles.endTurnText}>ENCERRAR{`\n`}TURNO</Text>
          </Pressable>
        </View>
        <View style={styles.piles}>
          <Pile label="ARQUIVO" count={state.game.sides.player.deck.length} />
          <Pile label="DESCARTE" count={state.game.sides.player.discard.length} />
        </View>
      </View>

      <View style={[styles.bottomRail, { paddingHorizontal: metrics.gutter }]}> 
        <HeroPanel
          owner="player"
          game={state.game}
          compact={metrics.compact}
          cue={activeCue}
          onInfo={() => setHeroInfo('player')}
          onSecret={(id, used) => setSecret({ id, used })}
        />
        <View style={styles.observeWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Observar um sujeito"
            accessibilityHint="Custa 2 qubits e pode ser usado uma vez por turno"
            onPress={() => send({ type: 'TOGGLE_HERO_POWER' })}
            disabled={state.busy || state.game.active !== 'player'}
            style={({ pressed }) => [styles.observe, state.selection?.type === 'heropower' && styles.observeActive, pressed && styles.endTurnPressed]}
          >
            <Text style={styles.observeEye}>◉</Text>
            <Text style={styles.observeText}>OBSERVAR</Text>
            <Text style={styles.observeCost}>2Q</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.handToggle, { bottom: metrics.heroHeight + 2 }]}> 
        <PaperButton
          compact
          label={handOpen ? `Ocultar mão (${state.game.sides.player.hand.length})` : `Mostrar mão (${state.game.sides.player.hand.length})`}
          onPress={() => setHandOpen((open) => !open)}
        />
      </View>

      {handOpen && (
        <View style={[styles.handTray, { bottom: metrics.heroHeight + 2, height: metrics.handCardHeight + 22 }]}> 
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.handContent}>
            {state.game.sides.player.hand.map((card, index) => (
              <View key={card.uid} style={[styles.handCard, index > 0 && { marginLeft: metrics.compact ? -18 : -12 }]}>
                <NativeCard
                  defId={card.defId}
                  width={metrics.handCardWidth}
                  height={metrics.handCardHeight}
                  mode="hand"
                  disabled={state.busy}
                  onPress={() => selectHand(card)}
                  onKeywordPress={setKeyword}
                />
              </View>
            ))}
          </ScrollView>
          <Text style={styles.trayLabel}>BANDEJA DO OBSERVADOR · TOQUE PARA EXAMINAR</Text>
        </View>
      )}

      {selectionHint && <View pointerEvents="none" style={styles.selectionHint}><Text style={styles.selectionHintText}>{selectionHint}</Text></View>}

      <FaceChoice selection={state.selection} game={state.game} onChoose={(face) => send({ type: 'CHOOSE_FACE', face })} onCancel={() => send({ type: 'CANCEL_SELECTION' })} />
      <CardInspector
        card={inspectedHand}
        visible={!!inspectedHand}
        canPlay={canPlayInspected}
        onClose={() => setInspectedHand(null)}
        onPlay={playInspected}
        onKeyword={setKeyword}
      />
      <SecretInspector id={secret?.id ?? null} used={secret?.used ?? false} visible={!!secret} onClose={() => setSecret(null)} />
      <KeywordSheet keyword={keyword} onClose={() => setKeyword(null)} />
      <HeroInfoSheet owner={heroInfo} visible={!!heroInfo} onClose={() => setHeroInfo(null)} />
      <ManualSheet visible={manual} onClose={() => setManual(false)} />
      <PaperSheet visible={!!inspectedBoard} title={inspectedBoard ? getDef(inspectedBoard.defId).name : ''} onClose={() => setInspectedCreature(null)}>
        {inspectedBoard && (
          <View style={styles.boardInspect}>
            <NativeCard defId={inspectedBoard.defId} creature={inspectedBoard} width={156} height={220} mode="detail" onKeywordPress={setKeyword} />
            <View style={styles.boardInspectCopy}>
              <Text style={styles.boardInspectTitle}>{getDef(inspectedBoard.defId).title}</Text>
              <Text style={styles.boardInspectText}>{getDef(inspectedBoard.defId).bio}</Text>
              <Text style={styles.boardInspectText}>{inspectedBoard.collapsed === null ? 'Ainda está em superposição.' : `Estado ${inspectedBoard.collapsed === 0 ? 'A' : 'B'} ativo · ${inspectedBoard.hp} de Vida restante.`}</Text>
            </View>
          </View>
        )}
      </PaperSheet>

      <MemoHost cue={activeCue} />
      <CueHost cue={activeCue} acknowledge={(id) => send({ type: 'ACK_PRESENTATION', id })} />
    </View>
  )
}

function EntangledPlayfield({
  game,
  cue,
  selectedUid,
  valid,
  cardWidth,
  cardHeight,
  onCreature,
  onInfo,
  onKeyword,
}: {
  game: GameState
  cue?: PresentationCue
  selectedUid: number | null
  valid: Set<string>
  cardWidth: number
  cardHeight: number
  onCreature: (uid: number) => void
  onInfo: (uid: number) => void
  onKeyword: (keyword: Keyword) => void
}) {
  const [laneLayouts, setLaneLayouts] = useState<Partial<Record<Owner, Box>>>({})
  const [cardLayouts, setCardLayouts] = useState<Partial<Record<number, Box>>>({})
  const pairs = useMemo(() => {
    const found: Array<[number, number]> = []
    for (const creature of [...game.board.ai, ...game.board.player]) {
      if (creature.entangledWith !== null && creature.uid < creature.entangledWith) found.push([creature.uid, creature.entangledWith])
    }
    return found
  }, [game.board.ai, game.board.player])

  const setLane = (owner: Owner, event: LayoutChangeEvent) => {
    const layout = event.nativeEvent.layout
    setLaneLayouts((current) => updateBox(current, owner, layout))
  }
  const setCard = (uid: number, event: LayoutChangeEvent) => {
    const layout = event.nativeEvent.layout
    setCardLayouts((current) => updateBox(current, uid, layout))
  }
  const position = (uid: number) => {
    const creature = findCreature(game, uid)
    if (!creature) return null
    const lane = laneLayouts[creature.owner]
    const card = cardLayouts[uid]
    if (!lane || !card) return null
    return { x: lane.x + card.x + card.width / 2, y: lane.y + card.y + card.height / 2 }
  }

  return (
    <View style={styles.playfield}>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
        {pairs.map(([a, b]) => {
          const from = position(a)
          const to = position(b)
          if (!from || !to) return null
          const bend = Math.max(18, Math.abs(to.y - from.y) * 0.24)
          return <Path key={`${a}-${b}`} d={`M${from.x} ${from.y} C${from.x + bend} ${from.y + bend}, ${to.x - bend} ${to.y - bend}, ${to.x} ${to.y}`} fill="none" stroke={colors.entangle} strokeWidth={3} strokeDasharray="7 4" />
        })}
      </Svg>
      <BoardLane
        owner="ai"
        creatures={game.board.ai}
        cue={cue}
        selectedUid={selectedUid}
        valid={valid}
        width={cardWidth}
        height={cardHeight}
        onLayout={(event) => setLane('ai', event)}
        onCardLayout={setCard}
        onCreature={onCreature}
        onInfo={onInfo}
        onKeyword={onKeyword}
      />
      <BoardLane
        owner="player"
        creatures={game.board.player}
        cue={cue}
        selectedUid={selectedUid}
        valid={valid}
        width={cardWidth}
        height={cardHeight}
        onLayout={(event) => setLane('player', event)}
        onCardLayout={setCard}
        onCreature={onCreature}
        onInfo={onInfo}
        onKeyword={onKeyword}
      />
    </View>
  )
}

interface Box { x: number; y: number; width: number; height: number }
function updateBox<T extends string | number>(current: Record<T, Box> | Partial<Record<T, Box>>, key: T, next: Box) {
  const old = current[key]
  if (old && old.x === next.x && old.y === next.y && old.width === next.width && old.height === next.height) return current
  return { ...current, [key]: next }
}

function BoardLane({
  owner,
  creatures,
  cue,
  selectedUid,
  valid,
  width,
  height,
  onLayout,
  onCardLayout,
  onCreature,
  onInfo,
  onKeyword,
}: {
  owner: Owner
  creatures: Creature[]
  cue?: PresentationCue
  selectedUid: number | null
  valid: Set<string>
  width: number
  height: number
  onLayout: (event: LayoutChangeEvent) => void
  onCardLayout: (uid: number, event: LayoutChangeEvent) => void
  onCreature: (uid: number) => void
  onInfo: (uid: number) => void
  onKeyword: (keyword: Keyword) => void
}) {
  return (
    <View onLayout={onLayout} style={styles.lane} accessibilityLabel={owner === 'ai' ? 'Bancada do Autômato' : 'Sua bancada'}>
      <Text style={styles.laneLabel}>{owner === 'ai' ? 'BANCADA DO AUTÔMATO' : 'SUA BANCADA'}</Text>
      <View style={styles.laneCards}>
        {creatures.map((creature) => (
          <View key={creature.uid} onLayout={(event) => onCardLayout(creature.uid, event)} style={styles.boardCardWrap}>
            <NativeCard
              defId={creature.defId}
              creature={creature}
              cue={cue}
              width={width}
              height={height}
              mode="board"
              selected={selectedUid === creature.uid}
              validTarget={valid.has(targetKey({ kind: 'creature', uid: creature.uid }))}
              onPress={() => onCreature(creature.uid)}
              onKeywordPress={onKeyword}
            />
            <Pressable accessibilityRole="button" accessibilityLabel={`Consultar ${getDef(creature.defId).name}`} onPress={() => onInfo(creature.uid)} style={styles.cardInfo} hitSlop={4}>
              <Text style={styles.cardInfoText}>i</Text>
            </Pressable>
          </View>
        ))}
        {creatures.length === 0 && <Text style={styles.emptyLane}>ÁREA DESOCUPADA</Text>}
      </View>
    </View>
  )
}

function FaceChoice({ selection, game, onChoose, onCancel }: { selection: ReturnType<GameSessionController['getSnapshot']>['selection']; game: GameState; onChoose: (face: 0 | 1) => void; onCancel: () => void }) {
  if (!selection || !['influenceFace', 'measureFace', 'polarizeFace'].includes(selection.type)) return null
  const targetUid = 'targetUid' in selection ? selection.targetUid : -1
  const creature = findCreature(game, targetUid)
  if (!creature) return null
  const def = getDef(creature.defId)
  const probabilistic = selection.type === 'influenceFace'
  return (
    <View style={styles.faceChoice}>
      <Text style={styles.faceChoiceKicker}>{probabilistic ? 'influência quântica' : 'colapso controlado'}</Text>
      <Text style={styles.faceChoiceTitle}>Escolha o estado de {def.name}</Text>
      <View style={styles.faceActions}>
        {def.faces?.map((face, index) => (
          <Pressable key={face.label} accessibilityRole="button" accessibilityLabel={`Escolher estado ${index === 0 ? 'A' : 'B'}, ${face.label}`} onPress={() => onChoose(index as 0 | 1)} style={[styles.faceButton, index === 0 ? styles.faceA : styles.faceB]}>
            <Text style={styles.faceLetter}>{index === 0 ? 'A' : 'B'}</Text>
            <View><Text style={styles.faceLabel}>{face.label}</Text><Text style={styles.faceChance}>{probabilistic ? '75% desejado · 25% oposto' : '100% garantido'}</Text></View>
          </Pressable>
        ))}
      </View>
      <PaperButton label="Cancelar" compact variant="quiet" onPress={onCancel} />
    </View>
  )
}

function Pile({ label, count }: { label: string; count: number }) {
  return <View style={styles.pile}><Text style={styles.pileCount}>{count}</Text><Text style={styles.pileLabel}>{label}</Text></View>
}

function selectionLabel(selection: ReturnType<GameSessionController['getSnapshot']>['selection']) {
  if (!selection) return null
  switch (selection.type) {
    case 'attacker': return 'ESCOLHA UM ALVO DESTACADO · TOQUE NO PAINEL INIMIGO PARA ATAQUE DIRETO'
    case 'spell': return selection.spell === 'emaranhar' && selection.collected.length === 0 ? 'ESCOLHA PRIMEIRO UM SUJEITO SEU' : 'ESCOLHA UM ALVO DESTACADO'
    case 'heropower': return 'ESCOLHA QUALQUER SUJEITO EM SUPERPOSIÇÃO'
    default: return null
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: colors.paper },
  topRail: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bottomRail: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  topActions: { flexDirection: 'row', gap: 9, paddingTop: 4 },
  playfieldWrap: { position: 'absolute', left: 0, right: 0 },
  playfield: { flex: 1, paddingHorizontal: 36, paddingRight: 120 },
  lane: { flex: 1, minHeight: 100, borderColor: colors.inkSoft, borderWidth: 1, borderStyle: 'dashed', marginVertical: 3, borderRadius: 8 },
  laneLabel: { position: 'absolute', left: 5, top: 8, color: colors.inkSoft, fontFamily: fonts.type, fontSize: 7, letterSpacing: 1, transform: [{ rotate: '-90deg' }] },
  laneCards: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, paddingHorizontal: 24 },
  emptyLane: { color: colors.inkFaint, fontFamily: fonts.type, fontSize: 9, letterSpacing: 2 },
  boardCardWrap: { position: 'relative' },
  cardInfo: { position: 'absolute', top: 1, right: 1, width: 25, height: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paperCard, borderColor: colors.ink, borderWidth: 1.5, borderRadius: 14 },
  cardInfoText: { color: colors.ink, fontFamily: fonts.display, fontSize: 10 },
  turnControls: { position: 'absolute', right: 9, top: '34%', zIndex: 8, alignItems: 'center', gap: 8 },
  endTurn: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.energy, borderColor: colors.ink, borderWidth: 3, borderRadius: 48, ...shadow },
  endTurnDisabled: { opacity: 0.38 },
  endTurnPressed: { transform: [{ translateY: 2 }], shadowOffset: { width: 1, height: 1 } },
  endTurnText: { color: colors.ink, fontFamily: fonts.display, fontSize: 11, letterSpacing: 1.2, textAlign: 'center' },
  piles: { position: 'absolute', right: 15, bottom: 3, flexDirection: 'row', gap: 7 },
  pile: { width: 45, height: 54, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paperDim, borderColor: colors.ink, borderWidth: 2, borderRadius: 4 },
  pileCount: { color: colors.ink, fontFamily: fonts.display, fontSize: 17 },
  pileLabel: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 6 },
  observeWrap: { paddingRight: 8 },
  observe: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.confidential, borderColor: colors.entangle, borderWidth: 4, borderRadius: 40, ...shadow },
  observeActive: { borderColor: colors.energy, transform: [{ scale: 1.06 }] },
  observeEye: { color: colors.paperCard, fontSize: 22, lineHeight: 23 },
  observeText: { color: colors.paperCard, fontFamily: fonts.type, fontSize: 8 },
  observeCost: { position: 'absolute', top: -5, right: -5, color: colors.ink, fontFamily: fonts.display, fontSize: 9, backgroundColor: colors.energy, paddingHorizontal: 5, paddingVertical: 4, borderRadius: 13 },
  handToggle: { position: 'absolute', left: '42%', zIndex: 42 },
  handTray: { position: 'absolute', left: '28%', right: '16%', zIndex: 40, paddingTop: 5, backgroundColor: 'rgba(241,235,221,0.94)', borderTopColor: colors.inkSoft, borderTopWidth: 1 },
  handContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },
  handCard: { ...shadow },
  trayLabel: { position: 'absolute', bottom: 2, alignSelf: 'center', color: colors.inkSoft, fontFamily: fonts.type, fontSize: 6, letterSpacing: 1 },
  selectionHint: { position: 'absolute', zIndex: 50, top: 7, left: '32%', right: '25%', alignItems: 'center' },
  selectionHintText: { color: colors.paperCard, fontFamily: fonts.display, fontSize: 9, letterSpacing: 0.6, textAlign: 'center', backgroundColor: colors.ink, paddingHorizontal: 11, paddingVertical: 6 },
  faceChoice: { position: 'absolute', zIndex: 60, alignSelf: 'center', top: '26%', width: 520, maxWidth: '85%', padding: 18, alignItems: 'center', backgroundColor: colors.paperCard, borderColor: colors.ink, borderWidth: 3, borderRadius: 5, ...shadow },
  faceChoiceKicker: { color: colors.particle, fontFamily: fonts.type, fontSize: 8, letterSpacing: 1.3, textTransform: 'uppercase' },
  faceChoiceTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 18, marginTop: 5, textTransform: 'uppercase' },
  faceActions: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  faceButton: { minWidth: 195, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, borderColor: colors.ink, borderWidth: 2, borderRadius: 4 },
  faceA: { backgroundColor: '#F6DDD7' },
  faceB: { backgroundColor: '#D3ECEE' },
  faceLetter: { color: colors.paperCard, fontFamily: fonts.display, fontSize: 18, backgroundColor: colors.ink, paddingHorizontal: 9, paddingVertical: 5 },
  faceLabel: { color: colors.ink, fontFamily: fonts.display, fontSize: 11, textTransform: 'uppercase' },
  faceChance: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 8, marginTop: 3 },
  boardInspect: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  boardInspectCopy: { flex: 1, gap: 10 },
  boardInspectTitle: { color: colors.particle, fontFamily: fonts.display, fontSize: 13, textTransform: 'uppercase' },
  boardInspectText: { color: colors.ink, fontFamily: fonts.type, fontSize: 11, lineHeight: 16 },
})
