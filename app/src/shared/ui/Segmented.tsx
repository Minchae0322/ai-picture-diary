import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

type Props<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** 시안 06의 `segment`(주/월/년). 알약 트랙 안에 알약 선택 표시 */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[
              styles.item,
              selected && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.primaryFg : colors.textMuted },
              ]}
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
  track: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 4,
    borderWidth: 1.5,
    borderRadius: radius.full,
    gap: 0,
  },
  item: {
    minHeight: MIN_TOUCH_TARGET - 8,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[4],
    borderRadius: radius.full,
  },
  label: { fontSize: font.md, fontWeight: font.weightBold },
});
