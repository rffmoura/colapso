import { useGameSession, type GameSessionController } from '@colapso/game-session'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native'
import { NativeGameBoard } from './GameBoard'
import { ManualSheet, PaperSheet } from './components/Overlays'
import { gameSession } from './session'
import { useNativeSettings } from './settings'
import { BriefingScreen, DraftScreen, RewardScreen, RunEndScreen, TitleScreen } from './RunScreens'
import { colors, fonts } from './theme'

export function ColapsoApp({ controller = gameSession }: { controller?: GameSessionController }) {
  const state = useGameSession(controller)
  const [manual, setManual] = useState(false)
  const [settings, setSettings] = useState(false)

  useEffect(() => { void controller.send({ type: 'HYDRATE' }) }, [controller])

  if (!state.hydrated) {
    return <View style={styles.loading}><ActivityIndicator color={colors.particle} size="large" /><Text style={styles.loadingText}>CONSULTANDO ARQUIVO…</Text></View>
  }

  return (
    <View style={styles.root}>
      {state.phase === 'title' && <TitleScreen onStart={() => void controller.send({ type: 'START_RUN' })} onManual={() => setManual(true)} onSettings={() => setSettings(true)} />}
      {state.phase === 'draft' && <DraftScreen controller={controller} />}
      {state.phase === 'briefing' && <BriefingScreen controller={controller} />}
      {state.phase === 'game' && <NativeGameBoard controller={controller} onOpenSettings={() => setSettings(true)} />}
      {state.phase === 'reward' && <RewardScreen controller={controller} />}
      {state.phase === 'run-won' && <RunEndScreen won controller={controller} />}
      {state.phase === 'run-lost' && <RunEndScreen won={false} controller={controller} />}
      <ManualSheet visible={manual} onClose={() => setManual(false)} />
      <SettingsSheet visible={settings} onClose={() => setSettings(false)} />
    </View>
  )
}

function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const settings = useNativeSettings()
  return (
    <PaperSheet visible={visible} title="Ajustes do Plantão" onClose={onClose}>
      <View style={styles.settingRow}>
        <View style={styles.settingCopy}><Text style={styles.settingTitle}>SOM</Text><Text style={styles.settingText}>Efeitos de fichas, ataques e arquivos.</Text></View>
        <Switch accessibilityLabel="Ativar ou desativar som" value={settings.sound} onValueChange={settings.toggleSound} trackColor={{ false: colors.paperDeep, true: colors.wave }} thumbColor={colors.paperCard} />
      </View>
      <View style={styles.settingRow}>
        <View style={styles.settingCopy}><Text style={styles.settingTitle}>RESPOSTA TÁTIL</Text><Text style={styles.settingText}>Vibrações leves em seleção, impacto e colapso.</Text></View>
        <Switch accessibilityLabel="Ativar ou desativar resposta tátil" value={settings.haptics} onValueChange={settings.toggleHaptics} trackColor={{ false: colors.paperDeep, true: colors.particle }} thumbColor={colors.paperCard} />
      </View>
      <Text style={styles.motionNote}>As animações respeitam a preferência “Reduzir Movimento” configurada no iOS.</Text>
    </PaperSheet>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 13, backgroundColor: colors.paper },
  loadingText: { color: colors.ink, fontFamily: fonts.type, fontSize: 11, letterSpacing: 1.4 },
  settingRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18, paddingVertical: 10, borderBottomColor: colors.inkFaint, borderBottomWidth: 1 },
  settingCopy: { flex: 1 },
  settingTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 12 },
  settingText: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 10, marginTop: 3 },
  motionNote: { color: colors.inkSoft, fontFamily: fonts.type, fontSize: 9, lineHeight: 13, marginTop: 13 },
})
