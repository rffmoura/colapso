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
  cue,
  validTarget,
  onTarget,
  onInfo,
  onSecret,
}: HeroPanelProps) {
  const side = game.sides[owner]
  const isAi = owner === 'ai'
  const impact = useSharedValue(0)
  const damage = cue?.kind === 'damage' && cue.target.kind === 'hero' && cue.target.owner === owner ? cue.amount : null

  useEffect(() => {
    if (damage === null) return
    impact.value = withSequence(
      withTiming(1, { duration: 75, reduceMotion: ReduceMotion.System }),
      withTiming(-1, { duration: 75, reduceMotion: ReduceMotion.System }),
      withTiming(0, { duration: 100, reduceMotion: ReduceMotion.System }),
    )
  }, [damage, impact])

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: impact.value * 5 }] }))
  const revealed = side.revealedSecrets.at(-1)

  return (
    <Animated.View style={[styles.panel, compact && styles.panelCompact, isAi ? styles.ai : styles.player, validTarget && styles.target, animatedStyle]}>
      <Pressable
        accessibilityRole={validTarget ? 'button' : undefined}
        accessibilityLabel={validTarget ? `Atacar diretamente ${isAi ? 'o Autômato' : 'o Observador'}` : undefined}
        onPress={validTarget ? onTarget : undefined}
        disabled={!validTarget}
        style={styles.identity}
      >
        <View style={[styles.mark, isAi && styles.robotMark]}>
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

      <View style={styles.handCounter} accessibilityLabel={`${side.hand.length} fichas na mão`}>
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
            width={compact ? 82 : 104}
            reserve={side.queuedSecrets.length}
            onPress={() => !isAi && onSecret(side.activeSecret!.id, false)}
          />
        ) : revealed ? (
          <NativeSecretCard id={revealed} compact used width={compact ? 82 : 104} onPress={() => onSecret(revealed, true)} />
        ) : (
          <View style={[styles.emptySecret, { width: compact ? 82 : 104 }]}><Text style={styles.emptyText}>SEM ARQUIVO</Text></View>
        )}
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel={`Consultar dados d${isAi ? 'o Autômato' : 'o Observador'}`} onPress={onInfo} style={styles.info} hitSlop={4}>
        <Text style={styles.infoText}>i</Text>
      </Pressable>

      {damage !== null && <View pointerEvents="none" style={styles.damage}><Text style={styles.damageText}>−{damage}</Text></View>}
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
    paddingRight: 43,
    backgroundColor: colors.paperCard,
    borderColor: colors.ink,
    borderWidth: 2,
    borderRadius: 8,
    ...shadow,
  },
  panelCompact: { height: 62, minWidth: 330, maxWidth: 410, gap: 5, padding: 4, paddingRight: 34 },
  ai: { borderTopColor: colors.particle, borderTopWidth: 5 },
  player: { borderTopColor: colors.wave, borderTopWidth: 5 },
  target: { borderColor: colors.energy, borderWidth: 4 },
  identity: { minWidth: 190, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  mark: { width: 55, height: 55, alignItems: 'center', justifyContent: 'center' },
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
  counterLabel: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 6, letterSpacing: 1 },
  counterValue: { color: colors.ink, fontFamily: fonts.display, fontSize: 19, lineHeight: 21 },
  secretSlot: { justifyContent: 'center' },
  emptySecret: { height: 53, alignItems: 'center', justifyContent: 'center', borderColor: colors.inkSoft, borderWidth: 1, borderStyle: 'dashed' },
  emptyText: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 7 },
  info: {
    position: 'absolute',
    right: 5,
    top: 5,
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
  damage: { position: 'absolute', left: 96, top: 14 },
  damageText: { color: colors.particle, fontFamily: fonts.display, fontSize: 25, textShadowColor: colors.paperCard, textShadowRadius: 2 },
})
