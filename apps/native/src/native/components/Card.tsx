import { characterArt } from '@colapso/game-assets/native'
import { getDef, type Creature, type Keyword } from '@colapso/game-core'
import { Image } from 'expo-image'
import { memo, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
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

interface CardProps {
  defId: string
  width: number
  height: number
  mode: 'hand' | 'board' | 'detail'
  creature?: Creature
  cue?: PresentationCue
  selected?: boolean
  validTarget?: boolean
  disabled?: boolean
  onPress?: () => void
  onKeywordPress?: (keyword: Keyword) => void
}

export const NativeCard = memo(function NativeCard({
  defId,
  width,
  height,
  mode,
  creature,
  cue,
  selected,
  validTarget,
  disabled,
  onPress,
  onKeywordPress,
}: CardProps) {
  const def = getDef(defId)
  const compact = mode === 'board'
  const collapsed = creature?.collapsed ?? null
  const lunge = useSharedValue(0)
  const impact = useSharedValue(0)
  const collapse = useSharedValue(0)

  useEffect(() => {
    if (cue?.kind === 'attack' && creature?.uid === cue.attackerUid) {
      const direction = creature.owner === 'player' ? -1 : 1
      lunge.value = withSequence(
        withTiming(direction * 34, {
          duration: 170,
          easing: Easing.out(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(0, { duration: 150, reduceMotion: ReduceMotion.System }),
      )
    }
    if (cue?.kind === 'collapse' && creature?.uid === cue.uid) {
      collapse.value = withSequence(
        withTiming(1, { duration: 120, reduceMotion: ReduceMotion.System }),
        withTiming(0, { duration: 260, reduceMotion: ReduceMotion.System }),
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
    }
  }, [collapse, creature?.owner, creature?.uid, cue, impact, lunge])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lunge.value },
      { translateX: impact.value * 4 },
      { rotate: `${collapse.value * 1.5}deg` },
      { scale: 1 + collapse.value * 0.05 },
    ],
  }))

  const source = characterArt[defId as keyof typeof characterArt]
  const cardStyle: ViewStyle[] = [
    styles.card,
    { width, height },
    selected ? styles.selected : null,
    validTarget ? styles.validTarget : null,
    disabled ? styles.disabled : null,
  ].filter(Boolean) as ViewStyle[]

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${def.name}. ${def.title}`}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && onPress ? styles.pressed : null]}
      >
        <View style={[styles.header, compact && styles.headerCompact]}>
          <View style={styles.headerCopy}>
            <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1} adjustsFontSizeToFit>
              {def.name}
            </Text>
            {!compact && <Text style={styles.title} numberOfLines={1}>{def.title}</Text>}
          </View>
          {mode !== 'board' && (
            <View style={styles.cost}>
              <Text style={styles.costText}>{def.cost}</Text>
            </View>
          )}
        </View>

        <View style={[styles.artWindow, compact && styles.artWindowCompact]}>
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
            <View style={styles.hpBadge}>
              <Text style={styles.hpValue}>{creature.hp}</Text>
              {!compact && <Text style={styles.hpLabel}>VIDA</Text>}
            </View>
          )}
        </View>

        {def.faces ? (
          <View style={[styles.faces, compact && styles.facesCompact]}>
            {def.faces.map((face, index) => {
              const active = collapsed === index
              const faded = collapsed !== null && !active
              return (
                <View key={face.label} style={[styles.face, active && styles.faceActive, faded && styles.faceFaded]}>
                  <Text style={[styles.faceTag, index === 0 ? styles.faceA : styles.faceB]}>{index === 0 ? 'A' : 'B'}</Text>
                  <Text style={[styles.faceName, compact && styles.faceNameCompact]} numberOfLines={1}>{face.label}</Text>
                  <View style={styles.keywords}>
                    {face.keywords.map((keyword) => (
                      <Pressable
                        key={keyword}
                        disabled={!onKeywordPress}
                        onPress={() => onKeywordPress?.(keyword)}
                        hitSlop={5}
                      >
                        <Text style={[styles.keyword, compact && styles.keywordCompact]}>{keywordLabel[keyword]}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={[styles.stats, compact && styles.statsCompact]}>
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

        {!compact && (
          <Text style={[styles.body, mode === 'detail' && styles.bodyDetail]} numberOfLines={mode === 'detail' ? 5 : 3}>
            {def.text}
          </Text>
        )}

        {cue?.kind === 'collapse' && creature?.uid === cue.uid && (
          <View pointerEvents="none" style={styles.stamp}>
            <Text style={styles.stampText}>OBSERVADO</Text>
          </View>
        )}
        {cue?.kind === 'damage' && cue.target.kind === 'creature' && creature?.uid === cue.target.uid && (
          <View pointerEvents="none" style={styles.damageFloat}>
            <Text style={styles.damageText}>−{cue.amount}</Text>
          </View>
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
  selected: { borderColor: colors.wave, borderWidth: 4 },
  validTarget: { borderColor: colors.energy, borderWidth: 4 },
  disabled: { opacity: 0.48 },
  header: {
    minHeight: 38,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
  },
  headerCompact: { minHeight: 25, paddingHorizontal: 6, paddingVertical: 4 },
  headerCopy: { flex: 1, minWidth: 0 },
  name: { color: colors.paperCard, fontFamily: fonts.display, fontSize: 13, textTransform: 'uppercase' },
  nameCompact: { fontSize: 10 },
  title: { color: colors.paperDeep, fontFamily: fonts.type, fontSize: 8, marginTop: 1 },
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
  costText: { color: colors.ink, fontFamily: fonts.display, fontSize: 13 },
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
  artWindowCompact: { height: '43%', marginHorizontal: 4, marginTop: 4 },
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
  hpLabel: { color: colors.paperCard, fontFamily: fonts.bodyBold, fontSize: 5 },
  faces: { gap: 3, paddingHorizontal: 7, paddingTop: 5 },
  facesCompact: { gap: 2, paddingHorizontal: 4, paddingTop: 4 },
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
  faceA: { backgroundColor: colors.particle },
  faceB: { backgroundColor: colors.wave },
  faceName: { flexShrink: 1, color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase' },
  faceNameCompact: { fontSize: 7 },
  keywords: { flex: 1, flexDirection: 'row', gap: 2 },
  keyword: {
    color: colors.ink,
    fontFamily: fonts.bodySemiBold,
    fontSize: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderColor: colors.inkSoft,
    borderWidth: 1,
    borderRadius: 3,
  },
  keywordCompact: { fontSize: 5, paddingHorizontal: 2 },
  stats: { color: colors.wave, fontFamily: fonts.display, fontSize: 11 },
  statsCompact: { fontSize: 9 },
  protocolRule: { marginHorizontal: 7, marginTop: 5, borderTopColor: colors.inkSoft, borderTopWidth: 1, paddingTop: 4 },
  protocolCode: { color: colors.entangle, fontFamily: fonts.type, fontSize: 8, textTransform: 'uppercase' },
  body: { flex: 1, color: colors.ink, fontFamily: fonts.type, fontSize: 9, lineHeight: 12, paddingHorizontal: 8, paddingTop: 6 },
  bodyDetail: { fontSize: 11, lineHeight: 15 },
  stamp: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderColor: colors.particle,
    borderWidth: 3,
    backgroundColor: 'rgba(251,247,236,0.88)',
    transform: [{ rotate: '-7deg' }],
  },
  stampText: { color: colors.particle, fontFamily: fonts.display, fontSize: 11, letterSpacing: 1 },
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
