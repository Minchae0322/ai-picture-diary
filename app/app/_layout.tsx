import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from '@/shared/api/ApiError';

/** 제공자는 이 파일 한 곳. 순서가 의존 방향이다(expo-app-conventions 6장). */
export default function RootLayout() {
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

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
