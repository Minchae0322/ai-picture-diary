import { useState } from 'react';
import { EmotionFace } from '@/shared/ui/EmotionFace';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmotionGauge } from './EmotionGauge';
import { font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { QUICK_EMOTIONS, EMOTION_LABEL, type Emotion } from '../api/diaryTypes';

const MAX_LENGTH = 500;

type Props = {
  submitting: boolean;
  errorMessage?: string;
  onSubmit: (content: string, userHint: Emotion | null) => void;
};

/** 02 홈 · 오늘 기록 전. 입력값은 화면이 들고 있는 로컬 상태다(frontend-state 0장). */
/** Screen 이 주는 좌우 여백. 칩 줄은 이 여백을 뚫고 화면 끝까지 밀린다 */
const SIDE = space[4];
const CHIP_GAP = space[2];
/**
 * 한 화면에 셋이 들어가고 넷째가 조금 걸치도록 나눈다.
 * 걸쳐 보이는 것이 "더 있다"는 유일한 신호다 - 딱 셋만 보이면 밀 생각을 안 한다.
 */
const VISIBLE = 3.25;

export function DiaryComposer({ submitting, errorMessage, onSubmit }: Props) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  // 셋이 들어가고 넷째가 조금 걸치는 폭
  const chipWidth = Math.round((width - SIDE * 2 - CHIP_GAP * VISIBLE) / VISIBLE);
  const [content, setContent] = useState('');
  const [hint, setHint] = useState<Emotion | null>(null);
  /** 세기. -2 ~ 2, 0 은 기준. 감정을 바꾸면 기준으로 돌아간다 */
  const [hintLevel, setHintLevel] = useState(0);
  const canSubmit = content.trim().length > 0 && !submitting;

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>아직 오늘의 기분이 없어요</Text>
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chips}
        >
          {QUICK_EMOTIONS.map((emotion) => {
            const selected = hint === emotion;
            return (
              <Pressable
                key={emotion}
                onPress={() => {
                  setHint(selected ? null : emotion);
                  setHintLevel(0);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={EMOTION_LABEL[emotion]}
                hitSlop={(MIN_TOUCH_TARGET - 36) / 2}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    width: chipWidth,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary : colors.surface,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View style={styles.chipInner}>
                  <EmotionFace emotion={emotion} size={22} />
                  <Text style={{ color: selected ? colors.primaryFg : colors.text, fontSize: font.sm , fontFamily: font.regular}}>
                    {EMOTION_LABEL[emotion]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 감정을 고르면 세기를 묻는다. 고르기 전에는 물을 것이 없다 */}
        {hint ? (
          <View style={styles.gauge}>
            <EmotionGauge emotion={hint} level={hintLevel} onChange={setHintLevel} />
          </View>
        ) : null}
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
  emptyTitle: { fontSize: font.lg, fontFamily: font.bold },
  emptyBody: { fontSize: font.sm , fontFamily: font.regular},
  canvas: {
    height: 180,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1],
  },
  canvasMark: { fontSize: font.xxl , fontFamily: font.regular},
  canvasLabel: { fontSize: font.xs , fontFamily: font.regular},
  input: {
    minHeight: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space[3],
    fontSize: font.base, fontFamily: font.regular,
    textAlignVertical: 'top',
  },
  counter: { alignSelf: 'flex-end', fontSize: font.xs, fontFamily: font.regular, marginTop: space[1] },
  sectionTitle: { fontSize: font.sm, fontFamily: font.regular, marginBottom: space[2] },
  /** 좌우 여백을 뚫고 화면 끝까지. 안쪽 패딩이 그 여백을 되돌려 준다 */
  chipScroll: { marginHorizontal: -SIDE },
  gauge: { marginTop: space[3] },
  chips: { flexDirection: 'row', gap: CHIP_GAP, paddingHorizontal: SIDE },
  chipInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  /**
   * 보이는 상자는 36 이지만 `hitSlop` 으로 눌리는 영역을 44 까지 넓힌다 -
   * 상자를 줄이면서 터치 타깃을 함께 줄이면 손가락이 빗나간다.
   */
  chip: {
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: space[2],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  error: { fontSize: font.sm , fontFamily: font.regular},
});
