import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmotionFace } from '@/shared/ui/EmotionFace';
import { Card } from '@/shared/ui/Card';
import { formatRelative } from '@/shared/format';
import { font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { Icon } from '@/shared/ui/Icon';
import { EMOTION_IMAGE, EMOTION_LABEL, toEmotion } from '@/shared/emotion';
import type { CommunityPost } from '../api/communityApi';

type Props = {
  post: CommunityPost;
  onToggleLike: () => void;
  onReport: () => void;
};

/**
 * 08 피드 카드. 시안에 그림이 없어 텍스트만 공유한다(08 화면 문서 4장의 갈림길에서 텍스트를 택했다).
 * 신고는 시안에 없지만 UGC 배포의 필수 동선이라 카드마다 둔다(app-store-release).
 */
export function PostCard({ post, onToggleLike, onReport }: Props) {
  const colors = useColors();
  const emotion = toEmotion(post.emotion);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={[styles.author, { color: colors.text }]}>{post.authorName}</Text>
        <Text style={[styles.time, { color: colors.textSubtle }]}>{formatRelative(post.createdAt)}</Text>
      </View>

      {emotion ? (
        <View style={[styles.emotion, { backgroundColor: colors.faceBg, borderColor: colors.border }]}>
          <EmotionFace emotion={emotion} size={24} />
          <Text style={[styles.emotionText, { color: colors.text }]}>{EMOTION_LABEL[emotion]}</Text>
        </View>
      ) : null}

      <Text style={[styles.content, { color: colors.text }]}>{post.content}</Text>

      <View style={styles.reactions}>
        <Pressable
          onPress={onToggleLike}
          accessibilityRole="button"
          accessibilityState={{ selected: post.likedByMe }}
          accessibilityLabel={`좋아요 ${post.likeCount}개${post.likedByMe ? ', 누름' : ''}`}
          style={({ pressed }) => [styles.reaction, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Icon
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={16}
            color={post.likedByMe ? colors.primary : colors.textMuted}
          />
          <Text style={{ color: post.likedByMe ? colors.primary : colors.textMuted, fontSize: font.sm , fontFamily: font.regular}}>
            {post.likeCount}
          </Text>
        </Pressable>

        <View accessible accessibilityLabel={`댓글 ${post.commentCount}개`} style={styles.reaction}>
          <Icon name="chat" size={16} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: font.sm , fontFamily: font.regular}}>{post.commentCount}</Text>
        </View>

        <Pressable
          onPress={onReport}
          accessibilityRole="button"
          accessibilityLabel="이 글 신고하기"
          style={({ pressed }) => [styles.reaction, styles.report, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={{ color: colors.textSubtle, fontSize: font.sm , fontFamily: font.regular}}>신고</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  author: { fontSize: font.sm, fontFamily: font.bold },
  time: { fontSize: font.xs , fontFamily: font.regular},
  emotion: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.full,
  },
  emotionText: { fontSize: font.xs , fontFamily: font.regular},
  content: { fontSize: font.base , fontFamily: font.regular},
  reactions: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  reaction: { minHeight: MIN_TOUCH_TARGET, flexDirection: 'row', alignItems: 'center', gap: space[1] },
  report: { marginLeft: 'auto' },
});
