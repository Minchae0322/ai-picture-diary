import { StyleSheet, Text, View } from 'react-native';
import { font, leading, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { formatMood } from '@/shared/weather';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { WeatherTag } from '@/shared/ui/WeatherTag';
import type { DiaryDetail } from '../api/diaryTypes';
import { DiaryArtwork } from './DiaryArtwork';

type Props = {
  diary: DiaryDetail;
  regenerating: boolean;
  onRegenerate: () => void;
  onShare: () => void;
  /** 이번 저장으로 새로 얻은 뱃지. 없으면 카드 자체를 뺀다 */
  earnedBadge?: string;
};

/** 04 오늘의 결과 (시안 9:2). "AI generated" 표기는 제거하지 않는다(생성물 고지) */
export function DiaryResult({ diary, regenerating, onRegenerate, onShare, earnedBadge }: Props) {
  const colors = useColors();

  return (
    <View style={styles.wrap}>
      <DiaryArtwork
        imageUrl={diary.imageUrl}
        weather={diary.weather}
        fallbackAction={
          diary.canRegenerate ? (
            <Button label="다시 그리기" size="medium" variant="soft" loading={regenerating} onPress={onRegenerate} />
          ) : undefined
        }
      />

      {diary.weather === null ? null : (
        <WeatherTag
          weather={diary.weather}
          trailing={diary.moodScore === null ? undefined : `기분 ${formatMood(diary.moodScore)}`}
        />
      )}

      <Text style={[styles.content, { color: colors.text }]}>“{diary.content}”</Text>

      {diary.aiComment === null ? null : (
        <Text style={[styles.comment, { color: colors.textMuted }]}>AI 코멘트 · {diary.aiComment}</Text>
      )}

      {/* 시안 `actions` 3개. 저장은 생성 직후 자동으로 끝나 있어 누를 것이 없다 */}
      <View style={styles.actions}>
        <Button
          label="다시 그리기"
          size="large"
          variant="soft"
          style={styles.action}
          loading={regenerating}
          disabled={!diary.canRegenerate}
          accessibilityHint={diary.canRegenerate ? undefined : '오늘은 더 다시 그릴 수 없어요'}
          onPress={onRegenerate}
        />
        <Button
          label="저장하기"
          size="large"
          variant="soft"
          style={styles.action}
          disabled
          accessibilityHint="생성과 동시에 저장돼요. 따로 누르지 않아도 됩니다"
          onPress={() => undefined}
        />
        <Button label="공유" size="large" variant="soft" onPress={onShare} />
      </View>

      {earnedBadge === undefined ? null : (
        <Card size="lg" flat style={styles.badgeCard}>
          <View style={[styles.badgeDot, { backgroundColor: colors.accentSoft }]} />
          <Text style={[styles.badgeText, { color: colors.text }]}>{earnedBadge}</Text>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[5] },
  content: { fontSize: font.lg, lineHeight: leading(font.lg), fontWeight: font.weightMedium },
  comment: { fontSize: font.sm, lineHeight: leading(font.sm), marginTop: -space[2] },
  actions: { flexDirection: 'row', gap: space[3] },
  action: { flex: 1 },
  badgeCard: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[4] },
  badgeDot: { width: 32, height: 32, borderRadius: radius.full },
  badgeText: { fontSize: font.base, fontWeight: font.weightBold, flex: 1 },
});
