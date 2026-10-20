import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SketchBorder } from '@/shared/ui/SketchBorder';
import { SketchLine } from '@/shared/ui/SketchLine';
import { Tape } from '@/shared/ui/Tape';
import { space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/**
 * 공책 한 장. 색연필로 괘선을 긋고 손그림 테두리를 두른 **쓰는 자리**다
 * (`hand-drawn-ui` 5장의 `NotebookBackground`).
 *
 * <p>핵심은 **글줄과 괘선이 같은 간격**이라는 것이다. 둘이 어긋나면 글자가 선 위에 앉지 않고
 * 선을 가로질러 떠다녀 공책이 아니라 "줄무늬 상자"가 된다. 그래서 간격을 토큰으로 숨기지 않고
 * 호출부와 나눠 갖는다 - 쓰는 쪽이 `TextInput` 의 `lineHeight` 에 같은 값을 넣는다.
 *
 * <p>괘선은 1px `View` 가 아니라 `SketchLine` 이다. 다른 선을 다 떨어 놓아도 자로 잰 가로선
 * 몇 줄이 남으면 그 줄들이 "기계로 그린 화면"이라고 말한다.
 */
type Props = {
  children: ReactNode;
  /** 괘선 간격. 호출부의 글줄 높이와 **같은 값**이어야 한다 */
  lineHeight: number;
  /** 괘선 수. 종이의 높이가 여기서 나온다 */
  lines: number;
  /** 첫 줄 위의 여백. 글자의 윗머리가 테두리에 닿지 않게 한다 */
  topPad?: number;
  /** 같은 자리는 늘 같은 선. 화면마다 다른 수를 준다 */
  seed?: number;
  /** 위쪽 귀에 붙이는 마스킹 테이프. "붙여 둔 종이"가 된다 */
  tape?: boolean;
  style?: ViewStyle;
};

/** 좌우 안쪽 여백. 괘선은 이보다 조금 더 안쪽에서 시작한다 - 진짜 공책의 여백이다 */
const SIDE_PAD = space[5];
/** 괘선이 테두리에서 떨어지는 거리 */
const RULE_INSET = space[2];

export function NotePaper({
  children,
  lineHeight,
  lines,
  topPad = space[4],
  seed = 311,
  tape = false,
  style,
}: Props) {
  const colors = useColors();
  const height = topPad * 2 + lineHeight * lines;

  return (
    <View
      style={[styles.sheet, { height, backgroundColor: colors.surfaceSolid }, style]}
    >
      {/* 괘선. 글자 **아래** 깔린다 - 위에 오면 글자를 긋고 지나간다 */}
      <View
        style={[styles.rules, { top: topPad, left: RULE_INSET, right: RULE_INSET }]}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {Array.from({ length: lines }, (_, i) => (
          <SketchLine
            key={i}
            color={colors.rule}
            // 글자가 앉는 선이라 거의 곧게. 물결이 크면 글줄이 기울어 보인다
            sway={0.9}
            wavelength={120}
            strokeWidth={1.1}
            roughness={0.9}
            opacity={0.85}
            height={6}
            seed={seed + i * 17}
            style={{ position: 'absolute', left: 0, right: 0, top: lineHeight * (i + 1) - 6 }}
          />
        ))}
      </View>

      <View style={[styles.content, { paddingTop: topPad, paddingHorizontal: SIDE_PAD }]}>
        {children}
      </View>

      <SketchBorder radius={18} color={colors.borderStrong} strokeWidth={1.6} seed={seed} />

      {tape ? <Tape width={78} height={22} variant="kraft" rotate={-7} style={styles.tape} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    /** 네 귀가 같으면 컴퍼스로 그린 것이다(`hand-drawn-ui` 3장). 테두리는 평균값 하나로 긋는다 */
    borderTopLeftRadius: 20,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 22,
    borderBottomLeftRadius: 16,
  },
  rules: { position: 'absolute', bottom: 0 },
  content: { flex: 1 },
  tape: { position: 'absolute', top: -12, right: 18 },
});
