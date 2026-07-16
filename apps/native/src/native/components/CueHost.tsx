import { getDef, getSecret } from '@colapso/game-core'
import type { PresentationCue } from '@colapso/game-session'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useSfx, type SoundId } from '../audio'
import { useNativeSettings } from '../settings'
import { colors, fonts, shadow } from '../theme'
import { NativeCard } from './Card'
import { NativeSecretCard } from './SecretCard'

export function CueHost({ cue, acknowledge }: { cue?: PresentationCue; acknowledge: (id: number) => void }) {
  const progress = useSharedValue(0)
  const { play } = useSfx()
  const { haptics } = useNativeSettings()
  const finish = useCallback((id: number) => acknowledge(id), [acknowledge])

  useEffect(() => {
    if (!cue) return
    play(soundForCue(cue))
    if (haptics) void hapticForCue(cue)
    progress.value = 0
    progress.value = withTiming(
      1,
      {
        duration: durationForCue(cue),
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      },
      (finished) => {
        if (finished) scheduleOnRN(finish, cue.presentationId)
      },
    )
  }, [cue, finish, haptics, play, progress])

  const animated = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 5) * Math.min(1, (1 - progress.value) * 7),
    transform: [{ translateY: (1 - progress.value) * 12 }, { scale: 0.97 + progress.value * 0.03 }],
  }))

  if (!cue) return null
  const blockingCard = cue.kind === 'protocolReveal' || cue.kind === 'secretReveal'

  if (blockingCard) {
    return (
      <View pointerEvents="none" style={styles.blockingBackdrop}>
        <Animated.View style={[styles.fileReveal, animated]}>
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

function durationForCue(cue: PresentationCue) {
  if (cue.kind === 'protocolReveal' || cue.kind === 'secretReveal') return 1550
  if (cue.kind === 'turn' || cue.kind === 'gameover') return 720
  if (cue.kind === 'feedback') return 850
  if (cue.kind === 'attack' || cue.kind === 'collapse' || cue.kind === 'damage') return 470
  return cue.blocking ? 520 : 320
}

function soundForCue(cue: PresentationCue): SoundId {
  switch (cue.kind) {
    case 'draw': return 'draw'
    case 'summon': return 'play'
    case 'spell': case 'protocolReveal': return 'spell'
    case 'collapse': case 'influence': return 'collapse'
    case 'oscillate': return 'oscillate'
    case 'damage': case 'attack': case 'echo': return 'hit'
    case 'death': return 'death'
    case 'entangle': return 'entangle'
    case 'secretReveal': case 'secretTrigger': case 'secretArmed': return 'secret'
    case 'turn': return 'turn'
    case 'gameover': return cue.winner === 'player' ? 'win' : 'lose'
    case 'feedback': return cue.tone === 'deny' ? 'deny' : 'select'
    default: return 'select'
  }
}

async function hapticForCue(cue: PresentationCue) {
  if (cue.kind === 'gameover' || cue.kind === 'secretReveal' || cue.kind === 'collapse') {
    await Haptics.notificationAsync(cue.kind === 'gameover' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning)
  } else if (cue.kind === 'damage' || cue.kind === 'attack' || cue.kind === 'death') {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  } else {
    await Haptics.selectionAsync()
  }
}

function cueLabel(cue: PresentationCue) {
  switch (cue.kind) {
    case 'turn': return cue.owner === 'player' ? 'SEU TURNO' : 'TURNO DO AUTÔMATO'
    case 'collapse': return `COLAPSO · ESTADO ${cue.face === 0 ? 'A' : 'B'}`
    case 'damage': return `−${cue.amount}`
    case 'death': return 'SUJEITO ARQUIVADO'
    case 'entangle': return 'EMARANHAMENTO REGISTRADO'
    case 'oscillate': return 'OSCILAÇÃO'
    case 'secretTrigger': return 'CONTRAMEDIDA ATIVADA'
    case 'secretArmed': return 'SEGUNDO ARQUIVO ARMADO'
    case 'gameover': return cue.winner === 'player' ? 'SETOR VENCIDO' : 'COERÊNCIA PERDIDA'
    case 'feedback': return cue.message.toUpperCase()
    case 'runRestored': return 'PLANTÃO RETOMADO · O DUELO SERÁ REINICIADO'
    case 'burn': return 'MÃO CHEIA · FICHA DESCARTADA'
    case 'reshuffle': return 'ARQUIVO REORGANIZADO'
    case 'heropower': return 'OBSERVAÇÃO INICIADA'
    case 'influence': return cue.success ? 'INFLUÊNCIA CONFIRMADA' : 'INTERFERÊNCIA DESVIADA'
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
  toastHost: { ...StyleSheet.absoluteFillObject, zIndex: 70, alignItems: 'center', justifyContent: 'center' },
  toast: { maxWidth: 420, paddingHorizontal: 19, paddingVertical: 11, backgroundColor: colors.ink, borderColor: colors.paperCard, borderWidth: 2, borderRadius: 3, ...shadow },
  toastDeny: { backgroundColor: colors.particle },
  toastText: { color: colors.paperCard, fontFamily: fonts.display, fontSize: 14, letterSpacing: 1.2, textAlign: 'center' },
})
