import type { GameState, Owner, SecretId } from '@colapso/game-core'
import type { PresentationCue } from '@colapso/game-session'
import { memo, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated'
import { colors, fonts, shadow } from '../theme'
import { QuantumMark } from './QuantumMark'
import { NativeSecretCard } from './SecretCard'

interface HeroPanelProps {
  owner: Owner
  game: GameState
  compact: boolean
  narrow?: boolean
  cue?: PresentationCue
  validTarget?: boolean
  onTarget?: () => void
  onInfo: () => void
  onSecret: (id: SecretId, used: boolean) => void
}

export const HeroPanel = memo(function HeroPanel({
  owner,
  game,
  compact,
  narrow,
  cue,
  validTarget,
  onTarget,
  onInfo,
  onSecret,
}: HeroPanelProps) {
  const side = game.sides[owner]
  const isAi = owner === 'ai'
  const impact = useSharedValue(0)
  const damageProgress = useSharedValue(0)
  const damage = cue?.kind === 'damage' && cue.target.kind === 'hero' && cue.target.owner === owner ? cue.amount : null

  useEffect(() => {
    if (damage === null) return
    impact.value = withSequence(
      withTiming(1, { duration: 75, reduceMotion: ReduceMotion.System }),
      withTiming(-1, { duration: 75, reduceMotion: ReduceMotion.System }),
      withTiming(0, { duration: 100, reduceMotion: ReduceMotion.System }),
    )
    damageProgress.value = 0
    damageProgress.value = withTiming(1, {
      duration: 430,
      reduceMotion: ReduceMotion.System,
    })
  }, [damage, damageProgress, impact])

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: impact.value * 5 }] }))
  const damageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, damageProgress.value * 6) * (1 - damageProgress.value),
    transform: [
      { translateY: -damageProgress.value * 20 },
      { scale: 0.82 + damageProgress.value * 0.4 },
    ],
  }))
  const revealed = side.revealedSecrets.at(-1)

  return (
    <Animated.View style={[styles.panel, compact && styles.panelCompact, narrow && styles.panelNarrow, isAi ? styles.ai : styles.player, validTarget && styles.target, animatedStyle]}>
      <Pressable
        accessibilityRole={validTarget ? 'button' : undefined}
        accessibilityLabel={validTarget ? `Atacar diretamente ${isAi ? 'o Autômato' : 'o Observador'}` : undefined}
        accessibilityHint={validTarget ? 'Alvo direto disponível' : undefined}
        onPress={validTarget ? onTarget : undefined}
        disabled={!validTarget}
        style={[styles.identity, narrow && styles.identityNarrow]}
      >
        <View style={[styles.mark, narrow && styles.markNarrow, isAi && styles.robotMark]}>
          {isAi ? <Text style={styles.robot}>••{`\n`}▰</Text> : <QuantumMark size={compact ? 40 : 52} />}
        </View>
        <View style={styles.readout}>
          <Text style={styles.kicker}>{isAi ? (game.setup.boss ? 'AUTÔMATO SUPERVISOR' : 'O AUTÔMATO') : 'VOCÊ · OBSERVADOR'}</Text>
          <View style={styles.coherenceRow}>
            <Text style={styles.coherence}>{side.coherence}</Text>
            <Text style={styles.coherenceLabel}>COERÊNCIA</Text>
          </View>
          <Text style={styles.energy}>QUBITS {side.qubits}/{side.maxQubits}</Text>
        </View>
      </Pressable>

      <View style={[styles.handCounter, narrow && styles.handCounterNarrow]} accessibilityLabel={`${side.hand.length} fichas na mão`}>
        <Text style={styles.counterLabel}>MÃO</Text>
        <Text style={styles.counterValue}>{side.hand.length}</Text>
        <Text style={styles.counterLabel}>FICHAS</Text>
      </View>

      <View style={styles.secretSlot}>
        {side.activeSecret ? (
          <NativeSecretCard
            id={side.activeSecret.id}
            hidden={isAi}
            compact
            micro={compact}
            width={narrow ? 70 : compact ? 82 : 104}
            reserve={side.queuedSecrets.length}
            onPress={() => !isAi && onSecret(side.activeSecret!.id, false)}
          />
        ) : revealed ? (
          <NativeSecretCard id={revealed} compact micro={compact} used width={narrow ? 70 : compact ? 82 : 104} onPress={() => onSecret(revealed, true)} />
        ) : (
          <View style={[styles.emptySecret, compact && styles.emptySecretCompact, { width: narrow ? 70 : compact ? 82 : 104 }]}><Text style={styles.emptyText}>SEM ARQUIVO</Text></View>
        )}
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel={`Consultar dados d${isAi ? 'o Autômato' : 'o Observador'}`} onPress={onInfo} style={styles.info} hitSlop={8}>
        <Text style={styles.infoText}>i</Text>
      </Pressable>

      {validTarget && <View pointerEvents="none" style={styles.directTarget}><Text style={styles.directTargetText}>ALVO DIRETO</Text></View>}

      {damage !== null && <Animated.View pointerEvents="none" style={[styles.damage, damageAnimatedStyle]}><Text style={styles.damageText}>−{damage}</Text></Animated.View>}
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  panel: {
    height: 86,
    minWidth: 390,
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 7,
    backgroundColor: colors.paperCard,
    borderColor: colors.ink,
    borderWidth: 2,
    borderRadius: 8,
    ...shadow,
  },
  panelCompact: { width: 410, height: 62, minWidth: 410, maxWidth: 410, gap: 5, padding: 4 },
  panelNarrow: { width: 292, minWidth: 292, maxWidth: 292, gap: 3 },
  ai: { borderTopColor: colors.particle, borderTopWidth: 5 },
  player: { borderTopColor: colors.wave, borderTopWidth: 5 },
  target: { borderColor: colors.particle, backgroundColor: '#F8EDE2', transform: [{ translateY: 2 }] },
  identity: { minWidth: 190, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  identityNarrow: { minWidth: 126, gap: 3 },
  mark: { width: 55, height: 55, alignItems: 'center', justifyContent: 'center' },
  markNarrow: { width: 42, height: 42 },
  robotMark: { borderColor: colors.ink, borderWidth: 2, borderRadius: 25, backgroundColor: colors.paperDim },
  robot: { color: colors.particle, fontFamily: fonts.display, fontSize: 13, lineHeight: 13, textAlign: 'center' },
  readout: { flex: 1, minWidth: 0 },
  kicker: { color: colors.ink, fontFamily: fonts.type, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  coherenceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  coherence: { color: colors.approve, fontFamily: fonts.display, fontSize: 28, lineHeight: 30 },
  coherenceLabel: { color: colors.ink, fontFamily: fonts.type, fontSize: 8 },
  energy: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 8 },
  handCounter: {
    width: 48,
    height: '92%',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.wave,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 3,
    backgroundColor: colors.paperDim,
  },
  handCounterNarrow: { width: 38 },
  counterLabel: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 6, letterSpacing: 1 },
  counterValue: { color: colors.ink, fontFamily: fonts.display, fontSize: 19, lineHeight: 21 },
  secretSlot: { flexShrink: 0, justifyContent: 'center' },
  emptySecret: { height: 53, alignItems: 'center', justifyContent: 'center', borderColor: colors.inkSoft, borderWidth: 1, borderStyle: 'dashed' },
  emptySecretCompact: { height: 48 },
  emptyText: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 7 },
  info: {
    flexShrink: 0,
    width: 29,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.ink,
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: colors.paperCard,
  },
  infoText: { color: colors.ink, fontFamily: fonts.display, fontSize: 13 },
  directTarget: { position: 'absolute', right: 12, bottom: -10, paddingHorizontal: 8, paddingVertical: 3, borderColor: colors.particle, borderWidth: 1.5, backgroundColor: colors.paperCard, transform: [{ rotate: '1deg' }] },
  directTargetText: { color: colors.particle, fontFamily: fonts.display, fontSize: 7, letterSpacing: 0.6 },
  damage: { position: 'absolute', left: 96, top: 14 },
  damageText: { color: colors.particle, fontFamily: fonts.display, fontSize: 25, textShadowColor: colors.paperCard, textShadowRadius: 2 },
})
