import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Chip } from '@/shared/ui/Chip';
import { Heading, Label, Muted, Note } from '@/shared/ui/Type';
import { font, leading, radius, space } from '@/shared/theme/tokens';
import { useColors, useWeatherColors } from '@/shared/theme/useColors';
import { MAX_CONTENT_LENGTH, QUICK_WEATHERS, WEATHER_LABEL, type Weather } from '../api/diaryTypes';

/** 글자 수는 상한에 가까워질 때만 보여준다. 늘 떠 있으면 한 줄 쓰라는 화면에서 시험지처럼 읽힌다 */
const COUNTER_FROM = 450;

type Props = {
  submitting: boolean;
  errorMessage?: string;
  onSubmit: (content: string, userHint: Weather | null) => void;
};

/**
 * 02 홈 · 오늘 기록 전. 입력값은 화면이 들고 있는 로컬 상태다(frontend-state 0장).
 *
 * 입력과 전송 버튼은 **한 알약 안에** 있다(prototype `.composer`). 큰 버튼을 따로 두면
 * 화면 아래쪽이 버튼 둘(기록 / 탭바)로 무거워진다.
 */
export function DiaryComposer({ submitting, errorMessage, onSubmit }: Props) {
  const colors = useColors();
  const weatherColors = useWeatherColors();
  const [content, setContent] = useState('');
  const [hint, setHint] = useState<Weather | null>(null);
  const canSubmit = content.trim().length > 0 && !submitting;

  return (
    <>
      <Card>
        <Heading>아직 오늘의 날씨가 없어요</Heading>
        <Muted style={styles.tight}>한 줄 기록하면 AI가 오늘을 그려줍니다</Muted>

        <View style={[styles.canvas, { borderColor: `${colors.accentSoft}59`, backgroundColor: colors.surface }]}>
          <Text style={[styles.canvasMark, { color: colors.accentSoft }]}>?</Text>
          <Note>AI 그림 영역</Note>
        </View>

        <View
          style={[
            styles.composer,
            { borderColor: colors.borderStrong, backgroundColor: colors.surfaceSolid },
          ]}
        >
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="오늘 어땠나요?"
            placeholderTextColor={colors.textSubtle}
            maxLength={MAX_CONTENT_LENGTH}
            multiline
            accessibilityLabel="오늘의 한 줄 기록"
            style={[styles.input, { color: colors.text }]}
          />
          <Button
            label="기록"
            size="small"
            loading={submitting}
            disabled={!canSubmit}
            accessibilityHint={canSubmit ? undefined : '한 줄을 입력하면 기록할 수 있어요'}
            onPress={() => onSubmit(content.trim(), hint)}
          />
        </View>

        {content.length >= COUNTER_FROM ? (
          <Muted style={styles.counter}>
            {content.length} / {MAX_CONTENT_LENGTH}
          </Muted>
        ) : null}

        {errorMessage ? (
          <Muted style={{ color: colors.danger }}>{errorMessage}</Muted>
        ) : null}
      </Card>

      <View style={styles.section}>
        <Label>빠른 감정 선택</Label>
        <View style={styles.chips}>
          {QUICK_WEATHERS.map((weather) => (
            <Chip
              key={weather}
              label={WEATHER_LABEL[weather]}
              dot={weatherColors[weather]}
              selected={hint === weather}
              onPress={() => setHint(hint === weather ? null : weather)}
            />
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  /** `.card` 의 gap(12) 을 제목 바로 아래서만 줄인다(prototype `margin-top:-8px`) */
  tight: { marginTop: -space[2] },
  canvas: {
    height: 150,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  canvasMark: { fontSize: 44, lineHeight: 48, fontFamily: font.black },
  composer: {
    minHeight: 53,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space[3],
    paddingLeft: space[5],
    padding: space[2],
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    maxHeight: 96,
    paddingVertical: 9,
    fontSize: font.base,
    lineHeight: leading(font.base),
    fontFamily: font.regular,
  },
  counter: { alignSelf: 'flex-end' },
  section: { gap: space[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
});
