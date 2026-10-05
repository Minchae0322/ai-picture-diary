import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from '@/shared/api/ApiError';
import { FONT_ASSETS } from '@/shared/theme/tokens';

/** 제공자는 이 파일 한 곳. 순서가 의존 방향이다(expo-app-conventions 6장). */
export default function RootLayout() {
  // SUIT는 굵기마다 파일이 따로다. 등록 전에는 시스템 폰트로 그려져 글자가 한 번 튄다
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) =>
              // 4xx는 재시도하지 않는다. 네트워크/5xx만 2회까지
              error instanceof ApiError && error.status >= 400 && error.status < 500
                ? false
                : failureCount < 2,
          },
        },
      }),
  );

  // 폰트를 못 읽어도 화면은 띄운다. 서체만 시스템 폰트로 떨어진다
  if (!fontsLoaded && fontError === null) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
