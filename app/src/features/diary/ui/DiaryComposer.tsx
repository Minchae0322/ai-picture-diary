import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { font, leading, radius, space, weatherColor } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { QUICK_WEATHERS, WEATHER_LABEL, type Weather } from '@/shared/weather';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Chip } from '@/shared/ui/Chip';
import { EmptyCanvas } from './EmptyCanvas';

/** 본문 상한. 서버 `app.diary.max-content-length`와 같은 값이다 */
const MAX_LENGTH = 500;
/** 남은 글자를 알리기 시작하는 지점. 시안에는 카운터가 없어 평소에는 숨긴다 */
const COUNTER_FROM = 450;

type Props = {
  submitting: boolean;
  errorMessage?: string;
  onSubmit: (content: string, userHint: Weather | null) => void;
};

/** 02 홈 · 오늘 기록 전 (시안 8:28). 입력값은 화면이 들고 있는 로컬 상태다(frontend-state 0장) */
export function DiaryComposer({ submitting, errorMessage, onSubmit }: Props) {
  const colors = useColors();
  const [content, setContent] = useState('');
  const [hint, setHint] = useState<Weather | null>(null);
  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  return (
    <View style={styles.wrap}>
      <Card>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          아직 오늘의 날씨가 없어요
        </Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          한 줄 기록하면 AI가 오늘을 그려줍니다
        </Text>

        <EmptyCanvas />

        {/* 시안 `input` + `send`: 흰 알약 안에 전송 버튼이 들어 있다 */}
        <View
          style={[
            styles.inputRow,
            { backgroundColor: colors.surfaceSolid, borderColor: colors.borderStrong },
          ]}
        >
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="오늘 어땠나요?"
            placeholderTextColor={colors.textSubtle}
            maxLength={MAX_LENGTH}
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
            onPress={() => onSubmit(trimmed, hint)}
          />
        </View>

        {content.length >= COUNTER_FROM ? (
          <Text style={[styles.counter, { color: colors.textMuted }]}>
            {content.length} / {MAX_LENGTH}
          </Text>
        ) : null}

        {errorMessage === undefined ? null : (
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
            {errorMessage}
          </Text>
        )}
      </Card>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
          빠른 감정 선택
        </Text>
        <View style={styles.chips}>
          {QUICK_WEATHERS.map((weather) => (
            <Chip
              key={weather}
              label={WEATHER_LABEL[weather]}
              dotColor={weatherColor[weather]}
              selected={hint === weather}
              onPress={() => setHint(hint === weather ? null : weather)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[6] },
  title: { fontSize: font.lg, lineHeight: leading(font.lg), fontFamily: font.bold },
  sub: { fontSize: font.sm, fontFamily: font.regular, lineHeight: leading(font.sm), marginTop: -space[2] },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space[3],
    minHeight: 53,
    paddingLeft: space[5],
    paddingRight: space[2],
    paddingVertical: space[2],
    borderWidth: 1.5,
    borderRadius: radius.full,
  },
  input: {
    flex: 1,
    maxHeight: 96,
    paddingVertical: space[2],
    fontSize: font.base, fontFamily: font.regular,
    lineHeight: leading(font.base),
  },
  counter: { alignSelf: 'flex-end', fontSize: font.xs , fontFamily: font.regular},
  error: { fontSize: font.sm, fontFamily: font.regular, lineHeight: leading(font.sm) },
  section: { gap: space[3] },
  sectionTitle: { fontSize: font.base, fontFamily: font.bold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
});
