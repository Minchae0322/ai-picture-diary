import { StyleSheet, Text, View } from 'react-native';
import { font, leading, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { Card } from '@/shared/ui/Card';

export type Kpi = { label: string; value: string; tint: string };

/** 시안 06 `kpi` 3칸. 숫자는 텍스트 토큰을 입고 색 점이 옆에서 정체성을 나른다 */
export function KpiRow({ items }: { items: Kpi[] }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <Card key={item.label} size="lg" flat style={styles.card}>
          <View style={[styles.dot, { backgroundColor: item.tint }]} />
          <Text style={[styles.value, { color: colors.text }]}>{item.value}</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>{item.label}</Text>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[3] },
  card: { flex: 1, alignItems: 'center', gap: space[2], paddingVertical: space[4] },
  dot: { width: 10, height: 10, borderRadius: radius.full },
  value: { fontSize: font.xl, lineHeight: leading(font.xl, 1.1), fontWeight: font.weightBold },
  label: { fontSize: font.xs, lineHeight: leading(font.xs, 1.1) },
});
