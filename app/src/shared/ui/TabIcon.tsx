import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { tabTint } from '@/shared/theme/tokens';

/**
 * 시안 `TabBar`의 아이콘은 24px 원 하나다. 활성 탭만 꽉 차고 나머지는 28% 알파
 * (assets/figma/tab-*.svg 와 같은 값. 탭마다 색이 다르다).
 *
 * 라벨은 탭의 title이 담당하므로 아이콘은 접근성 트리에서 숨긴다
 * (expo-app-conventions 8장).
 */
export function tabIcon(tab: keyof typeof tabTint) {
  return function TabIcon({ focused }: { focused: boolean }) {
    return (
      <View accessibilityElementsHidden importantForAccessibility="no">
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={12} fill={tabTint[tab]} fillOpacity={focused ? 1 : 0.28} />
        </Svg>
      </View>
    );
  };
}
