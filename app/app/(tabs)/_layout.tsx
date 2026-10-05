import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingDone } from '@/shared/lib/useOnboarding';
import { font, shadow, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { tabIcon } from '@/shared/ui/TabIcon';

/** 시안의 탭바 5개. 라우트 이름 = 파일 이름. 07·09는 탭이 아니라 MY 하위다 */
export default function TabsLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const onboardingDone = useOnboardingDone();

  // 플래그를 읽는 동안은 아무것도 그리지 않는다. 온보딩이 한 프레임 번쩍이는 것을 막는다
  if (onboardingDone === null) {
    return null;
  }
  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: [
          shadow.up,
          {
            position: 'absolute',
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 66 + insets.bottom,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, space[6]),
          },
        ],
        tabBarLabelStyle: { fontSize: font.micro, fontFamily: font.regular, lineHeight: 12, marginTop: 6 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '홈', tabBarIcon: tabIcon('index') }} />
      <Tabs.Screen name="calendar" options={{ title: '캘린더', tabBarIcon: tabIcon('calendar') }} />
      <Tabs.Screen name="graph" options={{ title: '그래프', tabBarIcon: tabIcon('graph') }} />
      <Tabs.Screen name="community" options={{ title: '커뮤니티', tabBarIcon: tabIcon('community') }} />
      <Tabs.Screen name="my" options={{ title: 'MY', tabBarIcon: tabIcon('my') }} />
    </Tabs>
  );
}
