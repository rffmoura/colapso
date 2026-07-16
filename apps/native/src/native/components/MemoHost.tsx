import AsyncStorage from '@react-native-async-storage/async-storage'
import type { PresentationCue } from '@colapso/game-session'
import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, shadow } from '../theme'

const KEY = 'colapso.native-memos.v1'
const MEMOS = {
  inicio: { title: 'Bem-vindo ao plantão', text: 'Sua missão é zerar a Coerência do Autômato antes da sua. Você começa com 2 qubits. Toque numa ficha da mão, examine-a e confirme em “Jogar ficha”.' },
  collapse: { title: 'Colapso', text: 'O sujeito deixou a superposição. Agora só o estado A ou B está ativo, com seu Ataque, Vida e palavras-chave.' },
  influence: { title: 'Observar', text: 'Você escolhe o estado desejado: há 75% de chance de obtê-lo e 25% de o estado oposto prevalecer.' },
  secretReveal: { title: 'Contramedida revelada', text: 'Ela dispara apenas uma vez por duelo e continua no painel para consulta depois de utilizada.' },
  entangle: { title: 'Emaranhamento', text: 'O barbante liga dois sujeitos: eles colapsam juntos e, quando um morre, o outro sofre 2 de dano.' },
  oscillate: { title: 'Oscilação', text: 'O sujeito sobreviveu ao combate e trocou de estado. A Vida perdida não é recuperada.' },
} as const

type MemoId = keyof typeof MEMOS

export function MemoHost({ cue }: { cue?: PresentationCue }) {
  const [visible, setVisible] = useState<MemoId | null>(null)
  const seen = useRef(new Set<MemoId>())
  const ready = useRef(false)

  useEffect(() => {
    void AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) seen.current = new Set(JSON.parse(raw) as MemoId[])
      ready.current = true
      if (!seen.current.has('inicio')) setVisible('inicio')
    }).catch(() => { ready.current = true })
  }, [])

  useEffect(() => {
    if (!cue || !ready.current) return
    const id = cue.kind in MEMOS ? cue.kind as MemoId : null
    if (id && !seen.current.has(id) && !visible) setVisible(id)
  }, [cue, visible])

  if (!visible) return null
  const memo = MEMOS[visible]
  const dismiss = () => {
    seen.current.add(visible)
    void AsyncStorage.setItem(KEY, JSON.stringify([...seen.current]))
    setVisible(null)
  }
  return (
    <View style={styles.memo} accessibilityRole="alert">
      <Text style={styles.kicker}>MEMORANDO DO SUPERVISOR</Text>
      <Text style={styles.title}>{memo.title}</Text>
      <Text style={styles.text}>{memo.text}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Entendi" onPress={dismiss} style={styles.close}><Text style={styles.closeText}>ENTENDI</Text></Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  memo: { position: 'absolute', zIndex: 65, left: 16, bottom: 82, width: 285, padding: 14, backgroundColor: colors.paperCard, borderColor: colors.particle, borderWidth: 2, borderRadius: 4, ...shadow },
  kicker: { color: colors.particle, fontFamily: fonts.type, fontSize: 7, letterSpacing: 1.1 },
  title: { color: colors.ink, fontFamily: fonts.display, fontSize: 14, marginTop: 5, textTransform: 'uppercase' },
  text: { color: colors.ink, fontFamily: fonts.type, fontSize: 10, lineHeight: 14, marginTop: 6 },
  close: { alignSelf: 'flex-end', minWidth: 72, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  closeText: { color: colors.particle, fontFamily: fonts.display, fontSize: 9 },
})
