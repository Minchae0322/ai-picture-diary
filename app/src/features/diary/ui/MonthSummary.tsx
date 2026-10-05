import { StyleSheet, Text, View } from 'react-native';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors, useWeatherColors } from '@/shared/theme/useColors';
import { WEATHER_LABEL, type Weather } from '@/shared/weather';

/** prototype `.sum` 은 네 칸까지 보여준다. 여섯 칸이면 390 폭에서 글자가 겹친다 */
const MAX_ITEMS = 4;

/** 05 이번 달 요약. 수치는 서버가 계산한 값 그대로 쓴다 - 클라이언트가 다시 세지 않는다. */
export function MonthSummary({ summary }: { summary: { weather: Weather; days: number }[] }) {
  const colors = useColors();
  const weatherColors = useWeatherColors();

  return (
    <View style={styles.row}>
      {summary.slice(0, MAX_ITEMS).map((item) => (
        <View
          key={item.weather}
          accessible
          accessibilityLabel={`${WEATHER_LABEL[item.weather]} ${item.days}일`}
          style={styles.item}
        >
          <View style={styles.top}>
            <View style={[styles.dot, { backgroundColor: weatherColors[item.weather] }]} />
            <Text style={[styles.days, { color: colors.text }]}>{item.days}일</Text>
          </View>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {WEATHER_LABEL[item.weather]}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[3] },
  item: { flex: 1, alignItems: 'center', gap: space[1] },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: radius.full },
  days: { fontSize: font.base, fontFamily: font.bold, fontVariant: ['tabular-nums'] },
  label: { fontSize: font.xs, fontFamily: font.regular },
});
