import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RepositoryProvider } from '@/data/RepositoryProvider';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { useAuthGate } from '@/features/auth/useAuthGate';
import { EventDraftProvider } from '@/features/events/EventDraftProvider';
import { AnimatedSplash, LaunchProvider } from '@/features/launch/AnimatedSplash';
import { createQueryClient, useAppStateFocus } from '@/lib/queryClient';
import { ThemeProvider } from '@/theme/theme';
import { darkPalette, font } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

/**
 * The stack, behind the sign-in gate, under the animated launch. The native
 * splash hands off to the JS splash on its first frame; the JS splash leaves
 * once the gate has placed the first screen.
 */
function AppNavigator() {
  const { status } = useAuth();
  const decision = useAuthGate();
  const [launched, setLaunched] = useState(false);
  const hideNative = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);
  const finish = useCallback(() => setLaunched(true), []);

  return (
    <LaunchProvider value={launched}>
      <View style={{ flex: 1 }}>
        <Screens />
        {launched ? null : (
          <AnimatedSplash
            ready={status !== 'loading' && decision === 'stay'}
            known={status !== 'loading'}
            // Signed out: the logo plays over the Welcome poster, so the hand-off to the video is one background.
            backdrop={status === 'signedOut'}
            onShown={hideNative}
            onDone={finish}
          />
        )}
      </View>
    </LaunchProvider>
  );
}

function Screens() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: darkPalette.background },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)/welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="(auth)/intro" />
      {/* Transparent modals: Welcome (and its video) stays live behind the dimmed sheet. */}
      <Stack.Screen name="(auth)/sign-in" options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }} />
      <Stack.Screen name="(auth)/create-account" options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }} />
      {/* Full screen over the sheet it came from; Back returns to the sheet. */}
      <Stack.Screen name="(auth)/verify" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="preferences" options={{ animation: 'fade' }} />
      <Stack.Screen name="permissions" options={{ gestureEnabled: false }} />
      <Stack.Screen name="card" />
      <Stack.Screen name="tonight" />
      <Stack.Screen name="event/[id]" />
      <Stack.Screen name="later" />
      <Stack.Screen name="kit" />
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  useAppStateFocus();

  const [fontsLoaded, fontError] = useFonts({
    [font.regular]: require('@/assets/fonts/Inter-Regular.ttf'),
    [font.medium]: require('@/assets/fonts/Inter-Medium.ttf'),
    [font.semibold]: require('@/assets/fonts/Inter-SemiBold.ttf'),
    [font.bold]: require('@/assets/fonts/Inter-Bold.ttf'),
    [font.extrabold]: require('@/assets/fonts/Inter-ExtraBold.ttf'),
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RepositoryProvider>
          <AuthProvider>
            <ThemeProvider appearance="dark">
              <EventDraftProvider>
                <StatusBar style="light" />
                <AppNavigator />
              </EventDraftProvider>
            </ThemeProvider>
          </AuthProvider>
        </RepositoryProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
