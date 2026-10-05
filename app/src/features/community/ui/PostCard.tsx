import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/shared/ui/Card';
import { Chip } from '@/shared/ui/Chip';
import { formatRelative } from '@/shared/format';
import { font, leading, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors, useWeatherColors } from '@/shared/theme/useColors';
import { GradientFill } from '@/shared/ui/Gradient';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { WEATHER_ICON, WEATHER_LABEL, toWeather } from '@/shared/weather';
import type { CommunityPost } from '../api/communityApi';

type Props = {
  post: CommunityPost;
  onToggleLike: () => void;
  onReport: () => void;
  /** 댓글·게시글 상세 화면이 아직 없다. 눌리면 준비 중임을 알린다 */
  onNotReady: (name: string) => void;
};

/**
 * 08 피드 카드(prototype `.post`).
 *
 * 시안에 그림이 없어 텍스트만 공유하지만, 카드마다 **날씨 썸네일**을 둬서 피드가 글 목록이 아니라
 * 날씨 목록으로 읽히게 한다(08 화면 문서 4장의 갈림길에서 텍스트를 택했다).
 * 신고는 시안에 없지만 UGC 배포의 필수 동선이라 카드마다 둔다(app-store-release).
 */
export function PostCard({ post, onToggleLike, onReport, onNotReady }: Props) {
  const colors = useColors();
  const weatherColors = useWeatherColors();
  const weather = toWeather(post.weather);
  const tint = weather ? weatherColors[weather] : colors.decor;

  return (
    <Card variant="flat" contentStyle={styles.card}>
      <View style={styles.head}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.avatar, { backgroundColor: tint }]}
        >
          <Text style={[styles.initial, { color: colors.weatherInk }]}>
            {[...post.authorName][0] ?? ''}
          </Text>
        </View>

        <View style={styles.identity}>
          <Text numberOfLines={1} style={[styles.author, { color: colors.text }]}>
            {post.authorName}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {formatRelative(post.createdAt)}
          </Text>
        </View>

        {weather ? <Chip label={WEATHER_LABEL[weather]} dot={tint} /> : null}

        <Pressable
          onPress={onReport}
          hitSlop={space[2]}
          accessibilityRole="button"
          accessibilityLabel={`${post.authorName}의 글 신고 또는 차단`}
          style={({ pressed }) => [styles.more, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Icon name="more" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.thumb}>
          {weather ? (
            <>
              <GradientFill from="#ffffff" fromOpacity={0.9} to={tint} />
              <Icon name={WEATHER_ICON[weather]} size={28} color={colors.weatherInk} />
            </>
          ) : null}
        </View>

        <View style={styles.text}>
          <Text numberOfLines={3} style={[styles.content, { color: colors.text }]}>
            {post.content}
          </Text>

          <View style={styles.reactions}>
            <Reaction
              icon={post.likedByMe ? 'heart' : 'heart-outline'}
              label={String(post.likeCount)}
              active={post.likedByMe}
              accessibilityLabel={`좋아요 ${post.likeCount}개${post.likedByMe ? ', 누름' : ''}`}
              onPress={onToggleLike}
            />
            <Reaction
              icon="chat"
              label={String(post.commentCount)}
              accessibilityLabel={`댓글 ${post.commentCount}개`}
              onPress={() => onNotReady('댓글')}
            />
            <Reaction
              icon="share"
              label="공유"
              accessibilityLabel="이 글 공유하기"
              onPress={() => onNotReady('공유')}
            />
          </View>
        </View>
      </View>
    </Card>
  );
}

function Reaction({
  icon,
  label,
  active = false,
  accessibilityLabel,
  onPress,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const colors = useColors();
  const tint = active ? colors.primary : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.reaction, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Icon name={icon} size={16} color={tint} />
      <Text
        style={[
          styles.reactionLabel,
          { color: tint, fontFamily: active ? font.bold : font.regular },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[4] },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: font.lg, fontFamily: font.bold },
  identity: { flex: 1, minWidth: 0 },
  author: { fontSize: font.base, fontFamily: font.bold },
  time: { fontSize: font.xs, fontFamily: font.regular },
  more: { minWidth: 28, alignItems: 'flex-end' },
  body: { flexDirection: 'row', gap: space[3] },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0, justifyContent: 'space-between', gap: space[3] },
  content: { fontSize: font.base, lineHeight: leading(font.base), fontFamily: font.regular },
  reactions: { flexDirection: 'row', gap: space[4] },
  reaction: { minHeight: MIN_TOUCH_TARGET - space[4], flexDirection: 'row', alignItems: 'center', gap: space[1] },
  reactionLabel: { fontSize: font.base, fontVariant: ['tabular-nums'] },
});
