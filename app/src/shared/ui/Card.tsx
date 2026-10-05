import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { radius, shadow, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  children: ReactNode;
  /**
   * `raised` prototype `.card` - 라운드 34, 위아래 그라디언트, 1.5px 테두리. 화면의 주 블록
   * `flat`   prototype `.card.flat` - 라운드 24, 단색 면. 같은 줄에 여러 개 늘어서는 작은 칸
   */
  variant?: 'raised' | 'flat';
  /** 바깥 면 - 자리와 크기(flex, width). 그림자가 여기 붙는다 */
  style?: ViewStyle;
  /** 안쪽 면 - 여백과 정렬. 기본 `padding: 20, gap: 12` 를 덮어쓸 때 */
  contentStyle?: ViewStyle;
};

/**
 * prototype.html `.card`.
 *
 * 솟은 면의 `linear-gradient(180deg, raised-a, raised-b)` 는 RN 에 문법이 없어 Svg 로 한 장 깐다 -
 * expo-linear-gradient 를 더하지 않고 이미 쓰는 react-native-svg 를 쓴다.
 *
 * **면이 두 겹인 이유**: iOS 는 같은 View 에 `overflow: hidden` 과 그림자를 함께 주면
 * 그림자가 잘려 사라진다. 그래서 바깥이 그림자를, 안쪽이 자르기와 테두리를 맡는다.
 */
export function Card({ children, variant = 'raised', style, contentStyle }: Props) {
  const colors = useColors();
  const raised = variant === 'raised';
  const corner = raised ? radius.xl : radius.lg;

  return (
    <View
      style={[
        shadow.md,
        { borderRadius: corner, backgroundColor: raised ? colors.raisedA : colors.surface },
        style,
      ]}
    >
      <View style={[styles.inner, { borderRadius: corner, borderColor: colors.border }, contentStyle]}>
        {raised ? (
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <LinearGradient id="cardFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.raisedA} />
                <Stop offset="1" stopColor={colors.raisedB} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#cardFill)" />
          </Svg>
        ) : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    borderWidth: 1.5,
    padding: space[5],
    gap: space[3],
    overflow: 'hidden',
  },
});
