import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { QUICK_WEATHERS, WEATHER_EMOJI, WEATHER_LABEL, type Weather } from '../api/diaryTypes';

const MAX_LENGTH = 500;

type Props = {
  submitting: boolean;
  errorMessage?: string;
  onSubmit: (content: string, userHint: Weather | null) => void;
};

/** 02 홈 · 오늘 기록 전. 입력값은 화면이 들고 있는 로컬 상태다(frontend-state 0장). */
export function DiaryComposer({ submitting, errorMessage, onSubmit }: Props) {
  const colors = useColors();
  const [content, setContent] = useState('');
  const [hint, setHint] = useState<Weather | null>(null);
  const canSubmit = content.trim().length > 0 && !submitting;

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>아직 오늘의 날씨가 없어요</Text>
        <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
          한 줄 기록하면 AI가 오늘을 그려드려요
        </Text>
        <View style={[styles.canvas, { borderColor: colors.border, backgroundColor: colors.bg }]}>
          <Text style={[styles.canvasMark, { color: colors.textSubtle }]}>?</Text>
          <Text style={[styles.canvasLabel, { color: colors.textSubtle }]}>AI 그림 영역</Text>
        </View>
      </Card>

      <View>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="오늘 어땠나요?"
          placeholderTextColor={colors.textSubtle}
          maxLength={MAX_LENGTH}
          multiline
          accessibilityLabel="오늘의 한 줄 기록"
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        />
        <Text style={[styles.counter, { color: colors.textSubtle }]}>
          {content.length} / {MAX_LENGTH}
        </Text>
      </View>

      <View>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>빠른 감정 선택</Text>
        <View style={styles.chips}>
          {QUICK_WEATHERS.map((weather) => {
            const selected = hint === weather;
            return (
              <Pressable
                key={weather}
                onPress={() => setHint(selected ? null : weather)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={WEATHER_LABEL[weather]}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary : colors.surface,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ color: selected ? colors.primaryFg : colors.text, fontSize: font.sm }}>
                  {WEATHER_EMOJI[weather]} {WEATHER_LABEL[weather]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {errorMessage ? <Text style={[styles.error, { color: colors.danger }]}>{errorMessage}</Text> : null}

      <Button
        label="기록"
        size="xlarge"
        loading={submitting}
        disabled={!canSubmit}
        accessibilityHint={canSubmit ? undefined : '한 줄을 입력하면 기록할 수 있어요'}
        onPress={() => onSubmit(content.trim(), hint)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[4] },
  emptyTitle: { fontSize: font.lg, fontWeight: font.weightBold },
  emptyBody: { fontSize: font.sm },
  canvas: {
    height: 180,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1],
  },
  canvasMark: { fontSize: font.xxl },
  canvasLabel: { fontSize: font.xs },
  input: {
    minHeight: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space[4],
    fontSize: font.base,
    textAlignVertical: 'top',
  },
  counter: { alignSelf: 'flex-end', fontSize: font.xs, marginTop: space[1] },
  sectionTitle: { fontSize: font.sm, marginBottom: space[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  chip: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: space[4],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  error: { fontSize: font.sm },
});
