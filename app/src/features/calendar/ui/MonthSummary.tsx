import { StyleSheet, Text, View } from 'react-native';
import { font, leading, radius, space, weatherColor } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { WEATHER_LABEL, type Weather } from '@/shared/weather';

type Props = { items: { weather: Weather; days: number }[] };

/** 시안 05 `sum-row`. 수치는 서버 집계를 그대로 보여준다 */
export function MonthSummary({ items }: Props) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View
          key={item.weather}
          accessible
          accessibilityLabel={`${WEATHER_LABEL[item.weather]} ${item.days}일`}
          style={styles.item}
        >
          <View style={styles.head}>
            <View style={[styles.dot, { backgroundColor: weatherColor[item.weather] }]} />
            <Text style={[styles.days, { color: colors.text }]}>{item.days}일</Text>
          </View>
          <Text style={[styles.label, { color: colors.textMuted }]}>{WEATHER_LABEL[item.weather]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[3] },
  item: { flex: 1, alignItems: 'center', gap: space[1] },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: radius.full },
  days: { fontSize: font.base, lineHeight: leading(font.base, 1.15), fontWeight: font.weightBold },
  label: { fontSize: font.xs, lineHeight: leading(font.xs, 1.1) },
});
