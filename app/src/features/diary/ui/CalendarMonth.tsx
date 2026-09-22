import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors, useWeatherColors } from '@/shared/theme/useColors';
import { Icon } from '@/shared/ui/Icon';
import { WEATHER_ICON, weatherLabel, type Weather } from '@/shared/weather';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type Cell = { day: number; date: string; weather: Weather | null; diaryId: string | null };

type Props = {
  /** "2026-08" */
  month: string;
  days: { date: string; diaryId: string; weather: Weather }[];
  today: string;
  onSelect: (diaryId: string) => void;
};

/**
 * 05 날짜 그리드. 주 시작은 일요일 고정(시안 기준).
 * 기록 없는 날·미래 날은 시안에 정의가 없어 여기서 정했다: 기록 없음은 테두리만, 미래는 흐리게.
 */
export function CalendarMonth({ month, days, today, onSelect }: Props) {
  const colors = useColors();
  const weatherColors = useWeatherColors();
  const byDate = new Map(days.map((day) => [day.date, day]));
  const cells = buildCells(month, byDate);
  const leadingBlanks = new Date(`${month}-01T00:00:00`).getDay();

  return (
    <View>
      <View style={styles.week}>
        {WEEKDAYS.map((label) => (
          <Text key={label} style={[styles.weekday, { color: colors.textMuted }]}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <View key={`blank-${index}`} style={styles.cell} />
        ))}

        {cells.map((cell) => {
          const isToday = cell.date === today;
          const isFuture = cell.date > today;
          const recorded = cell.weather !== null;

          return (
            <Pressable
              key={cell.date}
              disabled={!cell.diaryId}
              onPress={() => cell.diaryId && onSelect(cell.diaryId)}
              accessibilityRole={cell.diaryId ? 'button' : undefined}
              accessibilityLabel={`${cell.day}일 ${weatherLabel(cell.weather)}`}
              style={({ pressed }) => [styles.cell, { opacity: isFuture ? 0.35 : pressed ? 0.6 : 1 }]}
            >
              <View
                style={[
                  styles.mark,
                  {
                    backgroundColor: recorded ? `${weatherColors[cell.weather!]}33` : 'transparent',
                    borderColor: isToday ? colors.primary : recorded ? 'transparent' : colors.border,
                    borderWidth: isToday ? 2 : 1,
                  },
                ]}
              >
                {recorded ? (
                  <Icon name={WEATHER_ICON[cell.weather!]} size={17} color={weatherColors[cell.weather!]} />
                ) : null}
              </View>
              <Text style={[styles.day, { color: isToday ? colors.primary : colors.textMuted }]}>
                {cell.day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function buildCells(
  month: string,
  byDate: Map<string, { date: string; diaryId: string; weather: Weather }>,
): Cell[] {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();

  return Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const record = byDate.get(date);
    return { day, date, weather: record?.weather ?? null, diaryId: record?.diaryId ?? null };
  });
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row' },
  weekday: { flexBasis: `${100 / 7}%`, textAlign: 'center', fontSize: font.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { flexBasis: `${100 / 7}%`, alignItems: 'center', paddingVertical: space[1], gap: 2 },
  mark: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: { fontSize: font.xs },
});
