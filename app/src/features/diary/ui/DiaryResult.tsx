import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Icon } from '@/shared/ui/Icon';
import { formatScore } from '@/shared/format';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { WEATHER_ICON, WEATHER_LABEL } from '@/shared/weather';
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

/** 04 오늘의 결과. "AI generated" 표기는 제거하지 않는다(생성물 고지). */
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

        {diary.weather ? (
          <View style={styles.weatherRow}>
            <Icon name={WEATHER_ICON[diary.weather]} size={24} color={colors.text} />
            <Text style={[styles.weather, { color: colors.text }]}>
              {WEATHER_LABEL[diary.weather]}
              {diary.moodScore !== null ? ` · 기분 ${formatScore(diary.moodScore)}` : ''}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.content, { color: colors.text }]}>“{diary.content}”</Text>
        {diary.aiComment ? (
          <Text style={[styles.comment, { color: colors.textMuted }]}>{diary.aiComment}</Text>
        ) : null}
      </Card>

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label="다시 그리기"
            variant="ghost"
            loading={regenerating}
            disabled={!diary.canRegenerate}
            accessibilityHint={diary.canRegenerate ? undefined : '오늘은 더 다시 그릴 수 없어요'}
            onPress={onRegenerate}
          />
        </View>
        <View style={styles.action}>
          {/* 시안의 "저장하기". 생성 직후 자동 저장이라 누를 것이 없다(04 화면 문서 7장) */}
          <Button
            label="저장됨"
            variant="ghost"
            disabled
            accessibilityHint="기록은 자동으로 저장돼요"
            onPress={() => {}}
          />
        </View>
        {onShare ? (
          <View style={styles.action}>
            <Button
              label={shared ? '공유함' : '공유'}
              loading={sharing}
              disabled={shared}
              accessibilityHint={shared ? '이미 커뮤니티에 공유했어요' : '커뮤니티 피드에 올려요'}
              onPress={onShare}
            />
          </View>
        ) : null}
      </View>

      {shareError ? <Text style={{ color: colors.danger, fontSize: font.sm }}>{shareError}</Text> : null}

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
  imageFallback: { fontSize: font.sm },
  tag: {
    position: 'absolute',
    right: space[2],
    bottom: space[2],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: { fontSize: font.xs },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  weather: { fontSize: font.lg, fontWeight: font.weightBold },
  content: { fontSize: font.base },
  comment: { fontSize: font.sm },
  actions: { flexDirection: 'row', gap: space[2] },
  action: { flex: 1 },
  badgeHead: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  badgeTitle: { fontSize: font.base, fontWeight: font.weightBold },
  badgeLine: { fontSize: font.sm },
});
