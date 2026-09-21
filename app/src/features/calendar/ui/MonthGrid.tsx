import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, leading, radius, space, weatherColor } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { WEATHER_EMOJI, WEATHER_LABEL, type Weather } from '@/shared/weather';
import { WEEKDAYS, type MonthCell } from '../model/monthGrid';

type Props = {
  cells: MonthCell[];
  /** 'YYYY-MM-DD' -> 그날의 날씨 */
  weatherByDate: Map<string, Weather>;
  todayIso: string;
  onSelect: (date: string) => void;
};

/**
 * 05 `card` 안의 날짜 격자. 7열.
 *
 * 시안의 셀은 색 원 하나지만 **원 안에 날씨 글리프를 같이 넣는다.**
 * 날씨색 6종은 색만으로는 구분되지 않는다. 채도를 낮춘 지금 팔레트에서는 더 그렇다
 * (흐림 #b6bfc8 <-> 비 #8fa9c8). 칩·태그에는 라벨이 붙지만 이 셀에는 라벨 자리가 없다.
 * 칩·태그에는 라벨이 붙어 문제가 없지만 이 셀에는 라벨 자리가 없다
 * (dataviz "색으로만 의미를 구분하지 않는다", docs/screen/06-graph.md 4장).
 *
 * 기록 있는 날 / 무기록일 / 미래 세 가지도 시각으로 구분한다(docs/screen/05-calendar.md 4장).
 */
export function MonthGrid({ cells, weatherByDate, todayIso, onSelect }: Props) {
  const colors = useColors();

  return (
    <View style={styles.grid}>
      <View style={styles.week}>
        {WEEKDAYS.map((weekday) => (
          <Text key={weekday} style={[styles.weekday, { color: colors.textSubtle }]}>
            {weekday}
          </Text>
        ))}
      </View>

      <View style={styles.days}>
        {cells.map((cell, index) => {
          const date = cell.date;
          if (date === null) {
            return <View key={`blank-${index}`} style={styles.cell} />;
          }
          const weather = weatherByDate.get(date);
          const isToday = date === todayIso;
          const isFuture = date > todayIso;

          return (
            <Pressable
              key={date}
              disabled={weather === undefined}
              onPress={() => onSelect(date)}
              accessibilityRole="button"
              accessibilityLabel={
                weather === undefined
                  ? `${cell.day}일, 기록 없음`
                  : `${cell.day}일, ${WEATHER_LABEL[weather]}`
              }
              style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.6 : isFuture ? 0.35 : 1 }]}
            >
              <View
                style={[
                  styles.dot,
                  weather === undefined
                    ? { borderWidth: 1.5, borderColor: colors.borderStrong }
                    : { backgroundColor: weatherColor[weather] },
                  isToday && { borderWidth: 2, borderColor: colors.primary },
                ]}
              >
                {weather === undefined ? null : (
                  <Text
                    style={styles.glyph}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  >
                    {WEATHER_EMOJI[weather]}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.day,
                  { color: isToday ? colors.primary : colors.textMuted },
                  isToday && { fontWeight: font.weightBold },
                ]}
              >
                {cell.day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: space[3] },
  week: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: font.xs,
    lineHeight: leading(font.xs, 1.3),
    fontWeight: font.weightMedium,
  },
  days: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space[2] },
  cell: { width: `${100 / 7}%`, alignItems: 'center', gap: 6, paddingVertical: space[1] },
  dot: { width: 32, height: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 15, lineHeight: 18 },
  day: { fontSize: font.sm, lineHeight: leading(font.sm, 1.1) },
});
