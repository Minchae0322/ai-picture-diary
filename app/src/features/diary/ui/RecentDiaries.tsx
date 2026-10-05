import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatShortDate } from '@/shared/format';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors, useWeatherColors } from '@/shared/theme/useColors';
import { GradientFill } from '@/shared/ui/Gradient';
import { Icon } from '@/shared/ui/Icon';
import { Label } from '@/shared/ui/Type';
import { WEATHER_ICON, weatherLabel } from '@/shared/weather';
import type { DiarySummary } from '../api/diaryTypes';

/**
 * 02 최근 기록. prototype `.recent` - 세로 목록이 아니라 **가로로 늘어선 카드 3장**이다.
 * 날씨 썸네일이 주인공이라 목록 행으로 만들면 그림이 사라진다.
 *
 * 0건이면 섹션 자체를 숨긴다(빈 리스트 UI를 만들지 않는다).
 */
export function RecentDiaries({
  items,
  onSelect,
}: {
  items: DiarySummary[];
  onSelect: (id: string) => void;
}) {
  const colors = useColors();
  const weatherColors = useWeatherColors();

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Label>최근 기록</Label>
      <View style={styles.row}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`${formatShortDate(item.entryDate)} ${weatherLabel(item.weather)} ${item.content}`}
            style={({ pressed }) => [
              styles.cell,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <View style={styles.thumb}>
              {item.weather ? (
                <>
                  <GradientFill from="#ffffff" fromOpacity={0.9} to={weatherColors[item.weather]} />
                  <Icon name={WEATHER_ICON[item.weather]} size={20} color={colors.weatherInk} />
                </>
              ) : null}
            </View>
            <Text style={[styles.date, { color: colors.text }]}>
              {formatShortDate(item.entryDate)}
            </Text>
            <Text numberOfLines={1} style={[styles.content, { color: colors.textMuted }]}>
              {item.content}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[3] },
  row: { flexDirection: 'row', gap: space[3] },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: space[2],
    paddingVertical: space[3],
    paddingHorizontal: space[2],
    borderRadius: 22,
    borderWidth: 1,
  },
  thumb: {
    alignSelf: 'stretch',
    height: 64,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: space[2],
  },
  date: { fontSize: font.xs, fontFamily: font.bold },
  content: { fontSize: font.micro, fontFamily: font.regular, alignSelf: 'stretch', textAlign: 'center' },
});
