import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatShortDate } from '@/shared/format';
import { font, MIN_TOUCH_TARGET, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { Icon } from '@/shared/ui/Icon';
import { WEATHER_ICON, weatherLabel } from '@/shared/weather';
import type { DiarySummary } from '../api/diaryTypes';

/** 02 최근 기록. 0건이면 섹션 자체를 숨긴다(빈 리스트 UI를 만들지 않는다). */
export function RecentDiaries({
  items,
  onSelect,
}: {
  items: DiarySummary[];
  onSelect: (id: string) => void;
}) {
  const colors = useColors();
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.textMuted }]}>최근 기록</Text>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onSelect(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`${formatShortDate(item.entryDate)} ${weatherLabel(item.weather)} ${item.content}`}
          style={({ pressed }) => [
            styles.row,
            { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.date, { color: colors.textMuted }]}>
            {formatShortDate(item.entryDate)}
          </Text>
          {item.weather ? <Icon name={WEATHER_ICON[item.weather]} size={16} color={colors.textMuted} /> : null}
          <Text numberOfLines={1} style={[styles.content, { color: colors.text }]}>
            {item.content}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  title: { fontSize: font.sm },
  row: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  date: { fontSize: font.xs, width: 40 },
  content: { flex: 1, fontSize: font.sm },
});
