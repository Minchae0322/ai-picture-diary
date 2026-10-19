import { useState } from 'react';
import { SketchBorder } from '@/shared/ui/SketchBorder';
import { DiaryDrawModal } from './DiaryDrawModal';
import { StrokeCanvas, type Stroke } from './StrokeCanvas';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Chip } from '@/shared/ui/Chip';
import { Icon } from '@/shared/ui/Icon';
import { Muted, Note } from '@/shared/ui/Type';
import { formatScore } from '@/shared/format';
import { font, leading, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { EMOTION_LABEL } from '@/shared/emotion';
import { DAILY_REGENERATE_LIMIT, type DiaryDetail } from '../api/diaryTypes';

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
 * prototype 은 그림과 글을 **카드에 담지 않는다** - 그림 자체가 카드만큼 크고 라운드도 같아서
 * 카드에 넣으면 테두리가 두 겹으로 겹친다.
 *
 * AI 코멘트는 화면에서 뺐다. 서버는 여전히 `aiComment` 를 내려주고 저장도 한다 -
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

  /**
   * AI 가 그려 준 그림 위에 덧그린 획. **아직 기기 안에만 있다** - 서버에 저장하려면
   * 테이블이 하나 필요하고(획을 JSON 으로), 그건 스키마 변경이라 `sql/patch` 와 ADR 이 먼저다.
   */
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [drawing, setDrawing] = useState(false);

  return (
    <>
      <View style={[styles.art, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {showImage ? (
          <Image
            source={{ uri: diary.imageUrl! }}
            style={styles.image}
            onError={() => setImageFailed(true)}
            accessibilityLabel="오늘의 AI 그림"
          />
        ) : (
          <Muted>그림을 만들지 못했어요</Muted>
        )}
        {/* 결과 화면에서는 보기만 한다. 그리기는 스크롤과 싸우지 않는 모달에서 */}
        {strokes.length > 0 ? <StrokeCanvas strokes={strokes} /> : null}

        <View style={[styles.tag, { backgroundColor: colors.surfaceSolid }]}>
          {/* 생성물 고지. 떼지 않는다 - 손그림 테두리만 입힌다 */}
          <SketchBorder radius={16} color={colors.border} strokeWidth={1.2} wobble={0.7} seed={59} />
          <Text style={[styles.tagText, { color: colors.textMuted }]}>AI generated</Text>
        </View>

        {/* 펜은 액션 줄이 아니라 그림 위에 둔다 - 고치는 대상 옆에 있어야 한다 */}
        {showImage ? (
          <Pressable
            onPress={() => setDrawing(true)}
            accessibilityRole="button"
            accessibilityHint="AI 그림 위에 펜으로 덧그려요"
            style={[styles.penToggle, { backgroundColor: colors.surfaceSolid }]}
          >
            <SketchBorder
              radius={16}
              color={colors.border}
              strokeWidth={1.2}
              wobble={0.7}
              seed={97}
            />
            <Text
              style={[styles.tagText, { color: colors.textMuted, fontFamily: font.bold }]}
            >
              덧그리기
            </Text>
          </Pressable>
        ) : null}
      </View>

      <DiaryDrawModal
        visible={drawing}
        imageUrl={diary.imageUrl ?? null}
        strokes={strokes}
        onClose={() => setDrawing(false)}
        onSave={(next) => {
          setStrokes(next);
          setDrawing(false);
        }}
      />

      {diary.emotion ? (
        <View style={styles.verdict}>
          <Chip
            label={`${EMOTION_LABEL[diary.emotion]}${
              diary.moodScore === null ? '' : ` · 기분 ${formatScore(diary.moodScore)}`
            }`}
            emotion={diary.emotion}
          />
        </View>
      ) : null}

      <Text style={[styles.content, { color: colors.text }]}>“{diary.content}”</Text>

      <View style={styles.actions}>
        <Button
          label="다시 그리기"
          variant="soft"
          fill
          loading={regenerating}
          disabled={!diary.canRegenerate}
          accessibilityHint={diary.canRegenerate ? undefined : '오늘은 더 다시 그릴 수 없어요'}
          onPress={onRegenerate}
        />
        {/* 기록 자체는 생성 직후 자동 저장된다. 이 버튼은 **그림을 기기 사진첩에 내려받는** 것이다.
            expo-media-library 가 아직 없어 안내만 띄운다 - 되는 척하지 않는다 */}
        <Button
          label="저장"
          variant="soft"
          fill
          accessibilityHint="그림을 기기 사진첩에 내려받아요"
          onPress={saveImage}
        />
        {onShare ? (
          <Button
            label={shared ? '업로드함' : '업로드'}
            variant="soft"
            fill
            loading={sharing}
            disabled={shared}
            accessibilityHint={shared ? '이미 커뮤니티에 올렸어요' : '커뮤니티에 올려요. 올리기 전에 공개 범위를 묻습니다'}
            onPress={() => askVisibility(onShare)}
          />
        ) : null}
      </View>

      <Note>
        {diary.canRegenerate
          ? `다시 그리기는 하루 ${DAILY_REGENERATE_LIMIT}번까지예요.`
          : '오늘의 다시 그리기를 다 썼어요.'}
      </Note>

      {shareError ? <Muted style={{ color: colors.danger }}>{shareError}</Muted> : null}

      {earnedBadges.map((badge) => (
        <Card key={badge.code} variant="flat" contentStyle={styles.badgeCard}>
          <View style={[styles.medal, { backgroundColor: colors.accentSoft }]}>
            <Icon name="medal" size={18} color={colors.primaryFg} />
          </View>
          <Text style={[styles.badgeLine, { color: colors.text }]}>
            새 뱃지 “{badge.name}” · {badge.condition}
          </Text>
        </Card>
      ))}
    </>
  );
}

/** 그림 내려받기. expo-media-library 가 붙기 전까지는 안내만 한다 */
function saveImage() {
  Alert.alert(
    '이미지 저장',
    '기기에 내려받는 기능은 다음 라운드에 붙습니다. 기록 자체는 이미 저장돼 있어요.',
  );
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
  art: {
    aspectRatio: 1,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  tag: {
    position: 'absolute',
    left: space[4],
    top: space[4],
    paddingHorizontal: space[3],
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  tagText: { fontSize: font.xs, fontFamily: font.regular },
  penToggle: {
    position: 'absolute',
    right: space[4],
    top: space[4],
    paddingHorizontal: space[3],
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  /** 칩은 스스로 왼쪽에 붙지만, 바깥 stack 의 가로 늘리기를 끊어 주는 줄이 필요하다 */
  verdict: { flexDirection: 'row' },
  content: { fontSize: font.lg, lineHeight: leading(font.lg), fontFamily: font.medium },
  /** prototype `.actions` - 세 칸을 고르게 나눈다 */
  actions: { flexDirection: 'row', gap: space[3] },
  badgeCard: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[4] },
  medal: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLine: { flex: 1, fontSize: font.base, fontFamily: font.bold },
});
