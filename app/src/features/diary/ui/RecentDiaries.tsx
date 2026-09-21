import { StyleSheet, Text, View } from 'react-native';
import { font, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { WEATHER_EMOJI, type DiarySummary } from '../api/diaryTypes';

/** 02 최근 기록. 0건이면 섹션 자체를 숨긴다(빈 리스트 UI를 만들지 않는다). */
export function RecentDiaries({ items }: { items: DiarySummary[] }) {
  const colors = useColors();
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.textMuted }]}>최근 기록</Text>
      {items.map((item) => (
        <View key={item.id} accessible style={[styles.row, { borderColor: colors.border }]}>
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(item.entryDate)}</Text>
          <Text numberOfLines={1} style={[styles.content, { color: colors.text }]}>
            {item.weather ? `${WEATHER_EMOJI[item.weather]} ` : ''}
            {item.content}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** ISO 문자열은 표시 직전에만 변환한다 */
function formatDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${Number(month)}/${Number(day)}`;
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  title: { fontSize: font.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  date: { fontSize: font.xs, width: 40 },
  content: { flex: 1, fontSize: font.sm },
});
