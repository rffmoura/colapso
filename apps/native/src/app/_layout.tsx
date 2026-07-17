import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Archivo_400Regular } from '@expo-google-fonts/archivo/400Regular'
import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold'
import { Archivo_700Bold } from '@expo-google-fonts/archivo/700Bold'
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black/400Regular'
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite/400Regular'
import { useFonts } from 'expo-font'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { AudioProvider } from '../native/audio'
import { SettingsProvider } from '../native/settings'
import { colors } from '../native/theme'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Archivo: Archivo_400Regular,
    ArchivoSemiBold: Archivo_600SemiBold,
    ArchivoBold: Archivo_700Bold,
    ArchivoBlack: ArchivoBlack_400Regular,
    SpecialElite: SpecialElite_400Regular,
  })

  useEffect(() => { if (loaded || error) void SplashScreen.hideAsync() }, [error, loaded])
  if (!loaded && !error) return null

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <AudioProvider>
            <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={{ flex: 1, backgroundColor: colors.paper }}>
              <StatusBar hidden />
              <Slot />
            </SafeAreaView>
          </AudioProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
