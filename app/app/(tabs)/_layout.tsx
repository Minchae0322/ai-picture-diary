import { Tabs } from 'expo-router';
import { StyleSheet, Text, useColorScheme, type ColorValue } from 'react-native';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { font, shadow, space, tabInactiveFor, tabTintFor } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/**
 * 시안의 탭바 5개. 라우트 이름 = 파일 이름.
 *
 * **탭마다 색이 다르다**(prototype `--t-home` ~ `--t-my`). 고른 탭만 그 색을 들고,
 * 고르지 않은 탭은 무채색으로 물러난다 - "색이 있다 / 없다" 가 가장 또렷한 신호다.
 * 전에는 같은 색을 28% 로 흐렸는데 캘린더의 선택/비선택 대비 차이가 0.64 뿐이라 읽히지 않았다
 * (근거와 수치는 `tokens.ts` 의 `tabTintFor`).
 * 라벨은 `title` 이 담당하므로 아이콘에 label 을 주지 않는다(스크린리더가 두 번 읽지 않게).
 */
export default function TabsLayout() {
  const colors = useColors();
  const scheme = useColorScheme();
  const tabTint = tabTintFor(scheme);
  const inactive = tabInactiveFor(scheme);

  const icon = (name: IconName, tint: string) =>
    function TabIcon({ focused }: { focused: boolean }) {
      return <Icon name={name} size={24} color={focused ? tint : inactive} />;
    };

  const label = (text: string) =>
    function TabLabel({ focused, color }: { focused: boolean; color: ColorValue }) {
      return (
        <Text style={[styles.label, { color, fontFamily: focused ? font.bold : font.regular }]}>
          {text}
        </Text>
      );
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: [
          shadow.up,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingTop: space[3] + 2,
          },
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '홈', tabBarIcon: icon('home', tabTint.index), tabBarLabel: label('홈') }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: '캘린더',
          tabBarIcon: icon('calendar', tabTint.calendar),
          tabBarLabel: label('캘린더'),
        }}
      />
      <Tabs.Screen
        name="graph"
        options={{
          title: '그래프',
          tabBarIcon: icon('chart', tabTint.graph),
          tabBarLabel: label('그래프'),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: '커뮤니티',
          tabBarIcon: icon('chat', tabTint.community),
          tabBarLabel: label('커뮤니티'),
        }}
      />
      <Tabs.Screen
        name="my"
        options={{ title: 'MY', tabBarIcon: icon('person', tabTint.my), tabBarLabel: label('MY') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: font.micro, lineHeight: 12 },
});
