import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/shared/ui/Card';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

export type Kpi = { label: string; value: string; dot: string };

/**
 * 06 KPI 3개(prototype `.kpi`). 값이 없으면 숨기지 않고 "-" 로 보여준다 - 칸이 사라지면 레이아웃이 튄다.
 * 칸마다 색점을 하나씩 두는 것은 장식이 아니라 아래 차트의 색과 눈을 잇는 고리다.
 */
export function KpiRow({ items }: { items: Kpi[] }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <Card key={item.label} variant="flat" style={styles.slot} contentStyle={styles.item}>
          <View
            accessible
            accessibilityLabel={`${item.label} ${item.value}`}
            style={styles.stack}
          >
            <View style={[styles.dot, { backgroundColor: item.dot }]} />
            <Text style={[styles.value, { color: colors.text }]}>{item.value}</Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>{item.label}</Text>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[3] },
  slot: { flex: 1 },
  item: { paddingVertical: space[4], paddingHorizontal: space[2] },
  stack: { alignItems: 'center', gap: space[2] },
  dot: { width: 10, height: 10, borderRadius: radius.full },
  value: { fontSize: font.xl, fontFamily: font.bold, fontVariant: ['tabular-nums'] },
  label: { fontSize: font.xs, fontFamily: font.regular },
});
