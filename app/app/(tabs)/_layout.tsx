import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { font } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/** 시안의 탭바 5개. 라우트 이름 = 파일 이름. */
export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: font.xs },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '홈', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="calendar" options={{ title: '캘린더', tabBarIcon: icon('📅') }} />
      <Tabs.Screen name="graph" options={{ title: '그래프', tabBarIcon: icon('📈') }} />
      <Tabs.Screen name="community" options={{ title: '커뮤니티', tabBarIcon: icon('💬') }} />
      <Tabs.Screen name="my" options={{ title: 'MY', tabBarIcon: icon('🙂') }} />
    </Tabs>
  );
}

/** 이모지는 스크린리더가 이상하게 읽는다 - 라벨은 title이 담당하고 아이콘은 숨긴다. */
const icon = (emoji: string) =>
  function TabIcon() {
    return (
      <Text importantForAccessibility="no" accessibilityElementsHidden style={{ fontSize: 18 }}>
        {emoji}
      </Text>
    );
  };
