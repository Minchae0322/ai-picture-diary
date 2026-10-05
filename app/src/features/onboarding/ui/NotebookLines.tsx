import { StyleSheet, View } from 'react-native';
import { useColors } from '@/shared/theme/useColors';

/**
 * 01 히어로 뒤의 노트 괘선.
 *
 * HTML 프로토타입은 `repeating-linear-gradient` 한 줄로 끝나지만 RN에는 그 문법이 없어
 * 1px View 를 간격대로 깐다. 간격과 색은 `docs/screen/prototype.html` 의 `.hero-slot` 과 같다.
 *
 * 좌우 28px 는 선을 그리지 않는다 - 진짜 공책의 여백이다.
 *
 * **종이를 그림보다 위아래로 넓게 뺀다.** 그림과 같은 크기로 깔면 빽빽한 줄은 그림에 가려
 * 양옆 조각만 남아 "선이 빠진" 것처럼 보인다. 값은 prototype.html 의 `.rule-sheet` 와 같다.
 */
const SPACING = 32;
/**
 * 맨 위·맨 아래 한 줄씩은 긋지 않는다. 그래서 첫 줄이 2칸째에서 시작하고 개수도 그만큼 적다.
 * HTML 쪽은 `padding: 32px 0` + `background-clip: content-box` 가 같은 일을 한다.
 */
const SKIP_FIRST = 2;
const COUNT = 10;
const SIDE_MARGIN = 28;
/** 히어로 위아래로 얼마나 더 빼는가. 위를 크게 빼야 그림에 가리지 않는 줄이 남는다 */
const OVERHANG_TOP = 72;
const OVERHANG_BOTTOM = 20;

export function NotebookLines() {
  const colors = useColors();
  return (
    <View
      style={styles.sheet}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {Array.from({ length: COUNT }, (_, i) => (
        <View
          key={i}
          style={[
            styles.line,
            { top: (i + SKIP_FIRST) * SPACING - 1, backgroundColor: colors.rule },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    top: -OVERHANG_TOP,
    bottom: -OVERHANG_BOTTOM,
    left: SIDE_MARGIN,
    right: SIDE_MARGIN,
    overflow: 'hidden',
  },
  line: { position: 'absolute', left: 0, right: 0, height: 1 },
});
