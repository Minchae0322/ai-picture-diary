import { useState } from 'react';
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
import { EmotionFace } from '@/shared/ui/EmotionFace';
import { Heading, Label, Muted, Note } from '@/shared/ui/Type';
import { font, leading, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { EmotionGauge } from './EmotionGauge';
import {
  EMOTION_LABEL,
  MAX_CONTENT_LENGTH,
  QUICK_EMOTIONS,
  type Emotion,
} from '../api/diaryTypes';

/** 글자 수는 상한에 가까워질 때만 보여준다. 늘 떠 있으면 한 줄 쓰라는 화면에서 시험지처럼 읽힌다 */
const COUNTER_FROM = 450;

/** Screen 이 주는 좌우 여백. 칩 줄은 이 여백을 뚫고 화면 끝까지 밀린다 */
const SIDE = space[4];
const CHIP_GAP = space[2];
/**
 * 한 화면에 셋이 들어가고 넷째가 조금 걸치도록 나눈다.
 * 걸쳐 보이는 것이 "더 있다"는 유일한 신호다 - 딱 셋만 보이면 밀 생각을 안 한다.
 */
const VISIBLE = 3.25;

/** 보이는 칩 높이. 터치 타깃은 hitSlop 으로 MIN_TOUCH_TARGET 까지 넓힌다 */
const CHIP_HEIGHT = 36;

type Props = {
  submitting: boolean;
  errorMessage?: string;
  onSubmit: (content: string, userHint: Emotion | null) => void;
};

/**
 * 02 홈 · 오늘 기록 전. 입력값은 화면이 들고 있는 로컬 상태다(frontend-state 0장).
 *
 * 입력과 전송 버튼은 **한 알약 안에** 있다(prototype `.composer`). 큰 버튼을 따로 두면
 * 화면 아래쪽이 버튼 둘(기록 / 탭바)로 무거워진다.
 *
 * 빠른 감정은 9종이라 한 줄에 다 깔리지 않는다 - **가로 스크롤 칩**으로 두고
 * 고르면 그 아래에서 세기를 묻는다(`EmotionGauge`).
 */
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
    <>
      <Card>
        <Heading>아직 오늘의 기분이 없어요</Heading>
        <Muted style={styles.tight}>한 줄 기록하면 AI가 오늘을 그려줍니다</Muted>

        <View
          style={[
            styles.canvas,
            { borderColor: `${colors.accentSoft}59`, backgroundColor: colors.surface },
          ]}
        >
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

        {errorMessage ? <Muted style={{ color: colors.danger }}>{errorMessage}</Muted> : null}
      </Card>

      <View style={styles.section}>
        <Label>빠른 감정 선택</Label>
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
                hitSlop={(MIN_TOUCH_TARGET - CHIP_HEIGHT) / 2}
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
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: selected ? colors.primaryFg : colors.text },
                    ]}
                  >
                    {EMOTION_LABEL[emotion]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 감정을 고르면 세기를 묻는다. 고르기 전에는 물을 것이 없다 */}
        {hint ? <EmotionGauge emotion={hint} level={hintLevel} onChange={setHintLevel} /> : null}
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
  /** 좌우 여백을 뚫고 화면 끝까지. 안쪽 패딩이 그 여백을 되돌려 준다 */
  chipScroll: { marginHorizontal: -SIDE },
  chips: { flexDirection: 'row', gap: CHIP_GAP, paddingHorizontal: SIDE },
  /**
   * 보이는 상자는 36 이지만 `hitSlop` 으로 눌리는 영역을 44 까지 넓힌다 -
   * 상자를 줄이면서 터치 타깃을 함께 줄이면 손가락이 빗나간다.
   */
  chip: {
    height: CHIP_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: space[2],
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  chipInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  chipLabel: { fontSize: font.sm, fontFamily: font.regular },
});
