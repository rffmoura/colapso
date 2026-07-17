import { getDef, getSecret } from '@colapso/game-core'
import type { PresentationCue } from '@colapso/game-session'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { useSfx, type SoundId } from '../audio'
import { useNativeSettings } from '../settings'
import { colors, fonts, shadow } from '../theme'
import { NativeCard } from './Card'
import { NativeSecretCard } from './SecretCard'

export interface PresentationGeometry {
  from?: { x: number; y: number }
  to?: { x: number; y: number }
}

export function CueHost({
  cue,
  acknowledge,
  geometry,
}: {
  cue?: PresentationCue
  acknowledge: (id: number) => void
  geometry?: PresentationGeometry
}) {
  const progress = useSharedValue(0)
  const { play } = useSfx()
  const { haptics } = useNativeSettings()
  const finish = useCallback((id: number) => acknowledge(id), [acknowledge])
  const playRef = useRef(play)
  const hapticsRef = useRef(haptics)
  const finishRef = useRef(finish)
  const cueRef = useRef(cue)
  const progressRef = useRef(progress)
  playRef.current = play
  hapticsRef.current = haptics
  finishRef.current = finish
  cueRef.current = cue

  useEffect(() => {
    const currentCue = cueRef.current
    if (!currentCue) return
    const duration = durationForCue(currentCue)
    const completion = setTimeout(() => finishRef.current(currentCue.presentationId), duration)
    const feedbackDelay = currentCue.kind === 'attack' ? 270 : 0
    const performFeedback = () => {
      const sound = soundForCue(currentCue)
      if (sound) playRef.current(sound)
      const haptic = hapticForCue(currentCue)
      if (hapticsRef.current && haptic) void haptic()
    }
    const feedback = feedbackDelay > 0 ? setTimeout(performFeedback, feedbackDelay) : null
    if (!feedback) performFeedback()
    try {
      cancelAnimation(progressRef.current)
      progressRef.current.value = 0
      progressRef.current.value = withTiming(
        1,
        {
          duration,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        },
      )
    } catch {
      // A apresentação visual pode falhar sem bloquear a partida.
    }
    return () => {
      clearTimeout(completion)
      if (feedback) clearTimeout(feedback)
    }
  }, [cue?.presentationId])

  const animated = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 5) * Math.min(1, (1 - progress.value) * 7),
    transform: [{ translateY: (1 - progress.value) * 12 }, { scale: 0.97 + progress.value * 0.03 }],
  }))

  const revealAnimated = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 4) * Math.min(1, (1 - progress.value) * 6),
    transform: [
      { translateY: (1 - progress.value) * 34 },
      { rotate: `${-3 + progress.value * 2.2}deg` },
      { scale: 0.9 + progress.value * 0.1 },
    ],
  }))

  const turnAnimated = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 5) * Math.min(1, (1 - progress.value) * 7),
    transform: [
      { translateX: (1 - progress.value) * -90 },
      { rotate: `${-1.8 + progress.value * 1.2}deg` },
    ],
  }))

  const drawAnimated = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 5) * Math.min(1, (1 - progress.value) * 8),
    transform: [
      { translateX: (1 - progress.value) * 180 },
      { translateY: (1 - progress.value) * 28 },
      { rotate: `${18 - progress.value * 20}deg` },
      { scale: 0.78 + progress.value * 0.22 },
    ],
  }))

  const commitAnimated = useAnimatedStyle(() => {
    if (geometry?.from && geometry.to) {
      return {
        opacity: Math.min(1, progress.value * 7) * Math.min(1, (1 - progress.value) * 9),
        transform: [
          { translateX: (geometry.to.x - geometry.from.x) * progress.value },
          { translateY: (geometry.to.y - geometry.from.y) * progress.value },
          { rotate: `${13 - progress.value * 14.2}deg` },
          { scale: 0.88 + progress.value * 0.12 },
        ],
      }
    }
    const fromTop = cue?.kind === 'cardCommit' && cue.owner === 'ai'
    const protocol = cue?.kind === 'cardCommit' && cue.destination === 'protocol'
    const travel = 1 - progress.value
    return {
      opacity: Math.min(1, progress.value * 7) * Math.min(1, (1 - progress.value) * 9),
      transform: [
        { translateX: travel * (protocol ? 150 : -120) },
        { translateY: travel * (fromTop ? -240 : 250) },
        { rotate: `${travel * (fromTop ? -11 : 13) - progress.value * 1.2}deg` },
        { scale: 0.78 + progress.value * 0.22 },
      ],
    }
  })

  const deathAnimated = useAnimatedStyle(() => {
    const translateX = geometry?.from && geometry.to
      ? (geometry.to.x - geometry.from.x) * progress.value
      : progress.value * 260
    const translateY = geometry?.from && geometry.to
      ? (geometry.to.y - geometry.from.y) * progress.value
      : progress.value * 115
    return {
      opacity: Math.min(1, progress.value * 8) * Math.min(1, (1 - progress.value) * 6),
      transform: [
        { translateX },
        { translateY },
        { rotate: `${-2 + progress.value * 19}deg` },
        { scale: 1 - progress.value * 0.28 },
      ],
    }
  })

  const pileAnimated = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 7) * Math.min(1, (1 - progress.value) * 7),
    transform: [
      { translateX: (1 - progress.value) * 90 },
      { rotate: `${(1 - progress.value) * 12 - 2}deg` },
      { scale: 0.86 + progress.value * 0.14 },
    ],
  }))

  if (!cue) return null
  if (cue.kind === 'aiDecision') return null

  if (cue.kind === 'turn') {
    return (
      <View pointerEvents="none" style={styles.turnHost}>
        <Animated.View style={[styles.turnBanner, cue.owner === 'ai' && styles.turnBannerAi, turnAnimated]}>
          <Text style={styles.turnKicker}>ORDEM DE SERVIÇO · TURNO {cue.turn}</Text>
          <Text style={[styles.turnTitle, cue.owner === 'ai' && styles.turnTitleAi]}>
            {cue.owner === 'player' ? 'SEU TURNO' : 'TURNO DO AUTÔMATO'}
          </Text>
          <View style={[styles.turnRule, cue.owner === 'ai' && styles.turnRuleAi]} />
        </Animated.View>
      </View>
    )
  }

  if (cue.kind === 'draw') {
    return (
      <View
        pointerEvents="none"
        style={[styles.drawHost, cue.owner === 'ai' ? styles.drawHostAi : styles.drawHostPlayer]}
      >
        <Animated.View style={[styles.drawPacket, drawAnimated]}>
          {Array.from({ length: Math.min(3, cue.count) }, (_, index) => (
            <DrawPacketCard key={index} index={index} progress={progress} />
          ))}
          <Text style={styles.drawLabel}>ARQUIVO +{cue.count}</Text>
        </Animated.View>
      </View>
    )
  }

  if (cue.kind === 'cardCommit') {
    return (
      <View pointerEvents="none" style={styles.commitHost}>
        <Animated.View
          style={[
            styles.commitCard,
            geometry?.from && {
              position: 'absolute',
              left: geometry.from.x - 55,
              top: geometry.from.y - 77,
            },
            commitAnimated,
          ]}
        >
          <NativeCard defId={cue.defId} mode="hand" width={110} height={154} />
          <Text style={[styles.commitStamp, cue.destination === 'protocol' && styles.commitStampProtocol]}>
            {cue.destination === 'protocol' ? 'PROTOCOLO' : 'REGISTRADO'}
          </Text>
        </Animated.View>
      </View>
    )
  }

  if (cue.kind === 'death') {
    return (
      <View pointerEvents="none" style={styles.deathHost}>
        <Animated.View
          style={[
            styles.deathCard,
            geometry?.from && {
              position: 'absolute',
              left: geometry.from.x - 52,
              top: geometry.from.y - 72.5,
            },
            deathAnimated,
          ]}
        >
          <NativeCard defId={cue.defId} mode="board" width={104} height={145} />
          <Text style={styles.archivedStamp}>ARQUIVADO</Text>
        </Animated.View>
      </View>
    )
  }

  if (cue.kind === 'burn' || cue.kind === 'reshuffle') {
    return (
      <View pointerEvents="none" style={styles.pileEventHost}>
        <Animated.View style={[styles.pileEvent, pileAnimated]}>
          {cue.kind === 'burn' ? (
            <NativeCard defId={cue.defId} mode="board" width={86} height={120} />
          ) : (
            <View style={styles.reshufflePacket}>
              {Array.from({ length: 4 }, (_, index) => (
                <View key={index} style={[styles.reshuffleCard, { left: index * 4, top: index * 2 }]} />
              ))}
            </View>
          )}
          <Text style={styles.pileEventStamp}>{cue.kind === 'burn' ? 'MÃO CHEIA' : 'REARQUIVADO'}</Text>
        </Animated.View>
      </View>
    )
  }

  const blockingCard = cue.kind === 'protocolReveal' || cue.kind === 'secretReveal'

  if (blockingCard) {
    return (
      <View pointerEvents="none" style={styles.blockingBackdrop}>
        <Animated.View style={[styles.fileReveal, revealAnimated]}>
          <View style={styles.revealCopy}>
            <Text style={styles.revealKicker}>{cue.kind === 'protocolReveal' ? 'protocolo interceptado do autômato' : cue.owner === 'player' ? 'seu arquivo de segurança' : 'arquivo interceptado do autômato'}</Text>
            <Text style={styles.revealTitle}>{cue.kind === 'protocolReveal' ? getDef(cue.defId).name : getSecret(cue.id).name}</Text>
            <Text style={styles.revealText}>{cue.kind === 'protocolReveal' ? getDef(cue.defId).text : getSecret(cue.id).text}</Text>
          </View>
          {cue.kind === 'protocolReveal' ? (
            <NativeCard defId={cue.defId} mode="detail" width={156} height={220} />
          ) : (
            <NativeSecretCard id={cue.id} width={205} />
          )}
        </Animated.View>
      </View>
    )
  }

  const label = cueLabel(cue)
  if (!label) return <View pointerEvents="none" />
  return (
    <View pointerEvents="none" style={styles.toastHost}>
      <Animated.View style={[styles.toast, cue.kind === 'feedback' && cue.tone === 'deny' && styles.toastDeny, animated]}>
        <Text style={styles.toastText}>{label}</Text>
      </Animated.View>
    </View>
  )
}

function DrawPacketCard({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const staggered = useAnimatedStyle(() => {
    const delay = index * 0.115
    const local = Math.max(0, Math.min(1, (progress.value - delay) / (1 - delay)))
    return {
      opacity: local,
      transform: [
        { translateX: (1 - local) * 18 },
        { rotate: `${(1 - local) * 8}deg` },
      ],
    }
  })
  return (
    <Animated.View style={[styles.drawCard, { left: index * 8, top: index * 3 }, staggered]}>
      <Text style={styles.drawCardText}>½</Text>
    </Animated.View>
  )
}

function durationForCue(cue: PresentationCue) {
  switch (cue.kind) {
    case 'aiDecision': return 680
    case 'protocolReveal': return 1750
    case 'secretReveal': return 2200
    case 'turn': return 1050
    case 'gameover': return 1000
    case 'attack': return 520
    case 'cardCommit': return 520
    case 'collapse': return 900
    case 'damage': return 440
    case 'death': return 580
    case 'burn': case 'reshuffle': return 560
    case 'summon': return 520
    case 'draw': return 480
    case 'spell': return 620
    case 'feedback': return 850
    default: return cue.blocking ? 560 : 360
  }
}

function soundForCue(cue: PresentationCue): SoundId | null {
  switch (cue.kind) {
    case 'aiDecision': return null
    case 'draw': return 'draw'
    case 'cardCommit': return cue.destination === 'board' ? 'play' : null
    case 'summon': return null
    case 'spell': return 'spell'
    case 'protocolReveal': return null
    case 'collapse': return 'collapse'
    case 'influence': return null
    case 'heropower': return 'spell'
    case 'oscillate': return 'oscillate'
    case 'attack': return 'hit'
    case 'damage': return cue.source === 'secret' ? 'hit' : null
    case 'echo': return null
    case 'death': return 'death'
    case 'entangle': return 'entangle'
    case 'secretReveal': return 'secret'
    case 'secretTrigger': case 'secretArmed': return null
    case 'turn': return 'turn'
    case 'gameover': return cue.winner === 'player' ? 'win' : 'lose'
    case 'feedback': return cue.tone === 'deny' ? 'deny' : 'select'
    case 'burn': case 'reshuffle': return null
    case 'runRestored': return 'select'
    default: return null
  }
}

function hapticForCue(cue: PresentationCue): (() => Promise<void>) | null {
  if (cue.kind === 'gameover' || cue.kind === 'secretReveal' || cue.kind === 'collapse') {
    return () => Haptics.notificationAsync(
      cue.kind === 'gameover'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    )
  }
  if (cue.kind === 'attack' || (cue.kind === 'damage' && cue.source === 'secret')) {
    return () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }
  if (
    cue.kind === 'damage'
    || cue.kind === 'death'
    || cue.kind === 'echo'
    || cue.kind === 'summon'
    || cue.kind === 'protocolReveal'
    || cue.kind === 'influence'
    || cue.kind === 'secretTrigger'
    || cue.kind === 'secretArmed'
    || cue.kind === 'burn'
    || cue.kind === 'reshuffle'
    || cue.kind === 'aiDecision'
  ) return null
  return () => Haptics.selectionAsync()
}

function cueLabel(cue: PresentationCue) {
  switch (cue.kind) {
    case 'turn': return null
    case 'collapse': return null
    case 'damage': return null
    case 'death': return null
    case 'entangle': return 'EMARANHAMENTO REGISTRADO'
    case 'oscillate': return null
    case 'secretTrigger': return 'CONTRAMEDIDA ATIVADA'
    case 'secretArmed': return 'SEGUNDO ARQUIVO ARMADO'
    case 'gameover': return cue.winner === 'player' ? 'SETOR VENCIDO' : 'COERÊNCIA PERDIDA'
    case 'feedback': return cue.message.toUpperCase()
    case 'runRestored': return 'PLANTÃO RETOMADO · O DUELO SERÁ REINICIADO'
    case 'burn': return 'MÃO CHEIA · FICHA DESCARTADA'
    case 'reshuffle': return 'ARQUIVO REORGANIZADO'
    case 'heropower': return 'OBSERVAÇÃO INICIADA'
    case 'influence': return cue.success ? 'INFLUÊNCIA CONFIRMADA' : 'INTERFERÊNCIA DESVIADA'
    case 'aiDecision': return null
    default: return null
  }
}

const styles = StyleSheet.create({
  blockingBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(31,27,23,0.66)' },
  fileReveal: {
    width: 650,
    maxWidth: '88%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    padding: 22,
    backgroundColor: colors.paperCard,
    borderColor: colors.ink,
    borderWidth: 3,
    borderRadius: 5,
    ...shadow,
  },
  revealCopy: { flex: 1 },
  revealKicker: { color: colors.particle, fontFamily: fonts.type, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' },
  revealTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 31, lineHeight: 32, marginTop: 8, textTransform: 'uppercase' },
  revealText: { color: colors.ink, fontFamily: fonts.type, fontSize: 12, lineHeight: 17, marginTop: 13 },
  turnHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnBanner: {
    minWidth: 360,
    maxWidth: '78%',
    paddingHorizontal: 26,
    paddingVertical: 14,
    backgroundColor: colors.paperCard,
    borderColor: colors.ink,
    borderWidth: 3,
    ...shadow,
  },
  turnBannerAi: { backgroundColor: colors.confidential, borderColor: colors.particle },
  turnKicker: {
    color: colors.particle,
    fontFamily: fonts.type,
    fontSize: 8,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  turnTitle: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: 1.4,
    textAlign: 'center',
    marginTop: 4,
  },
  turnTitleAi: { color: colors.paperCard },
  turnRule: { height: 4, marginTop: 8, backgroundColor: colors.wave },
  turnRuleAi: { backgroundColor: colors.particle },
  drawHost: {
    position: 'absolute',
    zIndex: 68,
    width: 150,
    height: 100,
  },
  drawHostPlayer: { right: 105, bottom: 58 },
  drawHostAi: { right: 105, top: 58 },
  drawPacket: { flex: 1 },
  drawCard: {
    position: 'absolute',
    width: 42,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paperDim,
    borderColor: colors.ink,
    borderWidth: 2,
    borderRadius: 4,
    ...shadow,
  },
  drawCardText: { color: colors.inkSoft, fontFamily: fonts.display, fontSize: 16 },
  drawLabel: {
    position: 'absolute',
    left: 52,
    top: 18,
    color: colors.paperCard,
    fontFamily: fonts.display,
    fontSize: 8,
    letterSpacing: 0.7,
    paddingHorizontal: 7,
    paddingVertical: 5,
    backgroundColor: colors.ink,
  },
  commitHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commitCard: { position: 'relative', ...shadow },
  commitStamp: {
    position: 'absolute',
    right: -17,
    bottom: 18,
    color: colors.approve,
    fontFamily: fonts.display,
    fontSize: 8,
    letterSpacing: 0.6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: colors.paperCard,
    borderColor: colors.approve,
    borderWidth: 2,
    transform: [{ rotate: '-7deg' }],
  },
  commitStampProtocol: { color: colors.particle, borderColor: colors.particle },
  deathHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deathCard: { position: 'relative', ...shadow },
  archivedStamp: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
    color: colors.particle,
    fontFamily: fonts.display,
    fontSize: 10,
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.paperCard,
    borderColor: colors.particle,
    borderWidth: 2.5,
    transform: [{ rotate: '-9deg' }],
  },
  pileEventHost: {
    position: 'absolute',
    zIndex: 74,
    right: 92,
    bottom: 34,
    width: 150,
    height: 155,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pileEvent: { position: 'relative' },
  pileEventStamp: {
    position: 'absolute',
    right: -28,
    bottom: 11,
    color: colors.particle,
    fontFamily: fonts.display,
    fontSize: 7,
    letterSpacing: 0.6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: colors.paperCard,
    borderColor: colors.particle,
    borderWidth: 2,
    transform: [{ rotate: '-5deg' }],
  },
  reshufflePacket: { width: 92, height: 126 },
  reshuffleCard: {
    position: 'absolute',
    width: 78,
    height: 110,
    backgroundColor: colors.paperDim,
    borderColor: colors.ink,
    borderWidth: 2,
    borderRadius: 4,
    ...shadow,
  },
  toastHost: { ...StyleSheet.absoluteFillObject, zIndex: 70, alignItems: 'center', justifyContent: 'center' },
  toast: { maxWidth: 420, paddingHorizontal: 19, paddingVertical: 11, backgroundColor: colors.ink, borderColor: colors.paperCard, borderWidth: 2, borderRadius: 3, ...shadow },
  toastDeny: { backgroundColor: colors.particle },
  toastText: { color: colors.paperCard, fontFamily: fonts.display, fontSize: 14, letterSpacing: 1.2, textAlign: 'center' },
})
