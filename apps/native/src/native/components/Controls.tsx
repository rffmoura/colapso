import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors, fonts, shadow } from '../theme'

interface PaperButtonProps {
  label: string
  onPress: () => void
  variant?: 'stamp' | 'paper' | 'quiet'
  disabled?: boolean
  compact?: boolean
  accessibilityHint?: string
  style?: StyleProp<ViewStyle>
}

export function PaperButton({
  label,
  onPress,
  variant = 'paper',
  disabled,
  compact,
  accessibilityHint,
  style,
}: PaperButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'stamp' && styles.stamp,
        variant === 'quiet' && styles.quiet,
        compact && styles.compact,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.label, variant === 'stamp' && styles.stampLabel, compact && styles.compactLabel]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export function RoundButton({ label, glyph, onPress }: { label: string; glyph: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={5}
      onPress={onPress}
      style={({ pressed }) => [styles.round, pressed && styles.pressed]}
    >
      <Text style={styles.roundGlyph}>{glyph}</Text>
    </Pressable>
  )
}

export function LabelRule({ children }: { children: string }) {
  return (
    <View style={styles.ruleRow}>
      <View style={styles.rule} />
      <Text style={styles.ruleLabel}>{children}</Text>
      <View style={styles.rule} />
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    minWidth: 132,
    paddingHorizontal: 18,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paperCard,
    borderColor: colors.ink,
    borderWidth: 2,
    borderRadius: 4,
    ...shadow,
  },
  stamp: { backgroundColor: colors.particle },
  quiet: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0, borderColor: colors.inkSoft },
  compact: { minHeight: 44, minWidth: 86, paddingHorizontal: 11, paddingVertical: 8 },
  disabled: { opacity: 0.38 },
  pressed: { transform: [{ translateY: 2 }], shadowOffset: { width: 1, height: 1 } },
  label: { color: colors.ink, fontFamily: fonts.type, fontSize: 13, textAlign: 'center' },
  stampLabel: { color: colors.paperCard, fontFamily: fonts.display, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  compactLabel: { fontSize: 10 },
  round: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paperCard,
    borderColor: colors.ink,
    borderWidth: 2,
    borderRadius: 23,
    ...shadow,
  },
  roundGlyph: { color: colors.ink, fontFamily: fonts.display, fontSize: 15 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rule: { flex: 1, height: 1, backgroundColor: colors.inkSoft },
  ruleLabel: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' },
})
