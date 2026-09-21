import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  label: string;
  /** 왼쪽 점의 색. 없으면 점을 그리지 않는다 */
  dotColor?: string;
  selected?: boolean;
  onPress?: () => void;
  /** 조건 미달로 잠긴 항목. 색이 아니라 자물쇠 글리프로 알린다 */
  locked?: boolean;
};

/**
 * 시안 `chip` / `streak` / `filters` / `w-*`가 전부 같은 모양이다.
 * 색만으로 뜻을 전하지 않는다 - 점 옆에 항상 라벨이 붙는다(dataviz).
 */
export function Chip({ label, dotColor, selected = false, onPress, locked = false }: Props) {
  const colors = useColors();

  // 점이 있으면 그 색의 옅은 판(시안 `chip`·`streak`), 없으면 중립 알약(시안 `filters`·`store-tabs`)
  const surface = dotColor === undefined ? colors.surface : withAlpha(dotColor, 0.28);
  const edge = dotColor === undefined ? colors.borderStrong : withAlpha(dotColor, 0.55);

  const body = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : surface,
          borderColor: selected ? colors.primary : edge,
        },
      ]}
    >
      {dotColor === undefined ? null : <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      <Text
        style={[
          styles.label,
          { color: selected ? colors.primaryFg : colors.text, opacity: locked ? 0.6 : 1 },
        ]}
      >
        {locked ? `🔒 ${label}` : label}
      </Text>
    </View>
  );

  if (onPress === undefined) {
    return body;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={(MIN_TOUCH_TARGET - 35) / 2}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {body}
    </Pressable>
  );
}

/** 시안은 악센트색의 28%/55% 알파를 쓴다. hex를 rgba로 바꿔 같은 값을 만든다 */
function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) {
    return hex;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: space[3],
    paddingRight: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  dot: { width: 12, height: 12, borderRadius: radius.full },
  label: { fontSize: font.xs, fontWeight: font.weightMedium },
});
