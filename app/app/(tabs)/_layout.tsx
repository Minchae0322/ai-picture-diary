import { Tabs } from 'expo-router';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { font } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/** 시안의 탭바 5개. 라우트 이름 = 파일 이름. */
export default function TabsLayout() {
  const colors = useColors();

  /**
   * 색을 탭바가 주는 ColorValue 대신 토큰에서 직접 읽는다 - 아이콘은 SVG라 문자열 색이 필요하고,
   * 어차피 활성/비활성 색의 출처가 아래 screenOptions 와 같은 토큰이다.
   * 라벨은 title 이 담당하므로 아이콘에 label 을 주지 않는다(스크린리더가 두 번 읽지 않게).
   */
  const icon = (name: IconName) =>
    function TabIcon({ focused }: { focused: boolean }) {
      return <Icon name={name} size={22} color={focused ? colors.primary : colors.textSubtle} />;
    };

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
      <Tabs.Screen name="index" options={{ title: '홈', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="calendar" options={{ title: '캘린더', tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="graph" options={{ title: '그래프', tabBarIcon: icon('chart') }} />
      <Tabs.Screen name="community" options={{ title: '커뮤니티', tabBarIcon: icon('chat') }} />
      <Tabs.Screen name="my" options={{ title: 'MY', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}
