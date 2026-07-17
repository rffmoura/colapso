import { characterArt } from '@colapso/game-assets/native'
import { getDef, type Creature, type Keyword } from '@colapso/game-core'
import { Image } from 'expo-image'
import { memo, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View, type AccessibilityState, type ViewStyle } from 'react-native'
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg'
import type { PresentationCue } from '@colapso/game-session'
import { colors, fonts, shadow } from '../theme'

const ART_FOCUS: Record<string, number> = {
  sentinela: 24,
  ondapiloto: 17,
  gato: 20,
  neutrino: 15,
  colapsador: 18,
  quasar: 19,
}

const keywordLabel: Record<Keyword, string> = {
  barreira: 'BARREIRA',
  oscilacao: 'OSCILAÇÃO',
  fantasma: 'FANTASMA',
}

const INK_SPLATS = [
  { key: 0, left: 18, top: 31, size: 5 },
  { key: 1, left: 73, top: 24, size: 7 },
  { key: 2, left: 82, top: 58, size: 4 },
  { key: 3, left: 24, top: 68, size: 6 },
  { key: 4, left: 63, top: 76, size: 5 },
] as const

interface CardProps {
  testID?: string
  defId: string
  width: number
  height: number
  mode: 'hand' | 'board' | 'detail'
  creature?: Creature
  cue?: PresentationCue
  attackVector?: { x: number; y: number }
  selected?: boolean
  validTarget?: boolean
  playable?: boolean
  disabled?: boolean
  accessibilityLabel?: string
  accessibilityState?: AccessibilityState
  onPress?: () => void
  onKeywordPress?: (keyword: Keyword) => void
}

export const NativeCard = memo(function NativeCard({
  testID,
  defId,
  width,
  height,
  mode,
  creature,
  cue,
  attackVector,
  selected,
  validTarget,
  playable,
  disabled,
  accessibilityLabel,
  accessibilityState,
  onPress,
  onKeywordPress,
}: CardProps) {
  const def = getDef(defId)
  const compact = mode === 'board'
  const smallHand = mode === 'hand' && height <= 150
  const collapsed = creature?.collapsed ?? null
  const lungeX = useSharedValue(0)
  const lungeY = useSharedValue(0)
  const impact = useSharedValue(0)
  const collapse = useSharedValue(0)
  const entrance = useSharedValue(cue?.kind === 'summon' && creature?.uid === cue.uid ? 0 : 1)
  const damageProgress = useSharedValue(0)
  const stampProgress = useSharedValue(0)
  const oscillationProgress = useSharedValue(0)

  useEffect(() => {
    if (cue?.kind === 'attack' && creature?.uid === cue.attackerUid) {
      const fallbackY = creature.owner === 'player' ? -(compact ? 48 : 70) : compact ? 48 : 70
      const targetX = attackVector?.x ?? 0
      const targetY = attackVector?.y ?? fallbackY
      lungeX.value = withSequence(
        withTiming(-targetX * 0.08, {
          duration: 90,
          easing: Easing.inOut(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(targetX * 0.82, {
          duration: 180,
          easing: Easing.inOut(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(0, {
          duration: 150,
          easing: Easing.out(Easing.poly(4)),
          reduceMotion: ReduceMotion.System,
        }),
      )
      lungeY.value = withSequence(
        withTiming(-targetY * 0.08, {
          duration: 90,
          easing: Easing.inOut(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(targetY * 0.82, {
          duration: 180,
          easing: Easing.inOut(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(0, {
          duration: 150,
          easing: Easing.out(Easing.poly(4)),
          reduceMotion: ReduceMotion.System,
        }),
      )
    }
    if (cue?.kind === 'summon' && creature?.uid === cue.uid) {
      entrance.value = 0
      entrance.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.poly(4)),
        reduceMotion: ReduceMotion.System,
      })
    }
    if (cue?.kind === 'collapse' && creature?.uid === cue.uid) {
      stampProgress.value = 0
      stampProgress.value = withSequence(
        withTiming(1, {
          duration: 220,
          easing: Easing.out(Easing.poly(4)),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(0.96, { duration: 160, reduceMotion: ReduceMotion.System }),
      )
      collapse.value = withSequence(
        withTiming(1, { duration: 120, reduceMotion: ReduceMotion.System }),
        withTiming(0, { duration: 260, reduceMotion: ReduceMotion.System }),
      )
    }
    if (cue?.kind === 'oscillate' && creature?.uid === cue.uid) {
      oscillationProgress.value = 0
      oscillationProgress.value = withSequence(
        withTiming(1, {
          duration: 180,
          easing: Easing.out(Easing.poly(4)),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(0.94, { duration: 160, reduceMotion: ReduceMotion.System }),
      )
    }
    if (
      cue?.kind === 'damage' &&
      cue.target.kind === 'creature' &&
      creature?.uid === cue.target.uid
    ) {
      impact.value = withSequence(
        withTiming(1, { duration: 70, reduceMotion: ReduceMotion.System }),
        withTiming(-1, { duration: 70, reduceMotion: ReduceMotion.System }),
        withTiming(0, { duration: 90, reduceMotion: ReduceMotion.System }),
      )
      damageProgress.value = 0
      damageProgress.value = withTiming(1, {
        duration: 420,
        easing: Easing.out(Easing.poly(4)),
        reduceMotion: ReduceMotion.System,
      })
    }
  }, [
    attackVector?.x,
    attackVector?.y,
    collapse,
    compact,
    creature?.owner,
    creature?.uid,
    cue,
    damageProgress,
    entrance,
    impact,
    lungeX,
    lungeY,
    oscillationProgress,
    stampProgress,
  ])

  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: Math.abs(lungeX.value) + Math.abs(lungeY.value) > 0.5 ? 20 : 1,
    opacity: entrance.value,
    transform: [
      {
        translateY:
          lungeY.value +
          (1 - entrance.value) * (creature?.owner === 'ai' ? -44 : 44),
      },
      { translateX: lungeX.value + impact.value * 4 },
      {
        rotate: `${
          collapse.value * 1.5 +
          lungeX.value * 0.018 +
          (1 - entrance.value) * (creature?.owner === 'ai' ? 3 : -3)
        }deg`,
      },
      {
        scale:
          0.82 +
          entrance.value * 0.18 +
          collapse.value * 0.05 +
          Math.min(0.06, (Math.abs(lungeX.value) + Math.abs(lungeY.value)) * 0.00035),
      },
    ],
  }))

  const damageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, damageProgress.value * 6) * (1 - damageProgress.value),
    transform: [
      { translateY: -damageProgress.value * 18 },
      { scale: 0.82 + damageProgress.value * 0.35 },
    ],
  }))

  const stampAnimatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, stampProgress.value * 4),
    transform: [
      { rotate: `${-26 + stampProgress.value * 12}deg` },
      { scale: 2.3 - stampProgress.value * 1.3 },
    ],
  }))

  const splatAnimatedStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(0.78, (stampProgress.value - 0.45) * 2.4)),
    transform: [{ scale: 0.3 + stampProgress.value * 0.7 }],
  }))

  const oscillationAnimatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, oscillationProgress.value * 4),
    transform: [
      { translateY: (1 - oscillationProgress.value) * 12 },
      { scale: 0.86 + oscillationProgress.value * 0.14 },
    ],
  }))

  const source = characterArt[defId as keyof typeof characterArt]
  const cardStyle: ViewStyle[] = [
    styles.card,
    { width, height },
    selected ? styles.selected : null,
    validTarget ? styles.validTarget : null,
    playable ? styles.playable : null,
    disabled ? styles.disabled : null,
  ].filter(Boolean) as ViewStyle[]

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        testID={testID}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={accessibilityLabel ?? `${def.name}. ${def.title}`}
        accessibilityState={accessibilityState}
        disabled={!onPress}
        onPress={(event) => {
          event.stopPropagation()
          onPress?.()
        }}
        style={({ pressed }) => [cardStyle, pressed && onPress ? styles.pressed : null]}
      >
        <View style={[styles.header, compact && styles.headerCompact, smallHand && styles.headerHandCompact]}>
          <View style={styles.headerCopy}>
            <Text style={[styles.name, compact && styles.nameCompact, smallHand && styles.nameHandCompact]} numberOfLines={1} adjustsFontSizeToFit>
              {def.name}
            </Text>
            {!compact && <Text style={[styles.title, smallHand && styles.titleHandCompact]} numberOfLines={1}>{def.title}</Text>}
          </View>
          {mode !== 'board' && (
            <View style={[styles.cost, smallHand && styles.costHandCompact]}>
              <Text style={[styles.costText, smallHand && styles.costTextHandCompact]}>{def.cost}</Text>
            </View>
          )}
        </View>

        <View style={[styles.artWindow, compact && styles.artWindowCompact, smallHand && styles.artWindowHandCompact]}>
          {source ? (
            <Image
              source={source}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition={{ left: '50%', top: `${ART_FOCUS[defId] ?? 50}%` }}
              transition={80}
            />
          ) : (
            <ProtocolArt defId={defId} />
          )}
          {collapsed === null && def.type === 'criatura' && (
            <View style={styles.superBadge}>
              <Text style={[styles.superText, { color: colors.particle }]}>A</Text>
              <Text style={[styles.superText, { color: colors.wave }]}>B</Text>
            </View>
          )}
          {creature && collapsed !== null && (
            <View style={[styles.hpBadge, compact && styles.hpBadgeCompact]}>
              <Text style={[styles.hpValue, compact && styles.hpValueCompact]}>{creature.hp}</Text>
              {!compact && <Text style={styles.hpLabel}>VIDA</Text>}
            </View>
          )}
        </View>

        {def.faces ? (
          <View style={[styles.faces, compact && styles.facesCompact, smallHand && styles.facesHandCompact]}>
            {def.faces.map((face, index) => {
              const active = collapsed === index
              const faded = collapsed !== null && !active
              return (
                <View key={face.label} style={[styles.face, compact && styles.faceCompact, smallHand && styles.faceHandCompact, active && styles.faceActive, faded && styles.faceFaded]}>
                  <Text style={[styles.faceTag, (compact || smallHand) && styles.faceTagCompact, index === 0 ? styles.faceA : styles.faceB]}>{index === 0 ? 'A' : 'B'}</Text>
                  <Text style={[styles.faceName, compact && styles.faceNameCompact, smallHand && styles.faceNameHandCompact]} numberOfLines={1}>{face.label}</Text>
                  <View style={styles.keywords}>
                    {face.keywords.map((keyword) => (
                      <Pressable
                        key={keyword}
                        disabled={!onKeywordPress}
                        onPress={() => onKeywordPress?.(keyword)}
                        hitSlop={5}
                      >
                        <Text
                          numberOfLines={1}
                          style={[styles.keyword, (compact || smallHand) && styles.keywordCompact]}
                        >
                          {keywordLabel[keyword]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={[styles.stats, (compact || smallHand) && styles.statsCompact]}>
                    <Text style={{ color: colors.particle }}>{face.attack}</Text>/{face.health}
                  </Text>
                </View>
              )
            })}
          </View>
        ) : (
          <View style={styles.protocolRule}>
            <Text style={styles.protocolCode}>{def.title}</Text>
          </View>
        )}

        {!compact && !smallHand && (
          <Text style={[styles.body, mode === 'detail' && styles.bodyDetail]} numberOfLines={mode === 'detail' ? 5 : 3}>
            {def.text}
          </Text>
        )}

        {cue?.kind === 'collapse' && creature?.uid === cue.uid && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.stamp,
              { borderColor: cue.face === 0 ? colors.particle : colors.wave },
              stampAnimatedStyle,
            ]}
          >
            <Text style={[styles.stampText, { color: cue.face === 0 ? colors.particle : colors.wave }]}>OBSERVADO</Text>
          </Animated.View>
        )}
        {cue?.kind === 'collapse' && creature?.uid === cue.uid && (
          <View pointerEvents="none" style={styles.splatField}>
            {INK_SPLATS.map((splat) => (
              <Animated.View
                key={splat.key}
                style={[
                  styles.inkSplat,
                  {
                    left: `${splat.left}%`,
                    top: `${splat.top}%`,
                    width: splat.size,
                    height: splat.size,
                    borderRadius: splat.size / 2,
                    backgroundColor: cue.face === 0 ? colors.particle : colors.wave,
                  },
                  splatAnimatedStyle,
                ]}
              />
            ))}
          </View>
        )}
        {cue?.kind === 'oscillate' && creature?.uid === cue.uid && (
          <Animated.View pointerEvents="none" style={[styles.oscillation, oscillationAnimatedStyle]}>
            <Text style={styles.oscillationLabel}>OSCILAÇÃO</Text>
            <Text style={styles.oscillationStates}>
              {cue.from === 0 ? 'A' : 'B'} → {cue.to === 0 ? 'A' : 'B'}
            </Text>
          </Animated.View>
        )}
        {cue?.kind === 'damage' && cue.target.kind === 'creature' && creature?.uid === cue.target.uid && (
          <Animated.View pointerEvents="none" style={[styles.damageFloat, damageAnimatedStyle]}>
            <Text style={styles.damageText}>−{cue.amount}</Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  )
})

function ProtocolArt({ defId }: { defId: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 180 110">
      <Rect width="180" height="110" fill={colors.paperCard} />
      <Line x1="18" y1="24" x2="162" y2="24" stroke={colors.inkFaint} />
      <Line x1="18" y1="86" x2="162" y2="86" stroke={colors.inkFaint} />
      {defId === 'medicao' && <Path d="M24 55 Q90 8 156 55 Q90 102 24 55Z" fill="none" stroke={colors.ink} strokeWidth="6" />}
      {defId === 'polarizacao' && <Path d="M26 82 L90 18 L154 82 M90 18 V96" fill="none" stroke={colors.wave} strokeWidth="7" />}
      {defId === 'emaranhar' && <Path d="M36 76 C65 10 116 101 146 33" fill="none" stroke={colors.entangle} strokeWidth="7" />}
      {defId === 'tunel' && <Path d="M24 78 C58 8 122 8 156 78 M44 78 C68 36 112 36 136 78" fill="none" stroke={colors.ink} strokeWidth="6" />}
      {defId === 'pulso' && <Circle cx="90" cy="55" r="12" fill={colors.particle} stroke={colors.ink} strokeWidth="4" />}
      {defId === 'pulso' && <Circle cx="90" cy="55" r="36" fill="none" stroke={colors.energy} strokeWidth="5" />}
      {defId === 'decoerencia' && <Path d="M18 55 C38 20 57 90 77 55 S116 20 136 55 S156 90 168 55" fill="none" stroke={colors.wave} strokeWidth="6" />}
      {defId === 'flutuacao' && <Path d="M45 80 V28 H135 V80 M58 42 H121 M58 55 H110 M58 68 H125" fill="none" stroke={colors.ink} strokeWidth="5" />}
    </Svg>
  )
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: colors.paperCard,
    borderColor: colors.ink,
    borderWidth: 2,
    borderRadius: 7,
    ...shadow,
  },
  pressed: { transform: [{ scale: 0.985 }] },
  selected: { shadowOpacity: 0.3, elevation: 8 },
  validTarget: { backgroundColor: '#FFF8E6' },
  playable: { borderColor: colors.approve },
  disabled: { opacity: 0.48 },
  header: {
    minHeight: 38,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
  },
  headerCompact: { minHeight: 20, paddingHorizontal: 4, paddingVertical: 2 },
  headerHandCompact: { minHeight: 27, paddingHorizontal: 6, paddingVertical: 3 },
  headerCopy: { flex: 1, minWidth: 0 },
  name: { color: colors.paperCard, fontFamily: fonts.display, fontSize: 13, textTransform: 'uppercase' },
  nameCompact: { fontSize: 8 },
  nameHandCompact: { fontSize: 9 },
  title: { color: colors.paperDeep, fontFamily: fonts.type, fontSize: 8, marginTop: 1 },
  titleHandCompact: { fontSize: 6 },
  cost: {
    width: 27,
    height: 27,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.energy,
    borderColor: colors.ink,
    borderWidth: 1.5,
  },
  costHandCompact: { width: 23, height: 23, marginLeft: 4, borderRadius: 12 },
  costText: { color: colors.ink, fontFamily: fonts.display, fontSize: 13 },
  costTextHandCompact: { fontSize: 11 },
  artWindow: {
    height: '34%',
    marginHorizontal: 7,
    marginTop: 6,
    overflow: 'hidden',
    borderColor: colors.ink,
    borderWidth: 1.5,
    borderRadius: 4,
    backgroundColor: colors.paperDim,
  },
  artWindowCompact: { height: '42%', marginHorizontal: 3, marginTop: 2 },
  artWindowHandCompact: { height: '35%', marginHorizontal: 5, marginTop: 4 },
  superBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: colors.paperCard,
    borderColor: colors.ink,
    borderWidth: 1,
    borderRadius: 2,
  },
  superText: { fontFamily: fonts.display, fontSize: 9 },
  hpBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    minWidth: 31,
    height: 31,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.wave,
    borderColor: colors.ink,
    borderWidth: 1.5,
  },
  hpValue: { color: colors.paperCard, fontFamily: fonts.display, fontSize: 13, lineHeight: 14 },
  hpBadgeCompact: { right: 2, bottom: 2, minWidth: 21, height: 21, borderRadius: 11 },
  hpValueCompact: { fontSize: 9, lineHeight: 10 },
  hpLabel: { color: colors.paperCard, fontFamily: fonts.bodyBold, fontSize: 5 },
  faces: { gap: 3, paddingHorizontal: 7, paddingTop: 5 },
  facesCompact: { gap: 2, paddingHorizontal: 2, paddingTop: 2 },
  facesHandCompact: { gap: 2, paddingHorizontal: 5, paddingTop: 3 },
  face: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderColor: colors.paperDeep,
    borderWidth: 1,
    borderRadius: 3,
  },
  faceCompact: { minHeight: 15, gap: 1.5, paddingHorizontal: 1.5, paddingVertical: 1 },
  faceHandCompact: { minHeight: 19, gap: 2, paddingHorizontal: 3, paddingVertical: 1 },
  faceActive: { borderColor: colors.ink, borderWidth: 2, backgroundColor: '#F5EEDC' },
  faceFaded: { opacity: 0.35 },
  faceTag: {
    width: 17,
    height: 17,
    color: colors.paperCard,
    fontFamily: fonts.display,
    fontSize: 9,
    lineHeight: 17,
    textAlign: 'center',
    borderRadius: 3,
    overflow: 'hidden',
  },
  faceTagCompact: { width: 13, height: 13, fontSize: 7, lineHeight: 13 },
  faceA: { backgroundColor: colors.particle },
  faceB: { backgroundColor: colors.wave },
  faceName: { flexShrink: 1, color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase' },
  faceNameCompact: { fontSize: 6.2 },
  faceNameHandCompact: { fontSize: 7 },
  keywords: { flex: 1, minWidth: 0, flexDirection: 'row', gap: 2 },
  keyword: {
    flexShrink: 1,
    color: colors.ink,
    fontFamily: fonts.bodySemiBold,
    fontSize: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderColor: colors.inkSoft,
    borderWidth: 1,
    borderRadius: 3,
  },
  keywordCompact: {
    fontSize: 5.2,
    lineHeight: 7,
    paddingHorizontal: 1.5,
    paddingVertical: 1,
    letterSpacing: -0.15,
    backgroundColor: colors.paperDim,
    borderWidth: 0.8,
    borderRadius: 2,
  },
  stats: { color: colors.wave, fontFamily: fonts.display, fontSize: 11 },
  statsCompact: { fontSize: 8.5, letterSpacing: -0.2 },
  protocolRule: { marginHorizontal: 7, marginTop: 5, borderTopColor: colors.inkSoft, borderTopWidth: 1, paddingTop: 4 },
  protocolCode: { color: colors.entangle, fontFamily: fonts.type, fontSize: 8, textTransform: 'uppercase' },
  body: { flex: 1, color: colors.ink, fontFamily: fonts.type, fontSize: 9, lineHeight: 12, paddingHorizontal: 8, paddingTop: 6 },
  bodyDetail: { fontSize: 11, lineHeight: 15 },
  stamp: {
    position: 'absolute',
    zIndex: 22,
    top: '40%',
    alignSelf: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 3,
    backgroundColor: 'rgba(251,247,236,0.88)',
    transform: [{ rotate: '-7deg' }],
  },
  stampText: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 1 },
  splatField: { ...StyleSheet.absoluteFillObject, zIndex: 21 },
  inkSplat: { position: 'absolute' },
  oscillation: {
    position: 'absolute',
    zIndex: 22,
    top: '38%',
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(251,247,236,0.94)',
    borderColor: colors.entangle,
    borderWidth: 2,
    transform: [{ rotate: '-2deg' }],
  },
  oscillationLabel: { color: colors.entangle, fontFamily: fonts.display, fontSize: 8, letterSpacing: 0.8 },
  oscillationStates: { color: colors.ink, fontFamily: fonts.type, fontSize: 12, marginTop: 1 },
  damageFloat: { position: 'absolute', top: '22%', right: 8 },
  damageText: {
    color: colors.paperCard,
    fontFamily: fonts.display,
    fontSize: 18,
    textShadowColor: colors.particle,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
})
