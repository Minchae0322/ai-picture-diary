import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { font, leading, MIN_TOUCH_TARGET, radius, space, weatherColor } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { WEATHER_EMOJI, WEATHER_LABEL } from '@/shared/weather';
import { Card } from '@/shared/ui/Card';
import type { FeedPost } from '../model/mockFeed';

type Props = { post: FeedPost; onToggleLike: (id: string) => void };

/** 시안 08 `card`. 반응 버튼만 따로 눌리고 나머지는 한 덩어리로 읽힌다 */
export function FeedCard({ post, onToggleLike }: Props) {
  const colors = useColors();

  return (
    <Card size="lg" flat style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.avatar, { backgroundColor: weatherColor[post.weather] }]}>
          <Text style={styles.avatarGlyph} accessibilityElementsHidden importantForAccessibility="no">
            {post.authorEmoji}
          </Text>
        </View>

        <View style={styles.headText}>
          <Text style={[styles.author, { color: colors.text }]}>
            {post.authorEmoji} {post.author}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>{post.relativeTime}</Text>
        </View>

        <View style={[styles.weather, { backgroundColor: colors.surfaceSolid, borderColor: colors.border }]}>
          <View style={[styles.weatherDot, { backgroundColor: weatherColor[post.weather] }]} />
          <Text style={[styles.weatherLabel, { color: colors.text }]}>{WEATHER_LABEL[post.weather]}</Text>
        </View>

        {/* 신고·차단은 시안에 없지만 UGC에 필수다(docs/screen/08-community.md 4장, 스토어 심사 항목) */}
        <Pressable
          onPress={() => reportOrBlock(post.author)}
          accessibilityRole="button"
          accessibilityLabel={`${post.author}의 글 신고 또는 차단`}
          hitSlop={space[2]}
          style={({ pressed }) => [styles.more, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={[styles.moreGlyph, { color: colors.textMuted }]}>···</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <LinearGradient colors={['rgba(255,255,255,0.9)', weatherColor[post.weather]] as const} style={styles.thumb}>
          <Text style={styles.thumbGlyph} accessibilityElementsHidden importantForAccessibility="no">
            {WEATHER_EMOJI[post.weather]}
          </Text>
        </LinearGradient>

        <View style={styles.bodyText}>
          <Text numberOfLines={2} style={[styles.content, { color: colors.text }]}>
            {post.content}
          </Text>

          <View style={styles.reactions}>
            <Pressable
              onPress={() => onToggleLike(post.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: post.liked }}
              accessibilityLabel={`좋아요 ${post.likes}개${post.liked ? ', 누름' : ''}`}
              hitSlop={space[2]}
              style={({ pressed }) => [styles.reaction, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Text style={{ color: post.liked ? colors.primary : colors.textMuted, fontSize: font.base }}>
                ♥ {post.likes}
              </Text>
            </Pressable>

            {/* 댓글·공유 화면이 아직 없다(docs/screen/08-community.md 7장). 지금은 수치만 보여준다 */}
            <Text style={[styles.reactionText, { color: colors.textMuted }]}>💬 {post.comments}</Text>
            <Text style={[styles.reactionText, { color: colors.textMuted }]}>↗ 공유</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function reportOrBlock(author: string) {
  Alert.alert(`${author}의 글`, '어떻게 할까요?', [
    { text: '신고', style: 'destructive', onPress: () => undefined },
    { text: '이 사용자 차단', style: 'destructive', onPress: () => undefined },
    { text: '취소', style: 'cancel' },
  ]);
}

const styles = StyleSheet.create({
  card: { gap: space[4] },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  avatar: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  avatarGlyph: { fontSize: 18, lineHeight: 22 },
  headText: { flex: 1, gap: 2 },
  author: { fontSize: font.base, lineHeight: leading(font.base, 1.1), fontWeight: font.weightBold },
  time: { fontSize: font.xs, lineHeight: leading(font.xs, 1.1) },
  weather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: space[2],
    paddingRight: space[3],
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  weatherDot: { width: 10, height: 10, borderRadius: radius.full },
  weatherLabel: { fontSize: font.xs, fontWeight: font.weightMedium },
  more: { minWidth: 24, minHeight: 28, alignItems: 'center', justifyContent: 'center' },
  moreGlyph: { fontSize: font.xl, lineHeight: 20 },
  body: { flexDirection: 'row', gap: space[3] },
  thumb: { width: 76, height: 76, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  thumbGlyph: { fontSize: 26, lineHeight: 32 },
  bodyText: { flex: 1, justifyContent: 'space-between', gap: space[3] },
  content: { fontSize: font.base, lineHeight: leading(font.base) },
  reactions: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  reaction: { minHeight: MIN_TOUCH_TARGET - 20, justifyContent: 'center' },
  reactionText: { fontSize: font.base },
});
