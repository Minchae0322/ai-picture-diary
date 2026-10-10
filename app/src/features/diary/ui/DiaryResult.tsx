import { useState } from 'react';
import { EmotionFace } from '@/shared/ui/EmotionFace';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Icon } from '@/shared/ui/Icon';
import { formatScore } from '@/shared/format';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { EMOTION_IMAGE, EMOTION_LABEL } from '@/shared/emotion';
import type { DiaryDetail } from '../api/diaryTypes';

type Props = {
  diary: DiaryDetail;
  regenerating: boolean;
  onRegenerate: () => void;
  /** 08 커뮤니티로 공유. 과거 날짜 상세에서는 주지 않는다. */
  onShare?: () => void;
  sharing?: boolean;
  shared?: boolean;
  shareError?: string;
  /** 이번 저장으로 새로 얻은 뱃지. 없으면 카드 영역 자체를 뺀다(04 화면 문서 4장). */
  earnedBadges?: { code: string; name: string; condition: string }[];
};

/**
 * 04 오늘의 결과. "AI generated" 표기는 제거하지 않는다(생성물 고지).
 *
 * <p>AI 코멘트는 화면에서 뺐다. 서버는 여전히 `aiComment` 를 내려주고 저장도 한다 -
 * 다시 보여주기로 하면 화면만 되돌리면 된다(마이그레이션이 필요 없다).
 */
export function DiaryResult({
  diary,
  regenerating,
  onRegenerate,
  onShare,
  sharing = false,
  shared = false,
  shareError,
  earnedBadges = [],
}: Props) {
  const colors = useColors();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!diary.imageUrl && !imageFailed;

  return (
    <View style={styles.wrap}>
      <Card>
        <View style={[styles.artwork, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          {showImage ? (
            <Image
              source={{ uri: diary.imageUrl! }}
              style={styles.image}
              onError={() => setImageFailed(true)}
              accessibilityLabel="오늘의 AI 그림"
            />
          ) : (
            <Text style={[styles.imageFallback, { color: colors.textMuted }]}>
              그림을 만들지 못했어요
            </Text>
          )}
          <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.tagText, { color: colors.textMuted }]}>AI generated</Text>
          </View>
        </View>

        {diary.emotion ? (
          <View style={styles.emotionRow}>
            <EmotionFace emotion={diary.emotion} size={40} />
            <Text style={[styles.emotion, { color: colors.text }]}>
              {EMOTION_LABEL[diary.emotion]}
              {diary.moodScore !== null ? ` · 기분 ${formatScore(diary.moodScore)}` : ''}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.content, { color: colors.text }]}>“{diary.content}”</Text>
      </Card>

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label="다시그리기"
            variant="ghost"
            loading={regenerating}
            disabled={!diary.canRegenerate}
            accessibilityHint={diary.canRegenerate ? undefined : '오늘은 더 다시 그릴 수 없어요'}
            onPress={onRegenerate}
          />
        </View>
        <View style={styles.action}>
          {/* 기록 자체는 생성 직후 자동 저장된다. 이 버튼은 **그림을 기기 사진첩에 내려받는** 것이다.
              expo-media-library 가 아직 없어 안내만 띄운다 - 되는 척하지 않는다 */}
          <Button
            label="저장"
            variant="ghost"
            accessibilityHint="그림을 기기 사진첩에 내려받아요"
            onPress={saveImage}
          />
        </View>
        {onShare ? (
          <View style={styles.action}>
            <Button
              label={shared ? '업로드함' : '업로드'}
              loading={sharing}
              disabled={shared}
              accessibilityHint={shared ? '이미 커뮤니티에 올렸어요' : '커뮤니티에 올려요. 올리기 전에 공개 범위를 묻습니다'}
              onPress={() => askVisibility(onShare)}
            />
          </View>
        ) : null}
      </View>

      {shareError ? <Text style={{ color: colors.danger, fontSize: font.sm , fontFamily: font.regular}}>{shareError}</Text> : null}

      {earnedBadges.length > 0 ? (
        <Card>
          <View style={styles.badgeHead}>
            <Icon name="medal" size={18} color={colors.primary} />
            <Text style={[styles.badgeTitle, { color: colors.text }]}>새 뱃지를 받았어요</Text>
          </View>
          {earnedBadges.map((badge) => (
            <Text key={badge.code} style={[styles.badgeLine, { color: colors.textMuted }]}>
              {badge.name} · {badge.condition}
            </Text>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

/** 그림 내려받기. expo-media-library 가 붙기 전까지는 안내만 한다 */
function saveImage() {
  Alert.alert('이미지 저장', '기기에 내려받는 기능은 다음 라운드에 붙습니다. 기록 자체는 이미 저장돼 있어요.');
}

/**
 * 커뮤니티 업로드 전에 공개 범위를 묻는다.
 *
 * <p>올린 뒤에 바꾸게 하면 그 사이에 이미 남이 본다 - 올리기 전에 고르는 것이 순서다.
 * 비공개 보관은 서버에 아직 없다.
 */
function askVisibility(onPublic: () => void) {
  Alert.alert('커뮤니티에 올릴까요?', '공개로 올리면 피드에서 누구나 볼 수 있어요. 비공개는 나만 봅니다.', [
    { text: '공개로 올리기', onPress: onPublic },
    {
      text: '비공개로 저장',
      onPress: () => Alert.alert('비공개 저장', '비공개 보관은 서버에 아직 없어요. 다음 라운드에 붙습니다.'),
    },
    { text: '취소', style: 'cancel' },
  ]);
}

const styles = StyleSheet.create({
  wrap: { gap: space[4] },
  artwork: {
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  imageFallback: { fontSize: font.sm , fontFamily: font.regular},
  tag: {
    position: 'absolute',
    right: space[2],
    bottom: space[2],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: { fontSize: font.xs , fontFamily: font.regular},
  emotionRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  emotion: { fontSize: font.lg, fontFamily: font.bold },
  content: { fontSize: font.base , fontFamily: font.regular},
  actions: { flexDirection: 'row', gap: space[2] },
  action: { flex: 1 },
  badgeHead: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  badgeTitle: { fontSize: font.base, fontFamily: font.bold },
  badgeLine: { fontSize: font.sm , fontFamily: font.regular},
});
