import { getSecret, type SecretId } from '@colapso/game-core'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, shadow } from '../theme'

interface SecretCardProps {
  id?: SecretId
  hidden?: boolean
  used?: boolean
  compact?: boolean
  dense?: boolean
  width?: number
  onPress?: () => void
  actionLabel?: string
  reserve?: number
}

export function NativeSecretCard({
  id,
  hidden,
  used,
  compact,
  dense,
  width = compact ? 108 : 220,
  onPress,
  actionLabel,
  reserve = 0,
}: SecretCardProps) {
  const def = id ? getSecret(id) : null
  const name = hidden ? (compact ? 'Protocolo sob sigilo' : 'Contramedida confidencial') : def?.name ?? 'Arquivo utilizado'
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={hidden ? 'Contramedida confidencial do Autômato' : def ? `${def.name}. ${def.text}` : name}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        dense && styles.cardDense,
        { width, minHeight: compact ? 74 : dense ? 145 : 230 },
        hidden && styles.hidden,
        used && styles.used,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.notch} />
      <View style={[styles.seal, hidden && styles.hiddenSeal]}><Text style={styles.sealText}>C</Text></View>
      <Text style={[styles.code, dense && styles.codeDense, hidden && styles.hiddenText]}>{hidden ? 'CT-??' : def?.code ?? 'CT-—'}</Text>
      <Text style={[styles.name, compact && styles.nameCompact, dense && styles.nameDense, hidden && styles.hiddenText]} numberOfLines={compact ? 3 : 4}>
        {name}
      </Text>
      {!compact && (
        <>
          <Text style={[styles.trigger, dense && styles.triggerDense, hidden && styles.hiddenText]}>{hidden ? 'gatilho sob sigilo' : def?.trigger}</Text>
          <Text style={[styles.body, dense && styles.bodyDense, hidden && styles.hiddenText]}>{hidden ? 'O arquivo será identificado quando seu gatilho disparar.' : def?.text}</Text>
        </>
      )}
      {reserve > 0 && <Text style={styles.reserve}>+{reserve} em reserva</Text>}
      {used && <Text style={styles.usedStamp}>UTILIZADA</Text>}
      {actionLabel && <Text style={[styles.action, dense && styles.actionDense]}>{actionLabel}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    padding: 12,
    backgroundColor: colors.paperDim,
    borderColor: colors.ink,
    borderWidth: 2,
    borderRadius: 4,
    ...shadow,
  },
  cardDense: { padding: 8 },
  hidden: { backgroundColor: colors.confidential, borderColor: colors.particle },
  used: { opacity: 0.82 },
  pressed: { transform: [{ translateY: 2 }], shadowOffset: { width: 1, height: 1 } },
  notch: {
    position: 'absolute',
    top: -9,
    right: 18,
    width: 36,
    height: 18,
    borderRadius: 18,
    borderColor: colors.ink,
    borderWidth: 2,
    backgroundColor: colors.paper,
  },
  seal: {
    position: 'absolute',
    right: 10,
    top: 13,
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderColor: colors.approve,
    borderWidth: 2,
  },
  hiddenSeal: { borderColor: colors.paperDeep },
  sealText: { color: colors.approve, fontFamily: fonts.display, fontSize: 14 },
  code: {
    alignSelf: 'flex-start',
    color: colors.paperCard,
    fontFamily: fonts.type,
    fontSize: 9,
    backgroundColor: colors.ink,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  codeDense: { fontSize: 7, paddingHorizontal: 4, paddingVertical: 1 },
  name: {
    width: '78%',
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 20,
    marginTop: 14,
    textTransform: 'uppercase',
  },
  nameCompact: { width: '100%', fontSize: 10, lineHeight: 11, marginTop: 8, paddingRight: 28 },
  nameDense: { fontSize: 13, lineHeight: 13, marginTop: 7 },
  hiddenText: { color: colors.paperCard },
  trigger: {
    color: colors.particle,
    fontFamily: fonts.type,
    fontSize: 9,
    marginTop: 11,
    paddingTop: 6,
    borderTopColor: colors.inkSoft,
    borderTopWidth: 1,
    textTransform: 'uppercase',
  },
  triggerDense: { fontSize: 7, marginTop: 6, paddingTop: 4 },
  body: { flex: 1, color: colors.ink, fontFamily: fonts.type, fontSize: 11, lineHeight: 15, marginTop: 9 },
  bodyDense: { fontSize: 8, lineHeight: 10, marginTop: 4 },
  reserve: { color: colors.entangle, fontFamily: fonts.bodyBold, fontSize: 9, marginTop: 5 },
  usedStamp: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    color: colors.particle,
    fontFamily: fonts.display,
    fontSize: 9,
    borderColor: colors.particle,
    borderWidth: 2,
    paddingHorizontal: 5,
    paddingVertical: 3,
    transform: [{ rotate: '-7deg' }],
  },
  action: {
    color: colors.approve,
    fontFamily: fonts.display,
    fontSize: 9,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  actionDense: { fontSize: 7, marginTop: 4 },
})
