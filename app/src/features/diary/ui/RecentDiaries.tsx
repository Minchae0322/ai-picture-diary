import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SketchBorder } from '@/shared/ui/SketchBorder';
import { EmotionFace } from '@/shared/ui/EmotionFace';
import { formatShortDate } from '@/shared/format';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { Label } from '@/shared/ui/Type';
import { emotionLabel } from '@/shared/emotion';
import type { DiarySummary } from '../api/diaryTypes';

/**
 * 02 최근 기록. prototype `.recent` - 세로 목록이 아니라 **가로로 늘어선 카드 3장**이다.
 * 감정 캐릭터 썸네일이 주인공이라 목록 행으로 만들면 그림이 사라진다.
 *
 * 0건이면 섹션 자체를 숨긴다(빈 리스트 UI를 만들지 않는다).
 */
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
        <Label>최근 기록</Label>
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
      <View style={styles.row}>
        {items.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`${formatShortDate(item.entryDate)} ${emotionLabel(item.emotion)} ${item.content}`}
            style={({ pressed }) => [
              styles.cell,
              { backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            {/* 세 칸이 제각기 떨려야 "손으로 놓은 더미"가 된다 */}
            <SketchBorder radius={22} color={colors.border} strokeWidth={1.3} seed={index * 41 + 7} />
            <View style={[styles.thumb, { backgroundColor: colors.faceBg }]}>
              {item.emotion ? <EmotionFace emotion={item.emotion} size={58} /> : null}
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
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  /** 작은 글자라 눌리는 영역을 hitSlop 으로 넓힌다 */
  more: { paddingVertical: space[1] },
  moreLabel: { fontSize: font.xs, fontFamily: font.medium },
  row: { flexDirection: 'row', gap: space[3] },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: space[2],
    paddingVertical: space[3],
    paddingHorizontal: space[2],
    borderRadius: 22,
  },
  /**
   * prototype `.recent .thumb` - 78px, 캐릭터 58. **과일 색을 깔지 않는다** -
   * 같은 계열이라 캐릭터가 묻힌다. 면은 faceBg 단색이고 경계는 테두리가 잡는다
   */
  thumb: {
    alignSelf: 'stretch',
    height: 78,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: { fontSize: font.xs, fontFamily: font.bold },
  content: {
    fontSize: font.micro,
    fontFamily: font.regular,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
});
