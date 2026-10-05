import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  label: string;
  selected?: boolean;
  /** 날씨 색. 주면 라벨 앞에 12px 점이 붙고 고르지 않은 칩의 면도 그 색으로 옅게 물든다 */
  dot?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** 칩 높이는 35(9+9+17)로 44 미만이다. 히트 영역만 세로로 넓힌다 */
const HIT_SLOP = { top: 5, bottom: 5, left: 0, right: 0 };

/**
 * prototype.html `.chip`. 02 빠른 감정 · 05 요약 · 06 자주 쓴 말 · 08 필터 · 10 Plus 가 같은 모양이다.
 *
 * `onPress` 가 없으면 읽기 전용(06 단어 칩의 탭 동작은 미정)이라 버튼 역할을 주지 않는다.
 */
export function Chip({ label, selected = false, dot, onPress, accessibilityLabel }: Props) {
  const colors = useColors();

  // `color-mix(in srgb, DOT 28%, transparent)` 과 같은 값. 날씨 색이 7자 hex 라 알파를 붙인다
  const tinted = dot && !selected;
  const surface = {
    borderColor: selected ? colors.primary : tinted ? `${dot}8c` : colors.borderStrong,
    backgroundColor: selected ? colors.primary : tinted ? `${dot}47` : colors.surface,
  };
  const textColor = selected ? colors.primaryFg : colors.text;

  const body = (
    <>
      {dot ? (
        <View
          style={[
            styles.dot,
            { backgroundColor: dot, borderColor: colors.primaryFg, borderWidth: selected ? 1.5 : 0 },
          ]}
        />
      ) : null}
      <Text
        style={[
          styles.text,
          { color: textColor, fontFamily: selected ? font.bold : font.medium },
        ]}
      >
        {label}
      </Text>
    </>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={accessibilityLabel ?? label} style={[styles.chip, surface]}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.chip,
        surface,
        pressed ? { borderColor: colors.primary } : null,
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1] + 2,
    paddingVertical: 9,
    paddingLeft: space[3],
    paddingRight: space[3] + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET - 9,
  },
  dot: { width: 12, height: 12, borderRadius: radius.full },
  text: { fontSize: font.xs },
});
