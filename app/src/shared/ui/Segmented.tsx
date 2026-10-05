import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/**
 * prototype.html `.seg`. 06 기간 세그먼트(주/월/년).
 * 항상 하나만 선택된다 - 해제할 수 없다는 점이 Chip 과 다르다.
 */
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
            <Text style={[styles.label, { color: selected ? colors.primaryFg : colors.textMuted }]}>
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
    alignSelf: 'flex-start',
    flexDirection: 'row',
    borderRadius: radius.full,
    borderWidth: 1.5,
    padding: space[1],
  },
  item: {
    minWidth: 72,
    paddingVertical: 9,
    paddingHorizontal: space[4],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  label: { fontSize: font.md, fontFamily: font.bold },
});
