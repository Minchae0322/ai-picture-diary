import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, MIN_TOUCH_TARGET, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { formatMonthLabel } from '../model/monthGrid';

type Props = { year: number; month: number; onShift: (delta: number) => void };

/** 시안 05 `‹ 2026년 8월 ›`. 화살표는 44 히트 영역을 따로 갖는다 */
export function MonthNav({ year, month, onShift }: Props) {
  const colors = useColors();
  const label = formatMonthLabel(year, month);
  return (
    <View style={styles.row}>
      <Arrow label="이전 달" glyph="‹" onPress={() => onShift(-1)} />
      <Text accessibilityRole="header" style={[styles.label, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Arrow label="다음 달" glyph="›" onPress={() => onShift(1)} />
    </View>
  );
}

function Arrow({ label, glyph, onPress }: { label: string; glyph: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.arrow, { opacity: pressed ? 0.5 : 1 }]}
    >
      <Text style={[styles.arrowGlyph, { color: colors.textMuted }]}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  label: { fontSize: font.md, fontFamily: font.bold },
  arrow: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowGlyph: { fontSize: font.xl, fontFamily: font.bold },
});
