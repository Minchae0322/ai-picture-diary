import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Chip } from '@/shared/ui/Chip';
import { Icon } from '@/shared/ui/Icon';
import { Muted, Note } from '@/shared/ui/Type';
import { formatScore } from '@/shared/format';
import { font, leading, radius, space } from '@/shared/theme/tokens';
import { useColors, useWeatherColors } from '@/shared/theme/useColors';
import { WEATHER_LABEL } from '@/shared/weather';
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
  const weatherColors = useWeatherColors();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!diary.imageUrl && !imageFailed;

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
        <View style={[styles.tag, { backgroundColor: colors.surfaceSolid, borderColor: colors.border }]}>
          <Text style={[styles.tagText, { color: colors.textMuted }]}>AI generated</Text>
        </View>
      </View>

      {diary.weather ? (
        <View style={styles.verdict}>
          <Chip
            label={`${WEATHER_LABEL[diary.weather]}${
              diary.moodScore === null ? '' : ` · 기분 ${formatScore(diary.moodScore)}`
            }`}
            dot={weatherColors[diary.weather]}
          />
        </View>
      ) : null}

      <Text style={[styles.content, { color: colors.text }]}>“{diary.content}”</Text>
      {diary.aiComment ? <Muted>AI 코멘트 · {diary.aiComment}</Muted> : null}

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
        {/* 시안의 "저장하기". 생성 직후 자동 저장이라 누를 것이 없다(04 화면 문서 7장) */}
        <Button
          label="저장됨"
          variant="soft"
          fill
          disabled
          accessibilityHint="기록은 자동으로 저장돼요"
          onPress={() => {}}
        />
        {onShare ? (
          <View style={styles.shareSlot}>
            <Button
              label={shared ? '공유함' : '공유'}
              variant="soft"
              fill
              loading={sharing}
              disabled={shared}
              accessibilityHint={shared ? '이미 커뮤니티에 공유했어요' : '커뮤니티 피드에 올려요'}
              onPress={onShare}
            />
          </View>
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
    borderWidth: 1,
  },
  tagText: { fontSize: font.xs, fontFamily: font.regular },
  /** 칩은 스스로 왼쪽에 붙지만, 바깥 stack 의 가로 늘리기를 끊어 주는 줄이 필요하다 */
  verdict: { flexDirection: 'row' },
  content: { fontSize: font.lg, lineHeight: leading(font.lg), fontFamily: font.medium },
  actions: { flexDirection: 'row', gap: space[3] },
  /** prototype `.actions .btn:last-child { flex: 0 0 76px }` */
  shareSlot: { width: 76, flexDirection: 'row' },
  badgeCard: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[4] },
  medal: { width: 32, height: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  badgeLine: { flex: 1, fontSize: font.base, fontFamily: font.bold },
});
