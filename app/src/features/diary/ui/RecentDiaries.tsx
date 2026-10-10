import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmotionFace } from '@/shared/ui/EmotionFace';
import { formatShortDate } from '@/shared/format';
import { font, MIN_TOUCH_TARGET, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { emotionLabel } from '@/shared/emotion';
import type { DiarySummary } from '../api/diaryTypes';

/** 02 최근 기록. 0건이면 섹션 자체를 숨긴다(빈 리스트 UI를 만들지 않는다). */
export function RecentDiaries({
  items,
  onSelect,
  onMore,
}: {
  items: DiarySummary[];
  onSelect: (id: string) => void;
  /** 더보기. 기록 전부는 05 캘린더에 있다 */
  onMore: () => void;
}) {
  const colors = useColors();
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: colors.textMuted }]}>최근 기록</Text>
        <Pressable
          onPress={onMore}
          accessibilityRole="link"
          accessibilityLabel="최근 기록 더보기, 캘린더로 이동"
          hitSlop={space[2]}
          style={({ pressed }) => [styles.more, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={[styles.moreLabel, { color: colors.textMuted }]}>더보기 ›</Text>
        </Pressable>
      </View>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onSelect(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`${formatShortDate(item.entryDate)} ${emotionLabel(item.emotion)} ${item.content}`}
          style={({ pressed }) => [
            styles.row,
            { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.date, { color: colors.textMuted }]}>
            {formatShortDate(item.entryDate)}
          </Text>
          {item.emotion ? <EmotionFace emotion={item.emotion} size={26} /> : null}
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
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: font.sm, fontFamily: font.regular },
  /** 작은 글자라 눌리는 영역을 hitSlop 으로 넓힌다 */
  more: { paddingVertical: space[1] },
  moreLabel: { fontSize: font.xs, fontFamily: font.medium },
  row: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  date: { fontSize: font.xs, fontFamily: font.regular, width: 40 },
  content: { flex: 1, fontSize: font.sm , fontFamily: font.regular},
});
