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
import { EmotionFace } from '@/shared/ui/EmotionFace';
import { Icon } from '@/shared/ui/Icon';
import { NotePaper } from '@/shared/ui/NotePaper';
import { SketchBorder } from '@/shared/ui/SketchBorder';
import { Label, Muted, Note } from '@/shared/ui/Type';
import { font, gutter, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { EmotionGauge } from './EmotionGauge';
import {
  EMOTION_LABEL,
  MAX_CONTENT_LENGTH,
  QUICK_EMOTIONS,
  type Emotion,
} from '../api/diaryTypes';

/** 글줄 높이이자 **괘선 간격**이다. 둘이 같아야 글자가 줄 위에 앉는다(`NotePaper`) */
const LINE_HEIGHT = 28;
/** 처음 보이는 줄 수. 넉넉히 비어 있어야 "써도 된다"로 읽힌다 */
const MIN_LINES = 4;
/** 여기까지 종이가 자란다. 더 길어지면 종이 안에서 굴린다 - 화면을 통째로 먹지 않게 */
const MAX_LINES = 7;

/**
 * 글자 수를 **빨강으로 바꾸는** 지점. 상한의 90%.
 * 처음부터 빨갛게 세면 한 줄 쓰라는 화면이 시험지가 된다.
 */
const WARN_FROM = Math.round(MAX_CONTENT_LENGTH * 0.9);

/** `Screen width="wide"` 가 주는 좌우 여백. 칩 줄은 이 여백을 뚫고 화면 끝까지 밀린다 */
const SIDE = gutter.wide;
const CHIP_GAP = space[2];
/**
 * 한 화면에 셋이 들어가고 넷째가 조금 걸치도록 나눈다.
 * 걸쳐 보이는 것이 "더 있다"는 유일한 신호다 - 딱 셋만 보이면 밀 생각을 안 한다.
 */
const VISIBLE = 3.25;

/** 보이는 칩 높이. 터치 타깃은 hitSlop 으로 MIN_TOUCH_TARGET 까지 넓힌다 */
const CHIP_HEIGHT = 36;

/** 단계 번호 동그라미의 지름 */
const STEP_MARK = 24;

type Props = {
  submitting: boolean;
  errorMessage?: string;
  /** 기분은 필수라 `Emotion` 이다. 고르기 전에는 버튼이 눌리지 않는다 */
  onSubmit: (content: string, userHint: Emotion) => void;
};

/**
 * 02 홈 · 오늘 기록 전. 입력값은 화면이 들고 있는 로컬 상태다(frontend-state 0장).
 *
 * <p><b>이 화면의 설계 제약은 하나다 - 390x844 에서 공책과 "오늘 그리기"가 스크롤 없이 보일 것.</b>
 * 쓰라고 만든 화면인데 쓰는 자리를 찾으러 스크롤해야 하면 그 화면은 실패한 것이다.
 * 쓸 수 있는 세로는 탭바와 안전영역을 빼고 680 뿐이라 네 덩이를 그 안에 넣는다:
 * 빈 그림 자리 94 · 1단계 70 · 2단계 178 · 버튼 89. 간격은 16 으로 좁혔다
 * (`Screen` 기본 24 를 그대로 쓰면 세 틈에서만 24 가 샌다).
 *
 * <p>그래서 **빈 그림 자리를 눕혔다.** 150 짜리 정사각 액자는 "앞으로 생길 것"의 자리인데
 * 아직 아무것도 없는 동안 화면의 절반을 먹어 정작 할 일(고르기·쓰기)을 밀어냈다.
 * 가로로 눕혀 94 로 줄이면 점선 테두리와 캐릭터가 남아 "여기에 그림이 생긴다"는 말은 그대로 하면서
 * 쓰는 자리를 접힌 선 위로 끌어올린다.
 *
 * <p>**기분은 필수다**(ADR 2026-10-20). 고르지 않으면 서버가 거절하므로 앱이 먼저 막되,
 * 버튼만 흐리게 두지 않고 <b>무엇이 비었는지 글로 말한다.</b>
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
  /** 글이 길어지면 종이도 자란다. 공책은 칸이 늘지 상자가 스크롤되지 않는다 */
  const [lines, setLines] = useState(MIN_LINES);

  const written = content.trim().length > 0;
  const canSubmit = written && hint !== null && !submitting;

  /** 비활성 버튼의 이유. 무엇이 비었는지 **한 번에 하나만** 말한다 - 둘을 같이 말하면 안 읽힌다 */
  const missing = !hint
    ? '오늘의 기분을 먼저 골라 주세요'
    : !written
      ? '오늘 한 줄을 써 주세요'
      : null;

  return (
    <View style={styles.root}>
      {/*
        아직 아무것도 없는 그림 자리. 점선과 연한 캐릭터가 "여기에 생긴다"를 말한다.
        고른 기분의 캐릭터로 바꾸지 않는다 - 최종 감정은 AI 가 정하고 내 선택과 다를 수 있는데,
        미리 세워 두면 그 그림을 결과로 약속하는 것이 된다(프로젝트 스킬 3장).
      */}
      <View
        style={[
          styles.slot,
          { borderColor: `${colors.accentSoft}59`, backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.slotMark}>
          <EmotionFace emotion="SOSO" size={56} />
        </View>
        <View style={styles.slotText}>
          <Label>아직 오늘의 그림이 없어요</Label>
          <Muted>기분을 고르고 한 줄 쓰면 여기에 AI 그림이 나타나요</Muted>
        </View>
      </View>

      <View style={styles.step}>
        <StepHead step="1" title="오늘의 기분" done={hint !== null}>
          {hint ? (
            <Note style={{ color: colors.textMuted }}>{EMOTION_LABEL[hint]}</Note>
          ) : (
            <Note style={{ color: colors.primary }}>필수</Note>
          )}
        </StepHead>

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
                  <EmotionFace emotion={emotion} size={24} />
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

      <View style={styles.step}>
        <StepHead step="2" title="오늘 한 줄" done={written}>
          <Counter length={content.length} />
        </StepHead>

        <NotePaper lineHeight={LINE_HEIGHT} lines={lines} seed={271} tape>
          <TextInput
            value={content}
            onChangeText={setContent}
            onContentSizeChange={(event) => {
              const rows = Math.ceil(event.nativeEvent.contentSize.height / LINE_HEIGHT);
              setLines(Math.min(MAX_LINES, Math.max(MIN_LINES, rows)));
            }}
            placeholder="오늘 어땠나요?"
            placeholderTextColor={colors.textSubtle}
            maxLength={MAX_CONTENT_LENGTH}
            multiline
            textAlignVertical="top"
            accessibilityLabel="오늘의 한 줄 기록"
            accessibilityHint={`${MAX_CONTENT_LENGTH}자까지 쓸 수 있어요`}
            style={[styles.input, { color: colors.text, height: LINE_HEIGHT * lines }]}
          />
        </NotePaper>
      </View>

      <View style={styles.submit}>
        <Button
          label="오늘 그리기"
          size="xlarge"
          loading={submitting}
          disabled={!canSubmit}
          accessibilityHint={missing ?? undefined}
          onPress={() => (hint ? onSubmit(content.trim(), hint) : undefined)}
        />
        {/* 비활성 버튼 옆에는 **이유**가 있어야 한다. 흐린 버튼만 두면 고장으로 읽힌다 */}
        {missing ? <Muted style={styles.center}>{missing}</Muted> : null}
        {errorMessage ? (
          <Muted style={[styles.center, { color: colors.danger }]}>{errorMessage}</Muted>
        ) : null}
      </View>
    </View>
  );
}

/**
 * 단계 머리. 번호 동그라미 + 이름 + 오른쪽 보조(필수 / 고른 감정 / 글자 수).
 *
 * <p>동그라미는 자로 잰 `borderRadius` 가 아니라 손으로 그린 원이다. 끝낸 단계는 번호 대신
 * 체크가 들어가고 선이 브랜드색이 된다 - **무엇을 했고 무엇이 남았는지**가 한눈에 보인다.
 */
function StepHead({
  step,
  title,
  done,
  children,
}: {
  step: string;
  title: string;
  done: boolean;
  children?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.stepHead}>
      <View style={styles.stepMark}>
        <SketchBorder
          radius={STEP_MARK / 2}
          color={done ? colors.primary : colors.border}
          strokeWidth={1.5}
          seed={done ? 61 : 29}
        />
        {done ? (
          <Icon name="check" size={14} color={colors.primary} />
        ) : (
          <Text style={[styles.stepNumber, { color: colors.textMuted }]}>{step}</Text>
        )}
      </View>
      <Label style={styles.stepTitle}>{title}</Label>
      {children}
    </View>
  );
}

/** 글자 수. 0자일 때는 숨긴다 - 빈 종이 옆의 "0 / 200"은 시험지다 */
function Counter({ length }: { length: number }) {
  const colors = useColors();
  if (length === 0) {
    return null;
  }
  const full = length >= MAX_CONTENT_LENGTH;
  const near = length >= WARN_FROM;
  return (
    <Note style={{ color: full ? colors.danger : near ? colors.warning : colors.textMuted }}>
      {length} / {MAX_CONTENT_LENGTH}
    </Note>
  );
}

const styles = StyleSheet.create({
  /**
   * `Screen` 의 기본 세로 간격은 24 다. 그대로 두면 덩이 사이 세 틈에서만 24 가 새고
   * 공책이 접힌 선 밑으로 내려간다. 이 화면만 16 으로 좁혀 쥔다.
   */
  root: { gap: space[4] },

  /** 가로로 누운 그림 자리. 94 안에 점선·캐릭터·설명이 다 들어간다 */
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    padding: space[4],
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  /** 진하면 "이게 내 그림인가"로 읽힌다. 아직 없다는 것이 보이는 선까지만 */
  slotMark: { opacity: 0.35 },
  slotText: { flex: 1, gap: space[1] },

  step: { gap: space[3] },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  stepMark: {
    width: STEP_MARK,
    height: STEP_MARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: { fontSize: font.xs, fontFamily: font.bold },
  /** 이름이 자리를 다 먹고 보조 글자는 오른쪽 끝에 붙는다 */
  stepTitle: { flex: 1 },

  input: {
    padding: 0,
    fontSize: font.md,
    lineHeight: LINE_HEIGHT,
    fontFamily: font.regular,
  },

  submit: { gap: space[2] },
  center: { textAlign: 'center' },

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
