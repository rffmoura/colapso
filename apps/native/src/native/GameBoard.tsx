import {
  HERO_POWER_COST,
  attackReadiness,
  canAttack,
  canPlay,
  findCreature,
  getDef,
  validAttackTargets,
  type Creature,
  type GameState,
  type HandCard,
  type Keyword,
  type Owner,
  type SecretId,
  type AttackReadiness,
  type TargetRef,
} from '@colapso/game-core'
import {
  targetKey,
  useGameSession,
  validTargetKeys,
  type GameCommand,
  type GameSessionController,
  type PresentationCue,
  type SessionSelection,
} from '@colapso/game-session'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { useSfx } from './audio'
import { NativeCard } from './components/Card'
import { CueHost, type PresentationGeometry } from './components/CueHost'
import { RoundButton } from './components/Controls'
import { HeroPanel } from './components/HeroPanel'
import { MemoHost } from './components/MemoHost'
import { TargetingLayer, type TargetFrame, type TargetingMotion } from './components/TargetingLayer'
import {
  HeroInfoSheet,
  KeywordSheet,
  ManualSheet,
  PaperSheet,
  SecretInspector,
} from './components/Overlays'
import { useNativeSettings } from './settings'
import { colors, fonts, responsiveMetrics, shadow } from './theme'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface BoardProps {
  controller: GameSessionController
  onOpenSettings: () => void
}

const HERO_AI_TARGET_ID = -1
const PLAYFIELD_DROP_ID = -100

function targetId(target: TargetRef) {
  if (target.kind === 'creature') return target.uid
  return target.owner === 'ai' ? HERO_AI_TARGET_ID : -2
}

function useTargetingMotion(): TargetingMotion {
  const active = useSharedValue(0)
  const sourceUid = useSharedValue(0)
  const startX = useSharedValue(0)
  const startY = useSharedValue(0)
  const endX = useSharedValue(0)
  const endY = useSharedValue(0)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const hoverId = useSharedValue(0)
  const valid = useSharedValue(0)
  const eligibleIds = useSharedValue<number[]>([])
  const rootX = useSharedValue(0)
  const rootY = useSharedValue(0)
  const targets = useSharedValue<TargetFrame[]>([])

  return useMemo(() => ({
    active,
    sourceUid,
    startX,
    startY,
    endX,
    endY,
    translateX,
    translateY,
    hoverId,
    valid,
    eligibleIds,
    rootX,
    rootY,
    targets,
  }), [active, eligibleIds, endX, endY, hoverId, rootX, rootY, sourceUid, startX, startY, targets, translateX, translateY, valid])
}

export function NativeGameBoard({ controller, onOpenSettings }: BoardProps) {
  const state = useGameSession(controller)
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const metrics = responsiveMetrics(height, width)
  const contentBottomInset = metrics.compact ? Math.min(insets.bottom, 8) : insets.bottom
  const [handOpen, setHandOpen] = useState(true)
  const [selectedHandUid, setSelectedHandUid] = useState<number | null>(null)
  const [inspectedCreature, setInspectedCreature] = useState<number | null>(null)
  const [keyword, setKeyword] = useState<Keyword | null>(null)
  const [secret, setSecret] = useState<{ id: SecretId; used: boolean } | null>(null)
  const [heroInfo, setHeroInfo] = useState<Owner | null>(null)
  const [manual, setManual] = useState(false)
  const { play } = useSfx()
  const { haptics } = useNativeSettings()
  const activeCue = state.cues[0]
  const activeDrawOwner = activeCue?.kind === 'draw' ? activeCue.owner : null
  const valid = useMemo(() => validTargetKeys(state), [state])
  const handProgress = useSharedValue(1)
  const drawPulse = useSharedValue(0)
  const endTurnPulse = useSharedValue(0)
  const targetingMotion = useTargetingMotion()
  const rootRef = useRef<View>(null)
  const aiHeroRef = useRef<View>(null)
  const playerHeroRef = useRef<View>(null)
  const rootOriginRef = useRef({ x: 0, y: 0 })
  const targetFramesRef = useRef(new Map<number, TargetFrame>())
  const targetsByIdRef = useRef(new Map<number, TargetRef>())
  const targetRemovalTimersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  const presentationFramesRef = useRef(new Map<string, TargetFrame>())

  const send = useCallback((command: GameCommand) => void controller.send(command), [controller])
  const acknowledgeCue = useCallback(
    (id: number) => send({ type: 'ACK_PRESENTATION', id }),
    [send],
  )

  const publishTargetFrames = useCallback(() => {
    targetingMotion.targets.value = [...targetFramesRef.current.values()]
  }, [targetingMotion.targets])

  const registerTarget = useCallback((id: number, node: View | null, target?: TargetRef) => {
    if (!node) {
      const previousTimer = targetRemovalTimersRef.current.get(id)
      if (previousTimer) clearTimeout(previousTimer)
      targetRemovalTimersRef.current.set(id, setTimeout(() => {
        targetFramesRef.current.delete(id)
        targetsByIdRef.current.delete(id)
        targetRemovalTimersRef.current.delete(id)
        publishTargetFrames()
      }, 900))
      return
    }
    const previousTimer = targetRemovalTimersRef.current.get(id)
    if (previousTimer) clearTimeout(previousTimer)
    targetRemovalTimersRef.current.delete(id)
    node.measureInWindow((x, y, width, height) => {
      targetFramesRef.current.set(id, { id, x, y, width, height })
      if (target) targetsByIdRef.current.set(id, target)
      publishTargetFrames()
    })
  }, [publishTargetFrames])

  const registerPresentationFrame = useCallback((key: string, node: View | null) => {
    if (!node) return
    node.measureInWindow((x, y, width, height) => {
      presentationFramesRef.current.set(key, { id: 0, x, y, width, height })
    })
  }, [])

  const measureRoot = useCallback(() => {
    rootRef.current?.measureInWindow((x, y) => {
      rootOriginRef.current = { x, y }
      targetingMotion.rootX.value = x
      targetingMotion.rootY.value = y
    })
  }, [targetingMotion.rootX, targetingMotion.rootY])

  const commitAttackDrop = useCallback((attackerUid: number, targetTargetId: number) => {
    const target = targetsByIdRef.current.get(targetTargetId)
    if (!target) return
    send({ type: 'ATTACK_TARGET', attackerUid, target })
  }, [send])
useEffect(() => {

}, [state.game.sides.player])
  const commitCardDrop = useCallback((handUid: number, targetTargetId: number) => {
    const pendingSpell = state.selection?.type === 'spell' && state.selection.handUid === handUid
      ? state.selection
      : null
    if (pendingSpell && pendingSpell.collected.length > 0) {
      const target = targetsByIdRef.current.get(targetTargetId)
      if (!target) return
      send(target.kind === 'creature'
        ? { type: 'SELECT_CREATURE', uid: target.uid }
        : { type: 'SELECT_HERO', owner: target.owner })
      return
    }
    if (targetTargetId === PLAYFIELD_DROP_ID) {
      setSelectedHandUid(null)
      send({ type: 'PLAY_CARD', handUid })
      return
    }
    const target = targetsByIdRef.current.get(targetTargetId)
    if (!target) return
    setSelectedHandUid(null)
    send({ type: 'PLAY_CARD_TO_TARGET', handUid, target })
  }, [send, state.selection])

  const targetHoverFeedback = useCallback(() => {
    if (haptics) void Haptics.selectionAsync()
  }, [haptics])

  useEffect(() => () => {
    for (const timer of targetRemovalTimersRef.current.values()) clearTimeout(timer)
    targetRemovalTimersRef.current.clear()
  }, [])

  useEffect(() => {
    cancelAnimation(handProgress)
    handProgress.value = withTiming(handOpen ? 1 : 0, {
      duration: handOpen ? 220 : 170,
      easing: handOpen ? Easing.out(Easing.poly(4)) : Easing.in(Easing.quad),
      reduceMotion: ReduceMotion.System,
    })
  }, [handOpen, handProgress])

  useEffect(() => {
    if (activeCue?.kind !== 'draw' || activeDrawOwner !== 'player') return
    cancelAnimation(drawPulse)
    drawPulse.value = withSequence(
      withTiming(1, { duration: 90, reduceMotion: ReduceMotion.System }),
      withTiming(0, {
        duration: 210,
        easing: Easing.out(Easing.poly(4)),
        reduceMotion: ReduceMotion.System,
      }),
    )
  }, [activeCue?.kind, activeCue?.presentationId, activeDrawOwner, drawPulse])

  useEffect(() => {
    if (selectedHandUid === null) return
    if (!state.game.sides.player.hand.some((card) => card.uid === selectedHandUid)) {
      setSelectedHandUid(null)
    }
  }, [selectedHandUid, state.game.sides.player.hand])

  const handTrayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, handProgress.value * 1.8),
    transform: [
      { translateY: (1 - handProgress.value) * (metrics.handCardHeight + 72) - drawPulse.value * 7 },
      { scale: 0.97 + handProgress.value * 0.03 + drawPulse.value * 0.014 },
    ],
  }))
  const handBackdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: handProgress.value * 0.18,
  }))

  const toggleHand = () => {
    const nextOpen = !handOpen
    setHandOpen(nextOpen)
    if (!nextOpen) setSelectedHandUid(null)
  }

  const selectHand = (card: HandCard) => {
    if (selectedHandUid === card.uid) {
      setSelectedHandUid(null)
      return
    }
    setSelectedHandUid(card.uid)
    play('select')
    if (haptics) void Haptics.selectionAsync()
  }
  const playSelectedHand = (uid: HandCard['uid']) => {
    setSelectedHandUid(null)
    send({ type: 'PLAY_CARD', handUid: uid })
  }
  const activateObserve = () => {
    if (handOpen) {
      setHandOpen(false)
      setSelectedHandUid(null)
    }
    send({ type: 'TOGGLE_HERO_POWER' })
  }

  const clearTransientSelection = useCallback(() => {
    setSelectedHandUid(null)
    if (state.selection) send({ type: 'CANCEL_SELECTION' })
  }, [send, state.selection])

  const heroPowerAvailable = state.game.active === 'player'
    && !state.busy
    && !state.game.sides.player.heroPowerUsed
    && state.game.sides.player.qubits >= HERO_POWER_COST

  const endTurnSuggested = useMemo(() => {
    if (state.busy || state.game.active !== 'player') return false
    const hasReadyAttacker = state.game.board.player.some((creature) => canAttack(state.game, creature))
    const hasPlayableCard = state.game.sides.player.hand.some((card) => canPlay(state.game, 'player', card.uid))
    return !hasReadyAttacker && !hasPlayableCard && !heroPowerAvailable
  }, [heroPowerAvailable, state.busy, state.game])

  useEffect(() => {
    if (!endTurnSuggested) {
      endTurnPulse.value = withTiming(0, { duration: 120, reduceMotion: ReduceMotion.System })
      return
    }
    endTurnPulse.value = withSequence(
      withTiming(1, { duration: 120, easing: Easing.out(Easing.poly(4)), reduceMotion: ReduceMotion.System }),
      withTiming(0, { duration: 240, easing: Easing.out(Easing.poly(4)), reduceMotion: ReduceMotion.System }),
    )
  }, [endTurnPulse, endTurnSuggested])

  const endTurnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + endTurnPulse.value * 0.06 }],
  }))

  const selectionHint = selectionLabel(state.selection)
  const inspectedBoard = inspectedCreature ? findCreature(state.game, inspectedCreature) : null
  const presentationGeometry = geometryForCue(
    activeCue,
    targetFramesRef.current,
    presentationFramesRef.current,
    rootOriginRef.current.x,
    rootOriginRef.current.y,
  )

  return (
    <View
      ref={rootRef}
      onLayout={measureRoot}
      style={[
        styles.root,
        {
          padding: metrics.gutter,
          gap: metrics.compact ? 4 : 8,
          marginRight: -insets.right,
          marginBottom: -insets.bottom,
        },
      ]}
    >
      <View style={[styles.topRail, { height: metrics.heroHeight, paddingRight: insets.right }]}>
        <View
          ref={aiHeroRef}
          onLayout={() => registerTarget(HERO_AI_TARGET_ID, aiHeroRef.current, { kind: 'hero', owner: 'ai' })}
        >
          <HeroPanel
            owner="ai"
            game={state.game}
            compact={metrics.compact}
            narrow={metrics.narrow}
            cue={activeCue}
            validTarget={valid.has('hero-ai')}
            onTarget={() => send({ type: 'SELECT_HERO', owner: 'ai' })}
            onInfo={() => setHeroInfo('ai')}
            onSecret={(id, used) => setSecret({ id, used })}
          />
        </View>
        <AiHandFan count={state.game.sides.ai.hand.length} compact={metrics.compact} thinking={state.aiThinking} />
        {state.aiThinking && <Text style={styles.aiThinking}>O AUTÔMATO DATILOGRAFA UMA RESPOSTA…</Text>}
        <View style={styles.topActions}>
          <RoundButton label="Abrir manual" glyph="?" onPress={() => setManual(true)} />
          <RoundButton label="Abrir ajustes" glyph="S" onPress={onOpenSettings} />
        </View>
      </View>

      <AnimatedBattlefield cue={activeCue}>
        <EntangledPlayfield
          game={state.game}
          cue={activeCue}
          selectedUid={state.selection?.type === 'attacker' ? state.selection.uid : null}
          entangleAnchorUid={state.selection?.type === 'spell' && state.selection.spell === 'emaranhar' && state.selection.collected[0]?.kind === 'creature'
            ? state.selection.collected[0].uid
            : null}
          valid={valid}
          cardWidth={metrics.boardCardWidth}
          cardHeight={metrics.boardCardHeight}
          rightReserve={metrics.controlDockWidth + insets.right + (metrics.compact ? 8 : 14)}
          onCreature={(uid) => send({ type: 'SELECT_CREATURE', uid })}
          targetingMotion={targetingMotion}
          onRegisterTarget={registerTarget}
          onAttackDrop={commitAttackDrop}
          onTargetHover={targetHoverFeedback}
          onClearSelection={clearTransientSelection}
          onInfo={setInspectedCreature}
          onKeyword={setKeyword}
        />
        <View style={[styles.controlDock, { width: metrics.controlDockWidth, right: insets.right }]}>
          <Animated.View style={[styles.endTurnSlot, endTurnAnimatedStyle]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={endTurnSuggested ? 'Encerrar turno, todas as ações disponíveis foram registradas' : 'Encerrar turno'}
              disabled={state.busy || state.game.active !== 'player'}
              onPress={() => send({ type: 'END_TURN' })}
              style={({ pressed }) => [
                styles.endTurn,
                metrics.compact && styles.endTurnCompact,
                endTurnSuggested && styles.endTurnSuggested,
                (state.busy || state.game.active !== 'player') && styles.endTurnDisabled,
                pressed && styles.endTurnPressed,
              ]}
            >
              <Text style={styles.endTurnText}>ENCERRAR{`\n`}TURNO</Text>
            </Pressable>
            {endTurnSuggested && <Text pointerEvents="none" style={styles.endTurnReady}>TUDO REGISTRADO</Text>}
          </Animated.View>
          <View style={styles.piles}>
            <Pile compact={metrics.compact} label="ARQUIVO" count={state.game.sides.player.deck.length} onRef={(node) => registerPresentationFrame('deck-player', node)} />
            <Pile compact={metrics.compact} label="DESCARTE" count={state.game.sides.player.discard.length} onRef={(node) => registerPresentationFrame('discard-player', node)} />
          </View>
        </View>
      </AnimatedBattlefield>

      <TargetingLayer
        motion={targetingMotion}
        impactKey={activeCue?.presentationId}
        impactTargetId={activeCue?.kind === 'damage' ? targetId(activeCue.target) : null}
      />

      <View
        style={[
          styles.playerRail,
          {
            height: metrics.collapsedHandAreaHeight + contentBottomInset,
            paddingBottom: contentBottomInset,
            paddingRight: insets.right + metrics.actionControlSize * 2 + 14,
          },
        ]}
      >
        <View
          ref={playerHeroRef}
          onLayout={() => registerTarget(-2, playerHeroRef.current, { kind: 'hero', owner: 'player' })}
        >
          <HeroPanel
            owner="player"
            game={state.game}
            compact={metrics.compact}
            narrow={metrics.narrow}
            cue={activeCue}
            onInfo={() => setHeroInfo('player')}
            onSecret={(id, used) => setSecret({ id, used })}
          />
        </View>
      </View>

      <AnimatedPressable
        pointerEvents={selectedHandUid !== null ? 'auto' : 'none'}
        accessible={selectedHandUid !== null}
        accessibilityRole="button"
        accessibilityLabel="Limpar seleção da ficha"
        onPress={clearTransientSelection}
        style={[styles.handBackdrop, handBackdropAnimatedStyle]}
      />

      <View
        pointerEvents={handOpen ? 'box-none' : 'none'}
        accessibilityElementsHidden={!handOpen}
        importantForAccessibility={handOpen ? 'yes' : 'no-hide-descendants'}
        style={[
          styles.handLayer,
          { height: metrics.handAreaHeight + contentBottomInset },
        ]}
      >
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.handFan,
            {
              height: metrics.handAreaHeight + contentBottomInset,
              paddingBottom: contentBottomInset,
              left: 0,
              right: insets.right + metrics.actionControlSize * 2 + 22,
            },
            handTrayAnimatedStyle,
          ]}
        >
          <View pointerEvents="none" style={styles.handCaption}>
            <Text style={styles.handCaptionTitle}>FICHAS NA MÃO</Text>
            <Text style={styles.handCaptionHint}>TOQUE PARA AMPLIAR</Text>
            <Text style={styles.handCaptionHint}>QUBITS DISPONÍVEIS: {state.game.sides.player.qubits}</Text>
          </View>
          <ScrollView
            horizontal
            style={styles.handScroll}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.handContent,
              {
                paddingLeft: metrics.compact ? 42 : 64,
                paddingRight: metrics.compact ? 18 : 28,
              },
            ]}
          >
            {state.game.sides.player.hand.map((card, index) => {
              const spread = index - (state.game.sides.player.hand.length - 1) / 2
              const playable = !state.busy
                && state.game.active === 'player'
                && canPlay(state.game, 'player', card.uid)
              const dragTargetIds = playable
                ? handCardDropTargets(state.game, card, state.selection)
                : []
              return (
                <HandTrayCard
                  key={card.uid}
                  card={card}
                  index={index}
                  spread={spread}
                  selected={selectedHandUid === card.uid}
                  playable={playable}
                  unavailableReason={handUnavailableReason(state.game, card, state.busy)}
                  disabled={state.busy}
                  width={metrics.handCardWidth}
                  height={metrics.handCardHeight}
                  overlap={metrics.handCardOverlap}
                  compact={metrics.compact}
                  onSelect={() => selectHand(card)}
                  onPlay={() => playSelectedHand(card.uid)}
                  onKeyword={setKeyword}
                  targetingMotion={targetingMotion}
                  validDropIds={dragTargetIds}
                  anchorTargetId={state.selection?.type === 'spell'
                    && state.selection.handUid === card.uid
                    && state.selection.spell === 'emaranhar'
                    && state.selection.collected[0]?.kind === 'creature'
                    ? state.selection.collected[0].uid
                    : undefined}
                  onCardDrop={commitCardDrop}
                  onTargetHover={targetHoverFeedback}
                  onRegisterFrame={(node) => registerPresentationFrame(`hand-${card.uid}`, node)}
                />
              )
            })}
          </ScrollView>
        </Animated.View>
      </View>

      <View
        style={[
          styles.actionCluster,
          {
            right: insets.right + metrics.gutter,
            bottom: contentBottomInset + metrics.gutter,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={state.game.sides.player.heroPowerUsed ? 'Observar, já utilizado neste turno' : `Observar um sujeito, custa ${HERO_POWER_COST} qubits`}
          accessibilityHint="Escolha um sujeito em superposição e influencie o estado observado"
          accessibilityState={{ selected: state.selection?.type === 'heropower', disabled: state.busy || state.game.active !== 'player' }}
          onPress={activateObserve}
          disabled={state.busy || state.game.active !== 'player'}
          style={({ pressed }) => [
            styles.observe,
            {
              width: metrics.actionControlSize,
              height: metrics.actionControlSize,
              borderRadius: metrics.actionControlSize / 2,
            },
            state.selection?.type === 'heropower' && styles.observeActive,
            !heroPowerAvailable && styles.actionDisabled,
            pressed && styles.endTurnPressed,
          ]}
        >
          <Text style={styles.observeEye}>◉</Text>
          <Text style={styles.actionControlText}>OBSERVAR</Text>
          <Text style={styles.observeCost}>{HERO_POWER_COST}Q</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${handOpen ? 'Ocultar' : 'Mostrar'} mão (${state.game.sides.player.hand.length})`}
          accessibilityState={{ expanded: handOpen }}
          onPress={toggleHand}
          style={({ pressed }) => [
            styles.handControl,
            {
              width: metrics.actionControlSize,
              height: metrics.actionControlSize,
              borderRadius: metrics.actionControlSize / 2,
            },
            handOpen && styles.handControlActive,
            pressed && styles.endTurnPressed,
          ]}
        >
          <View style={styles.handGlyph}>
            <View style={[styles.handGlyphCard, styles.handGlyphBack]} />
            <View style={styles.handGlyphCard} />
          </View>
          <Text style={styles.actionControlText}>{handOpen ? 'OCULTAR' : 'MOSTRAR'}</Text>
          <Text style={styles.handCount}>{state.game.sides.player.hand.length}</Text>
        </Pressable>
      </View>

      {selectionHint && <View pointerEvents="none" style={styles.selectionHint}><Text style={styles.selectionHintText}>{selectionHint}</Text></View>}

      <FaceChoice selection={state.selection} game={state.game} onChoose={(face) => send({ type: 'CHOOSE_FACE', face })} onCancel={clearTransientSelection} />
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
      <CueHost cue={activeCue} acknowledge={acknowledgeCue} geometry={presentationGeometry} />
    </View>
  )
}

function AnimatedBattlefield({ cue, children }: { cue?: PresentationCue; children: ReactNode }) {
  const impact = useSharedValue(0)

  useEffect(() => {
    if (cue?.kind !== 'attack' && cue?.kind !== 'damage') return
    const strength = cue.kind === 'damage' ? 1 : 0.45
    impact.value = withSequence(
      withTiming(strength, { duration: 55, reduceMotion: ReduceMotion.System }),
      withTiming(-strength * 0.75, { duration: 65, reduceMotion: ReduceMotion.System }),
      withTiming(strength * 0.4, { duration: 55, reduceMotion: ReduceMotion.System }),
      withTiming(0, {
        duration: 100,
        easing: Easing.out(Easing.poly(4)),
        reduceMotion: ReduceMotion.System,
      }),
    )
  }, [cue?.kind, cue?.presentationId, impact])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: impact.value * 4 },
      { rotate: `${impact.value * 0.08}deg` },
    ],
  }))

  return <Animated.View style={[styles.battlefieldRow, animatedStyle]}>{children}</Animated.View>
}

function AiHandFan({ count, compact, thinking }: { count: number; compact: boolean; thinking: boolean }) {
  return (
    <View accessibilityLabel={`${count} fichas ocultas na mão do Autômato`} style={[styles.aiHandFan, compact && styles.aiHandFanCompact]}>
      {Array.from({ length: count }, (_, index) => {
        const spread = index - (count - 1) / 2
        return (
          <Animated.View
            key={index}
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(220)}
            layout={LinearTransition.duration(180).easing(Easing.out(Easing.quad))}
            style={[styles.aiHandSlot, index > 0 && styles.aiHandOverlap]}
          >
            <View
              style={[
                styles.aiCardBack,
                compact && styles.aiCardBackCompact,
                thinking && styles.aiCardBackThinking,
                {
                  transform: [
                    { translateY: Math.abs(spread) * (compact ? 1.5 : 3) },
                    { rotate: `${spread * (compact ? 2.2 : 3)}deg` },
                  ],
                },
              ]}
            >
              <Text style={styles.aiCardBackText}>½</Text>
            </View>
          </Animated.View>
        )
      })}
    </View>
  )
}

function useTargetingGesture({
  sourceUid,
  enabled,
  verticalOnly = false,
  anchorTargetId,
  targetingMotion,
  validDropIds,
  onDrop,
  onTargetHover,
}: {
  sourceUid: number
  enabled: boolean
  verticalOnly?: boolean
  anchorTargetId?: number
  targetingMotion: TargetingMotion
  validDropIds: number[]
  onDrop: (sourceUid: number, targetId: number) => void
  onTargetHover: () => void
}) {
  return useMemo(() => {
    let pan = Gesture.Pan().enabled(enabled)
    pan = verticalOnly ? pan.activeOffsetY([-8, 8]) : pan.minDistance(8)
    return pan
      .onStart((event) => {
        'worklet'
        targetingMotion.sourceUid.value = sourceUid
        targetingMotion.active.value = 1
        const anchor = anchorTargetId === undefined
          ? undefined
          : targetingMotion.targets.value.find((frame) => frame.id === anchorTargetId)
        targetingMotion.startX.value = anchor ? anchor.x + anchor.width / 2 : event.absoluteX
        targetingMotion.startY.value = anchor ? anchor.y + anchor.height / 2 : event.absoluteY
        targetingMotion.endX.value = event.absoluteX
        targetingMotion.endY.value = event.absoluteY
        targetingMotion.translateX.value = 0
        targetingMotion.translateY.value = 0
        targetingMotion.hoverId.value = 0
        targetingMotion.valid.value = 0
        targetingMotion.eligibleIds.value = validDropIds
      })
      .onUpdate((event) => {
        'worklet'
        targetingMotion.endX.value = event.absoluteX
        targetingMotion.endY.value = event.absoluteY
        targetingMotion.translateX.value = event.translationX
        targetingMotion.translateY.value = event.translationY

        let nextHoverId = 0
        for (const frame of targetingMotion.targets.value) {
          if (!validDropIds.includes(frame.id)) continue
          const hitSlop = 10
          const isInside = event.absoluteX >= frame.x - hitSlop
            && event.absoluteX <= frame.x + frame.width + hitSlop
            && event.absoluteY >= frame.y - hitSlop
            && event.absoluteY <= frame.y + frame.height + hitSlop
          if (isInside) {
            nextHoverId = frame.id
            break
          }
        }

        if (nextHoverId !== targetingMotion.hoverId.value && nextHoverId !== 0) {
          scheduleOnRN(onTargetHover)
        }
        targetingMotion.hoverId.value = nextHoverId
        targetingMotion.valid.value = nextHoverId === 0 ? 0 : 1
      })
      .onEnd(() => {
        'worklet'
        const targetTargetId = targetingMotion.hoverId.value
        if (targetTargetId !== 0) scheduleOnRN(onDrop, sourceUid, targetTargetId)
      })
      .onFinalize(() => {
        'worklet'
        targetingMotion.active.value = 0
        targetingMotion.hoverId.value = 0
        targetingMotion.valid.value = 0
        targetingMotion.eligibleIds.value = []
        targetingMotion.translateX.value = withSpring(0, {
          damping: 18,
          stiffness: 220,
          mass: 0.7,
          reduceMotion: ReduceMotion.System,
        })
        targetingMotion.translateY.value = withSpring(0, {
          damping: 18,
          stiffness: 220,
          mass: 0.7,
          reduceMotion: ReduceMotion.System,
        })
      })
  }, [anchorTargetId, enabled, onDrop, onTargetHover, sourceUid, targetingMotion, validDropIds, verticalOnly])
}

function HandTrayCard({
  card,
  index,
  spread,
  selected,
  playable,
  unavailableReason,
  disabled,
  width,
  height,
  overlap,
  compact,
  onSelect,
  onPlay,
  onKeyword,
  targetingMotion,
  validDropIds,
  anchorTargetId,
  onCardDrop,
  onTargetHover,
  onRegisterFrame,
}: {
  card: HandCard
  index: number
  spread: number
  selected: boolean
  playable: boolean
  unavailableReason: string
  disabled: boolean
  width: number
  height: number
  overlap: number
  compact: boolean
  onSelect: () => void
  onPlay: () => void
  onKeyword: (keyword: Keyword) => void
  targetingMotion: TargetingMotion
  validDropIds: number[]
  anchorTargetId?: number
  onCardDrop: (handUid: number, targetId: number) => void
  onTargetHover: () => void
  onRegisterFrame: (node: View | null) => void
}) {
  const focus = useSharedValue(selected ? 1 : 0)
  const def = getDef(card.defId)

  useEffect(() => {
    focus.value = withTiming(selected ? 1 : 0, {
      duration: selected ? 190 : 145,
      easing: selected ? Easing.out(Easing.poly(4)) : Easing.inOut(Easing.quad),
      reduceMotion: ReduceMotion.System,
    })
  }, [focus, selected])

  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: targetingMotion.active.value && targetingMotion.sourceUid.value === card.uid ? 120 : selected ? 100 : index + 1,
    transform: [
      { translateX: targetingMotion.sourceUid.value === card.uid ? targetingMotion.translateX.value : 0 },
      { translateY: (targetingMotion.sourceUid.value === card.uid ? targetingMotion.translateY.value : 0) - focus.value * (compact ? 10 : 14) + Math.abs(spread) * (1 - focus.value) * (compact ? 2.5 : 4) },
      { rotate: `${spread * (compact ? 1.55 : 1.7) * (1 - focus.value)}deg` },
      { scale: 0.93 + focus.value * 0.07 + (targetingMotion.active.value && targetingMotion.sourceUid.value === card.uid ? 0.04 : 0) },
    ],
  }))

  const dragGesture = useTargetingGesture({
    sourceUid: card.uid,
    enabled: playable && !disabled,
    verticalOnly: true,
    anchorTargetId,
    targetingMotion,
    validDropIds,
    onDrop: onCardDrop,
    onTargetHover,
  })

  return (
    <View
      ref={(node: View | null) => onRegisterFrame(node)}
      style={[
        styles.handCardSlot,
        {
          width,
          height: height + (compact ? 40 : 48),
          zIndex: selected ? 100 : index + 1,
        },
        index > 0 && { marginLeft: -overlap },
      ]}
    >
      <GestureDetector gesture={dragGesture}>
        <Animated.View style={[styles.handCard, animatedStyle]}>
          <NativeCard
            testID={playable ? `hand-card-${card.uid}-playable` : undefined}
            defId={card.defId}
            width={width}
            height={height}
            mode="hand"
            playable={playable}
            disabled={disabled}
            accessibilityLabel={`${def.name}. ${playable
              ? `Jogável por ${def.cost} ${def.cost === 1 ? 'qubit' : 'qubits'}`
              : unavailableReason}`}
            accessibilityState={{ selected }}
            onPress={onSelect}
            onKeywordPress={onKeyword}
          />
          {selected && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={playable ? `Jogar ${def.name} por ${def.cost} qubits` : unavailableReason}
              disabled={!playable}
              onPress={onPlay}
              style={({ pressed }) => [
                styles.handPlayAction,
                !playable && styles.handPlayActionDisabled,
                pressed && playable && styles.endTurnPressed,
              ]}
            >
              <Text style={[styles.handPlayLabel, !playable && styles.handPlayLabelDisabled]}>
                {playable ? 'JOGAR FICHA' : unavailableReason.toUpperCase()}
              </Text>
              <Text style={[styles.handPlayCost, !playable && styles.handPlayCostDisabled]}>{def.cost}Q</Text>
            </Pressable>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

function EntangledPlayfield({
  game,
  cue,
  selectedUid,
  entangleAnchorUid,
  valid,
  cardWidth,
  cardHeight,
  rightReserve,
  onCreature,
  targetingMotion,
  onRegisterTarget,
  onAttackDrop,
  onTargetHover,
  onClearSelection,
  onInfo,
  onKeyword,
}: {
  game: GameState
  cue?: PresentationCue
  selectedUid: number | null
  entangleAnchorUid: number | null
  valid: Set<string>
  cardWidth: number
  cardHeight: number
  rightReserve: number
  onCreature: (uid: number) => void
  targetingMotion: TargetingMotion
  onRegisterTarget: (id: number, node: View | null, target?: TargetRef) => void
  onAttackDrop: (attackerUid: number, targetId: number) => void
  onTargetHover: () => void
  onClearSelection: () => void
  onInfo: (uid: number) => void
  onKeyword: (keyword: Keyword) => void
}) {
  const playfieldRef = useRef<View>(null)
  const [playfieldLayout, setPlayfieldLayout] = useState<Box | null>(null)
  const [laneLayouts, setLaneLayouts] = useState<Partial<Record<Owner, Box>>>({})
  const [cardLayouts, setCardLayouts] = useState<Partial<Record<number, Box>>>({})
  const pairs = useMemo(() => {
    const found: [number, number][] = []
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
  const attackVectorFor = (uid: number) => {
    if (cue?.kind !== 'attack' || cue.attackerUid !== uid) return undefined
    const from = position(uid)
    if (!from) return undefined
    if (cue.target.kind === 'creature') {
      const to = position(cue.target.uid)
      return to ? { x: to.x - from.x, y: to.y - from.y } : undefined
    }
    const attacker = findCreature(game, uid)
    if (!attacker || !playfieldLayout) return undefined
    const heroX = Math.min(playfieldLayout.width * 0.26, 190)
    const heroY = attacker.owner === 'player'
      ? -cardHeight * 0.72
      : playfieldLayout.height + cardHeight * 0.72
    return { x: heroX - from.x, y: heroY - from.y }
  }

  return (
    <View
      ref={playfieldRef}
      onLayout={(event) => {
        setPlayfieldLayout(event.nativeEvent.layout)
        onRegisterTarget(PLAYFIELD_DROP_ID, playfieldRef.current)
      }}
      style={styles.playfield}
    >
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
        game={game}
        owner="ai"
        creatures={game.board.ai}
        cue={cue}
        selectedUid={selectedUid}
        entangleAnchorUid={entangleAnchorUid}
        valid={valid}
        width={cardWidth}
        height={cardHeight}
        rightReserve={rightReserve}
        attackVectorFor={attackVectorFor}
        onLayout={(event) => setLane('ai', event)}
        onCardLayout={setCard}
        onCreature={onCreature}
        targetingMotion={targetingMotion}
        onRegisterTarget={onRegisterTarget}
        onAttackDrop={onAttackDrop}
        onTargetHover={onTargetHover}
        onClearSelection={onClearSelection}
        onInfo={onInfo}
        onKeyword={onKeyword}
      />
      <BoardLane
        game={game}
        owner="player"
        creatures={game.board.player}
        cue={cue}
        selectedUid={selectedUid}
        entangleAnchorUid={entangleAnchorUid}
        valid={valid}
        width={cardWidth}
        height={cardHeight}
        rightReserve={rightReserve}
        attackVectorFor={attackVectorFor}
        onLayout={(event) => setLane('player', event)}
        onCardLayout={setCard}
        onCreature={onCreature}
        targetingMotion={targetingMotion}
        onRegisterTarget={onRegisterTarget}
        onAttackDrop={onAttackDrop}
        onTargetHover={onTargetHover}
        onClearSelection={onClearSelection}
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

function geometryForCue(
  cue: PresentationCue | undefined,
  targets: Map<number, TargetFrame>,
  presentationFrames: Map<string, TargetFrame>,
  rootX: number,
  rootY: number,
): PresentationGeometry | undefined {
  if (!cue) return undefined
  const center = (frame: TargetFrame | undefined) => frame
    ? { x: frame.x + frame.width / 2 - rootX, y: frame.y + frame.height / 2 - rootY }
    : undefined

  if (cue.kind === 'cardCommit') {
    const from = center(presentationFrames.get(`hand-${cue.handUid}`))
    const to = center(targets.get(PLAYFIELD_DROP_ID))
    return from && to ? { from, to } : undefined
  }
  if (cue.kind === 'death') {
    const from = center(targets.get(cue.uid))
    if (!from) return undefined
    const playerDiscard = center(presentationFrames.get('discard-player'))
    const to = cue.owner === 'player' && playerDiscard
      ? playerDiscard
      : { x: from.x + 220, y: from.y - 120 }
    return { from, to }
  }
  return undefined
}

const readinessCopy: Record<Exclude<AttackReadiness, 'inactive'>, string> = {
  ready: 'PRONTO',
  preparing: 'PREPARANDO',
  spent: 'JÁ AGIU',
}

function BoardCardPresentation({
  children,
  sourceUid,
  readiness,
  selected,
  validTarget,
  targeting,
  entangleAnchor,
  readyDelay,
  targetingMotion,
  validDropIds,
  onAttackDrop,
  onTargetHover,
}: {
  children: ReactNode
  sourceUid: number
  readiness: AttackReadiness
  selected: boolean
  validTarget: boolean
  targeting: boolean
  entangleAnchor: boolean
  readyDelay: number
  targetingMotion: TargetingMotion
  validDropIds: number[]
  onAttackDrop: (attackerUid: number, targetId: number) => void
  onTargetHover: () => void
}) {
  const reduceMotion = useReducedMotion()
  const focus = useSharedValue(selected ? 1 : 0)
  const target = useSharedValue(validTarget ? 1 : 0)
  const breathe = useSharedValue(0)

  useEffect(() => {
    focus.value = withSpring(selected ? 1 : 0, {
      damping: 18,
      stiffness: 220,
      mass: 0.7,
      reduceMotion: ReduceMotion.System,
    })
  }, [focus, selected])

  useEffect(() => {
    target.value = validTarget
      ? withSequence(
          withTiming(1, { duration: 90, reduceMotion: ReduceMotion.System }),
          withTiming(0.72, { duration: 150, reduceMotion: ReduceMotion.System }),
        )
      : withTiming(0, { duration: 90, reduceMotion: ReduceMotion.System })
  }, [target, validTarget])

  useEffect(() => {
    cancelAnimation(breathe)
    breathe.value = 0
    if (readiness !== 'ready' || reduceMotion) return
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    )
  }, [breathe, readiness, reduceMotion])

  const animatedStyle = useAnimatedStyle(() => {
    const isDragSource = targetingMotion.sourceUid.value === sourceUid
    const dragEligible = targetingMotion.eligibleIds.value.includes(sourceUid)
    const dragTargeting = targetingMotion.active.value > 0 && !isDragSource
    const dragX = isDragSource ? targetingMotion.translateX.value : 0
    const dragY = isDragSource ? targetingMotion.translateY.value : 0
    const unavailableOpacity = (targeting && !validTarget && !selected) || (dragTargeting && !dragEligible)
      ? 0.52
      : readiness === 'spent' ? 0.76 : 1
    const targetEmphasis = Math.max(target.value, dragTargeting && dragEligible ? 0.72 : 0)
    return {
      zIndex: targetingMotion.active.value && isDragSource ? 48 : selected ? 20 : targetEmphasis > 0 ? 12 : 1,
      opacity: unavailableOpacity,
      transform: [
        { translateX: dragX },
        { translateY: dragY + focus.value * -10 - (readiness === 'ready' && !selected ? 2 + breathe.value : 0) },
        { rotate: `${focus.value * -1}deg` },
        { scale: 1 + focus.value * 0.04 + targetEmphasis * 0.015 + (targetingMotion.active.value && isDragSource ? 0.035 : 0) },
      ],
    }
  })
  const targetAnimatedStyle = useAnimatedStyle(() => {
    const isDragSource = targetingMotion.sourceUid.value === sourceUid
    const dragEligible = targetingMotion.active.value > 0
      && !isDragSource
      && targetingMotion.eligibleIds.value.includes(sourceUid)
    return { opacity: Math.max(target.value, dragEligible ? 0.72 : 0) }
  })

  const dragGesture = useTargetingGesture({
    sourceUid,
    enabled: readiness === 'ready',
    targetingMotion,
    validDropIds,
    onDrop: onAttackDrop,
    onTargetHover,
  })

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View style={[styles.boardCardPresentation, animatedStyle]}>
        <Animated.View pointerEvents="none" style={[styles.targetPlate, targetAnimatedStyle]}>
          <Text style={styles.targetPlateText}>ALVO</Text>
        </Animated.View>
        {entangleAnchor && (
          <View pointerEvents="none" style={styles.entangleAnchorPlate}>
            <Text style={styles.entangleAnchorText}>PRIMEIRO ALVO</Text>
          </View>
        )}
        {children}
        {readiness !== 'inactive' && (
          <Animated.View
            key={readiness}
            entering={readiness === 'ready'
              ? FadeInDown.delay(readyDelay).duration(260).reduceMotion(ReduceMotion.System)
              : undefined}
            pointerEvents="none"
            style={[
              styles.readinessTag,
              readiness === 'ready' && styles.readinessReady,
              readiness === 'preparing' && styles.readinessPreparing,
              readiness === 'spent' && styles.readinessSpent,
            ]}
          >
            <Text style={[styles.readinessText, readiness === 'ready' && styles.readinessTextReady]}>
              {readinessCopy[readiness]}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </GestureDetector>
  )
}

function BoardLane({
  game,
  owner,
  creatures,
  cue,
  selectedUid,
  entangleAnchorUid,
  valid,
  width,
  height,
  rightReserve,
  attackVectorFor,
  onLayout,
  onCardLayout,
  onCreature,
  targetingMotion,
  onRegisterTarget,
  onAttackDrop,
  onTargetHover,
  onClearSelection,
  onInfo,
  onKeyword,
}: {
  game: GameState
  owner: Owner
  creatures: Creature[]
  cue?: PresentationCue
  selectedUid: number | null
  entangleAnchorUid: number | null
  valid: Set<string>
  width: number
  height: number
  rightReserve: number
  attackVectorFor: (uid: number) => { x: number; y: number } | undefined
  onLayout: (event: LayoutChangeEvent) => void
  onCardLayout: (uid: number, event: LayoutChangeEvent) => void
  onCreature: (uid: number) => void
  targetingMotion: TargetingMotion
  onRegisterTarget: (id: number, node: View | null, target: TargetRef) => void
  onAttackDrop: (attackerUid: number, targetId: number) => void
  onTargetHover: () => void
  onClearSelection: () => void
  onInfo: (uid: number) => void
  onKeyword: (keyword: Keyword) => void
}) {
  return (
    <View onLayout={onLayout} style={styles.lane}>
      <Pressable
        accessible={false}
        importantForAccessibility="no"
        testID={`lane-${owner}-clear`}
        onPress={onClearSelection}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.laneLabel}>{owner === 'ai' ? 'BANCADA DO AUTÔMATO' : 'SUA BANCADA'}</Text>
      <View style={[styles.laneCards, { paddingRight: rightReserve }]}>
        {creatures.map((creature, index) => {
          const readiness = owner === 'player' ? attackReadiness(game, creature) : 'inactive'
          const readinessLabel = readiness === 'inactive' ? 'sujeito no tabuleiro' : readinessCopy[readiness]
          const validDropIds = owner === 'player' && readiness === 'ready'
            ? validAttackTargets(game, creature).map(targetId)
            : []
          return <Animated.View
            key={creature.uid}
            ref={(node: View | null) => onRegisterTarget(creature.uid, node, { kind: 'creature', uid: creature.uid })}
            layout={LinearTransition.duration(220).easing(Easing.out(Easing.quad))}
            exiting={FadeOut.duration(360).easing(Easing.in(Easing.quad))}
            onLayout={(event) => onCardLayout(creature.uid, event)}
            style={styles.boardCardWrap}
          >
            <BoardCardPresentation
              sourceUid={creature.uid}
              readiness={readiness}
              selected={selectedUid === creature.uid}
              validTarget={valid.has(targetKey({ kind: 'creature', uid: creature.uid }))}
              targeting={valid.size > 0}
              entangleAnchor={entangleAnchorUid === creature.uid}
              readyDelay={index * 55}
              targetingMotion={targetingMotion}
              validDropIds={validDropIds}
              onAttackDrop={onAttackDrop}
              onTargetHover={onTargetHover}
            >
              <NativeCard
                defId={creature.defId}
                creature={creature}
                cue={cue}
                attackVector={attackVectorFor(creature.uid)}
                width={width}
                height={height}
                mode="board"
                accessibilityLabel={`${getDef(creature.defId).name}. ${readinessLabel}`}
                accessibilityState={{ selected: selectedUid === creature.uid }}
                onPress={() => onCreature(creature.uid)}
                onKeywordPress={onKeyword}
              />
              <Pressable accessibilityRole="button" accessibilityLabel={`Consultar ${getDef(creature.defId).name}`} onPress={(event) => { event.stopPropagation(); onInfo(creature.uid) }} style={styles.cardInfo} hitSlop={11}>
                <Text style={styles.cardInfoText}>i</Text>
              </Pressable>
            </BoardCardPresentation>
          </Animated.View>
        })}
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
    <View accessibilityViewIsModal onAccessibilityEscape={onCancel} style={styles.faceChoiceHost}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar ao tabuleiro" onPress={onCancel} style={StyleSheet.absoluteFill} />
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
        <Text style={styles.faceChoiceDismiss}>TOQUE FORA PARA VOLTAR</Text>
      </View>
    </View>
  )
}

function Pile({ label, count, compact, onRef }: { label: string; count: number; compact?: boolean; onRef?: (node: View | null) => void }) {
  return (
    <View ref={(node: View | null) => onRef?.(node)} style={[styles.pile, compact && styles.pileCompact]}>
      <Text style={[styles.pileCount, compact && styles.pileCountCompact]}>{count}</Text>
      <Text style={styles.pileLabel}>{label}</Text>
    </View>
  )
}

function handUnavailableReason(game: GameState, card: HandCard, busy: boolean) {
  if (busy || game.active !== 'player') return 'Aguarde seu turno'
  const missingQubits = Math.max(0, getDef(card.defId).cost - game.sides.player.qubits)
  if (missingQubits > 0) return `Faltam ${missingQubits}Q`
  return 'Bancada cheia'
}

function handCardDropTargets(game: GameState, card: HandCard, selection: SessionSelection): number[] {
  const def = getDef(card.defId)
  if (def.type === 'criatura' || def.spell === 'flutuacao' || def.spell === 'decoerencia') {
    return [PLAYFIELD_DROP_ID]
  }
  if (!def.spell) return []

  const spellSelection: SessionSelection = selection?.type === 'spell' && selection.handUid === card.uid
    ? selection
    : { type: 'spell', handUid: card.uid, spell: def.spell, collected: [] }
  return [...validTargetKeys({ game, selection: spellSelection })].map((key) => {
    if (key === 'hero-ai') return HERO_AI_TARGET_ID
    if (key === 'hero-player') return -2
    return Number(key.slice(2))
  })
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
  topRail: {
    zIndex: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  topActions: { flexDirection: 'row', gap: 8, paddingTop: 3 },
  aiHandFan: {
    height: 70,
    minWidth: 118,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 5,
  },
  aiHandFanCompact: { height: 58, minWidth: 86, paddingTop: 2 },
  aiHandSlot: { flexShrink: 0 },
  aiHandOverlap: { marginLeft: -22 },
  aiCardBack: {
    width: 42,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paperDim,
    borderColor: colors.ink,
    borderWidth: 2,
    borderRadius: 5,
    ...shadow,
  },
  aiCardBackCompact: { width: 34, height: 50, borderWidth: 1.5 },
  aiCardBackThinking: { borderColor: colors.particle, backgroundColor: colors.paperCard },
  aiCardBackText: { color: colors.inkSoft, fontFamily: fonts.display, fontSize: 16 },
  aiThinking: {
    flex: 1,
    alignSelf: 'center',
    color: colors.inkSoft,
    fontFamily: fonts.type,
    fontSize: 8,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  battlefieldRow: {
    position: 'relative',
    flex: 1,
    minHeight: 0,
  },
  playfield: { flex: 1, minWidth: 0, gap: 4 },
  lane: {
    flex: 1,
    minHeight: 0,
    overflow: 'visible',
    borderColor: colors.inkSoft,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 7,
    backgroundColor: 'rgba(222,213,196,0.18)',
  },
  laneLabel: {
    position: 'absolute',
    zIndex: 3,
    left: 7,
    top: 5,
    color: colors.inkSoft,
    fontFamily: fonts.type,
    fontSize: 6,
    letterSpacing: 1.1,
  },
  laneCards: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 0,
  },
  emptyLane: { color: colors.inkFaint, fontFamily: fonts.type, fontSize: 8, letterSpacing: 1.8 },
  boardCardWrap: { position: 'relative', paddingVertical: 9 },
  boardCardPresentation: { position: 'relative' },
  targetPlate: {
    position: 'absolute',
    top: -6,
    right: -6,
    bottom: -6,
    left: -6,
    borderColor: colors.particle,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 5,
    backgroundColor: 'rgba(216,59,33,0.12)',
    transform: [{ rotate: '1deg' }],
  },
  targetPlateText: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    color: colors.paperCard,
    fontFamily: fonts.display,
    fontSize: 7,
    letterSpacing: 0.7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.particle,
  },
  entangleAnchorPlate: {
    position: 'absolute',
    zIndex: 26,
    left: -7,
    top: -8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: colors.paperCard,
    borderColor: colors.entangle,
    borderWidth: 2,
    transform: [{ rotate: '-2deg' }],
  },
  entangleAnchorText: {
    color: colors.entangle,
    fontFamily: fonts.display,
    fontSize: 6.5,
    letterSpacing: 0.45,
  },
  readinessTag: {
    position: 'absolute',
    zIndex: 24,
    bottom: -9,
    alignSelf: 'center',
    minWidth: 56,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    borderColor: colors.inkSoft,
    borderWidth: 1.5,
    backgroundColor: colors.paperDim,
    transform: [{ rotate: '-1.5deg' }],
  },
  readinessReady: { borderColor: colors.approve, backgroundColor: '#E1E9DC' },
  readinessPreparing: { borderStyle: 'dashed', backgroundColor: colors.paperDim },
  readinessSpent: { opacity: 0.86, borderColor: colors.particle, backgroundColor: '#E5D8CC' },
  readinessText: { color: colors.inkSoft, fontFamily: fonts.display, fontSize: 6.5, letterSpacing: 0.45 },
  readinessTextReady: { color: colors.approve },
  cardInfo: { position: 'absolute', top: 1, right: 1, width: 22, height: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paperCard, borderColor: colors.ink, borderWidth: 1.5, borderRadius: 12 },
  cardInfoText: { color: colors.ink, fontFamily: fonts.display, fontSize: 9 },
  controlDock: {
    position: 'absolute',
    zIndex: 10,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    paddingVertical: 3,
    backgroundColor: 'rgba(222,213,196,0.22)',
    borderColor: colors.inkFaint,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 7,
  },
  endTurnSlot: { position: 'absolute', top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  endTurn: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.energy, borderColor: colors.ink, borderWidth: 3, borderRadius: 48, ...shadow },
  endTurnCompact: { width: 72, height: 72, borderRadius: 38, borderWidth: 2.5 },
  endTurnDisabled: { opacity: 0.38 },
  endTurnSuggested: { borderColor: colors.approve, backgroundColor: '#E5C446' },
  endTurnPressed: { transform: [{ translateY: 2 }], shadowOffset: { width: 1, height: 1 } },
  endTurnText: { color: colors.ink, fontFamily: fonts.display, fontSize: 10, letterSpacing: 1, textAlign: 'center' },
  endTurnReady: { marginTop: 5, color: colors.approve, fontFamily: fonts.display, fontSize: 6.5, letterSpacing: 0.4, textAlign: 'center' },
  piles: { position: 'absolute', bottom: 3, flexDirection: 'row', gap: 5 },
  pile: { width: 45, height: 54, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paperDim, borderColor: colors.ink, borderWidth: 2, borderRadius: 4 },
  pileCompact: { width: 38, height: 44, borderWidth: 1.5 },
  pileCount: { color: colors.ink, fontFamily: fonts.display, fontSize: 17 },
  pileCountCompact: { fontSize: 14, lineHeight: 16 },
  pileLabel: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 6 },
  playerRail: {
    zIndex: 30,
    minHeight: 0,
    justifyContent: 'flex-start',
    borderTopColor: colors.inkFaint,
    borderTopWidth: 1,
  },
  actionCluster: {
    position: 'absolute',
    zIndex: 64,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
  },
  actionDisabled: { opacity: 0.38 },
  handControl: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.confidential,
    borderColor: colors.wave,
    borderWidth: 3,
    ...shadow,
  },
  handControlActive: { borderColor: colors.energy },
  handGlyph: { width: 21, height: 16, marginBottom: 1 },
  handGlyphCard: {
    position: 'absolute',
    left: 4,
    top: 3,
    width: 15,
    height: 12,
    borderColor: colors.paperCard,
    borderWidth: 1.5,
    borderRadius: 2,
    backgroundColor: colors.confidential,
  },
  handGlyphBack: { left: 0, top: 0, opacity: 0.62 },
  actionControlText: {
    color: colors.paperCard,
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: 0.45,
  },
  handCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 23,
    height: 23,
    paddingHorizontal: 5,
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 9,
    lineHeight: 23,
    textAlign: 'center',
    backgroundColor: colors.energy,
    borderRadius: 12,
  },
  observe: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.confidential, borderColor: colors.entangle, borderWidth: 3, ...shadow },
  observeActive: { borderColor: colors.energy, transform: [{ scale: 1.06 }] },
  observeEye: { color: colors.paperCard, fontSize: 19, lineHeight: 20 },
  observeCost: { position: 'absolute', top: -5, right: -5, color: colors.ink, fontFamily: fonts.display, fontSize: 9, backgroundColor: colors.energy, paddingHorizontal: 5, paddingVertical: 4, borderRadius: 13 },
  handLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 54,
  },
  handBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 53,
    backgroundColor: colors.confidential,
  },
  handFan: {
    position: 'absolute',
    zIndex: 2,
    bottom: 0,
    overflow: 'visible',
  },
  handCaption: {
    position: 'absolute',
    zIndex: 5,
    top: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(40,34,28,0.9)',
    borderColor: colors.paperCard,
    borderWidth: 1,
    transform: [{ rotate: '-0.8deg' }],
    ...shadow,
  },
  handCaptionTitle: { color: colors.paperCard, fontFamily: fonts.display, fontSize: 8.5, letterSpacing: 0.7 },
  handCaptionHint: { color: colors.paperDeep, fontFamily: fonts.type, fontSize: 6.5, letterSpacing: 0.35 },
  handScroll: { flex: 1, overflow: 'visible' },
  handContent: {
    flexGrow: 1,
    minWidth: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingTop: 30,
    paddingBottom: 3,
  },
  handCardSlot: { position: 'relative', flexShrink: 0 },
  handCard: { position: 'absolute', bottom: 0, alignItems: 'center', ...shadow },
  handPlayAction: {
    width: '100%',
    minHeight: 38,
    marginTop: 5,
    paddingLeft: 10,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.particle,
    borderColor: colors.ink,
    borderWidth: 2,
    borderRadius: 4,
    ...shadow,
  },
  handPlayActionDisabled: { backgroundColor: colors.paperDim, borderColor: colors.inkSoft, shadowOpacity: 0, elevation: 0 },
  handPlayLabel: { flex: 1, color: colors.paperCard, fontFamily: fonts.display, fontSize: 9, letterSpacing: 0.65 },
  handPlayLabelDisabled: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 7.5, letterSpacing: 0 },
  handPlayCost: {
    minWidth: 31,
    height: 27,
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 10,
    lineHeight: 27,
    textAlign: 'center',
    backgroundColor: colors.energy,
    borderRadius: 13,
  },
  handPlayCostDisabled: { backgroundColor: colors.paperDeep, color: colors.inkSoft },
  selectionHint: { position: 'absolute', zIndex: 50, top: 7, left: '34%', right: '20%', alignItems: 'center' },
  selectionHintText: { color: colors.paperCard, fontFamily: fonts.display, fontSize: 9, letterSpacing: 0.6, textAlign: 'center', backgroundColor: colors.ink, paddingHorizontal: 11, paddingVertical: 6 },
  faceChoiceHost: { ...StyleSheet.absoluteFillObject, zIndex: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(33,29,25,0.42)' },
  faceChoice: { width: 520, maxWidth: '85%', padding: 18, alignItems: 'center', backgroundColor: colors.paperCard, borderColor: colors.ink, borderWidth: 3, borderRadius: 5, ...shadow },
  faceChoiceKicker: { color: colors.particle, fontFamily: fonts.type, fontSize: 8, letterSpacing: 1.3, textTransform: 'uppercase' },
  faceChoiceTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 18, marginTop: 5, textTransform: 'uppercase' },
  faceActions: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  faceButton: { minWidth: 195, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, borderColor: colors.ink, borderWidth: 2, borderRadius: 4 },
  faceA: { backgroundColor: '#F6DDD7' },
  faceB: { backgroundColor: '#D3ECEE' },
  faceLetter: { color: colors.paperCard, fontFamily: fonts.display, fontSize: 18, backgroundColor: colors.ink, paddingHorizontal: 9, paddingVertical: 5 },
  faceLabel: { color: colors.ink, fontFamily: fonts.display, fontSize: 11, textTransform: 'uppercase' },
  faceChance: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 8, marginTop: 3 },
  faceChoiceDismiss: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 7, letterSpacing: 0.8 },
  boardInspect: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  boardInspectCopy: { flex: 1, gap: 10 },
  boardInspectTitle: { color: colors.particle, fontFamily: fonts.display, fontSize: 13, textTransform: 'uppercase' },
  boardInspectText: { color: colors.ink, fontFamily: fonts.type, fontSize: 11, lineHeight: 16 },
})
