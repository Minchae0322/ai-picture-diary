import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** 06 기간 세그먼트(주/월/년). 항상 하나만 선택된다 - 해제할 수 없다는 점이 Chip 과 다르다. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.item,
              {
                backgroundColor: selected ? colors.primary : 'transparent',
                opacity: pressed && !selected ? 0.6 : 1,
              },
            ]}
          >
            <Text
              style={[styles.label, { color: selected ? colors.primaryFg : colors.textMuted }]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: radius.full,
    borderWidth: 1,
    padding: space[1],
    gap: space[1],
  },
  item: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET - space[2],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  label: { fontSize: font.sm, fontWeight: font.weightMedium },
});
