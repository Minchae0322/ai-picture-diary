import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { font, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { WEATHER_EMOJI, WEATHER_LABEL, type DiaryDetail } from '../api/diaryTypes';

type Props = {
  diary: DiaryDetail;
  regenerating: boolean;
  onRegenerate: () => void;
};

/** 04 오늘의 결과. "AI generated" 표기는 제거하지 않는다(생성물 고지). */
export function DiaryResult({ diary, regenerating, onRegenerate }: Props) {
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
          <Text style={[styles.weather, { color: colors.text }]}>
            {WEATHER_EMOJI[diary.weather]} {WEATHER_LABEL[diary.weather]}
            {diary.moodScore !== null ? ` · 기분 ${diary.moodScore > 0 ? '+' : ''}${diary.moodScore}` : ''}
          </Text>
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
      </View>
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
  weather: { fontSize: font.lg, fontWeight: font.weightBold },
  content: { fontSize: font.base },
  comment: { fontSize: font.sm },
  actions: { flexDirection: 'row', gap: space[3] },
  action: { flex: 1 },
});
