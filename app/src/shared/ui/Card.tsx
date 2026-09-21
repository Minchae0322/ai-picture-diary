import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { radius, shadow, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  children: ReactNode;
  /** xl = 시안의 주 카드(34), lg = 목록 카드(24) */
  size?: 'xl' | 'lg';
  /** 반투명 흰 그라디언트 대신 단색 표면. 목록처럼 여러 장이 겹칠 때 */
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * 시안 `card`: 반투명 흰 그라디언트 + 흰 테두리 1.5 + 큰 라운드 + 아래로 떨어지는 그림자.
 * 불투명 흰색을 쓰지 않는다. 배경 그라디언트가 비쳐야 이 프리셋이 성립한다(muted-sky 5장).
 */
export function Card({ children, size = 'xl', flat = false, style }: Props) {
  const colors = useColors();
  const box: StyleProp<ViewStyle> = [
    styles.card,
    shadow.md,
    { borderRadius: size === 'xl' ? radius.xl : radius.lg, borderColor: colors.border },
    style,
  ];

  if (flat) {
    return <View style={[box, { backgroundColor: colors.surface }]}>{children}</View>;
  }
  return (
    <LinearGradient colors={colors.surfaceRaised} style={box}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, padding: space[5], gap: space[3], overflow: 'hidden' },
});
