import { StyleSheet, Text, View } from 'react-native';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/** 06 KPI 3개. 값이 없으면 숨기지 않고 "-" 로 보여준다 - 칸이 사라지면 레이아웃이 튄다. */
export function KpiRow({ items }: { items: { label: string; value: string }[] }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View
          key={item.label}
          accessible
          accessibilityLabel={`${item.label} ${item.value}`}
          style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.value, { color: colors.text }]}>{item.value}</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[3] },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: space[3],
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  value: { fontSize: font.lg, fontWeight: font.weightBold },
  label: { fontSize: font.xs },
});
