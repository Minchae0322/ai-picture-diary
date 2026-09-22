import { Pressable, StyleSheet, Text } from 'react-native';
import { font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/**
 * 02 빠른 감정 칩 · 06 자주 쓴 말 · 08 필터가 같은 모양을 쓴다.
 * onPress 가 없으면 읽기 전용(06 단어 칩의 탭 동작은 미정)이라 버튼 역할을 주지 않는다.
 */
export function Chip({ label, selected = false, onPress, accessibilityLabel }: Props) {
  const colors = useColors();
  const style = {
    borderColor: selected ? colors.primary : colors.border,
    backgroundColor: selected ? colors.primary : colors.surface,
  };
  const textColor = selected ? colors.primaryFg : colors.text;

  if (!onPress) {
    return (
      <Text style={[styles.chip, styles.text, style, { color: textColor }]}>{label}</Text>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [styles.chip, style, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: space[4],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  text: { fontSize: font.sm, textAlignVertical: 'center', lineHeight: MIN_TOUCH_TARGET },
});
