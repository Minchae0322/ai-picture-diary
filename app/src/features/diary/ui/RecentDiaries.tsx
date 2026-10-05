import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { font, leading, radius, space, weatherColor } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { WEATHER_EMOJI, WEATHER_LABEL } from '@/shared/weather';
import type { DiarySummary } from '../api/diaryTypes';
import { formatShortDate } from '../model/format';

/** 02 `recent`. 0건이면 섹션 자체를 숨긴다(빈 목록 UI를 만들지 않는다) */
export function RecentDiaries({ items }: { items: DiarySummary[] }) {
  const colors = useColors();
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        최근 기록
      </Text>
      <View style={styles.row}>
        {items.map((item) => (
          <View
            key={item.id}
            accessible
            accessibilityLabel={`${formatShortDate(item.entryDate)} ${
              item.weather === null ? '' : WEATHER_LABEL[item.weather]
            } ${item.content}`}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {/* 시안 `Rectangle`: 흰색에서 그날 날씨색으로 떨어지는 썸네일 */}
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.9)',
                item.weather === null ? colors.decor : weatherColor[item.weather],
              ] as const}
              style={styles.thumb}
            >
              {/* 날씨색만으로는 구분되지 않아 글리프를 같이 둔다(MonthGrid와 같은 이유) */}
              {item.weather === null ? null : (
                <Text style={styles.glyph} accessibilityElementsHidden importantForAccessibility="no">
                  {WEATHER_EMOJI[item.weather]}
                </Text>
              )}
            </LinearGradient>
            <Text style={[styles.date, { color: colors.text }]}>{formatShortDate(item.entryDate)}</Text>
            <Text numberOfLines={1} style={[styles.excerpt, { color: colors.textMuted }]}>
              {item.content}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[3] },
  title: { fontSize: font.base, fontFamily: font.bold },
  row: { flexDirection: 'row', gap: space[3] },
  card: {
    flex: 1,
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[2],
    paddingVertical: space[3],
    borderWidth: 1,
    borderRadius: 22,
  },
  thumb: {
    width: '100%',
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  glyph: { fontSize: 18, fontFamily: font.regular, lineHeight: 22 },
  date: { fontSize: font.xs, lineHeight: leading(font.xs, 1.2), fontFamily: font.bold },
  excerpt: { fontSize: font.micro, fontFamily: font.regular, lineHeight: leading(font.micro, 1.2) },
});
