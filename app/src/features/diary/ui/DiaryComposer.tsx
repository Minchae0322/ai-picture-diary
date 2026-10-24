import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { EmotionFace } from '@/shared/ui/EmotionFace';
import { Muted } from '@/shared/ui/Type';
import { splitTodayParts } from '@/shared/format';
import { font, MIN_TOUCH_TARGET, radius, scale, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import {
  DiarySheet,
  LINE_HEIGHT,
  SheetRules,
  SHEET_FACE,
  SHEET_HEAD_FACE,
  sheetStyles,
  WRITE_TOP,
} from './DiarySheet';
import { StylePreview } from './StylePreview';
import {
  DRAW_STYLE_LABEL,
  DRAW_STYLES,
  EMOTION_LABEL,
  MAX_CONTENT_LENGTH,
  QUICK_EMOTIONS,
  type DrawStyle,
  type Emotion,
} from '../api/diaryTypes';

/** 처음 보이는 줄 수. 넉넉히 비어 있어야 "써도 된다"로 읽힌다 */
const MIN_LINES = 5;
/** 여기까지 종이가 자란다. 더 길어지면 종이 안에서 굴린다 */
const MAX_LINES = 7;

/** 글자 수를 **빨강으로 바꾸는** 지점. 상한의 90% */
const WARN_FROM = Math.round(MAX_CONTENT_LENGTH * 0.9);

/**
 * 머리 띠의 감정 얼굴. 아홉이 한 줄에 들어가야 한다 - 쓸 수 있는 가로는
 * 350(narrow 여백) - 28(종이 안쪽 여백) = 322 이라 한 칸이 약 35 다.
 */
/**
 * 처음 골라져 있는 기분.
 *
 * <p><b>ADR 2026-10-20 이 "고르지 않으면 그리지 않는다"로 정한 것과 어긋난다.</b> 그 ADR 의 근거는
 * "안 눌러도 되는 버튼은 안 눌린다"였는데, 기본값을 두면 손대지 않은 사람은 전부 이 값으로 기록된다.
 * 서버는 여전히 `userHint` 를 요구하므로 요청은 늘 통과한다 - 막는 장치가 사라지는 것이 아니라
 * **늘 충족되는 것**이다. 바꾸려면 그 ADR 을 다시 쓴다.
 */
const DEFAULT_EMOTION: Emotion = 'HAPPY';
/** 그림칸의 견본. 칸이 커졌으니 견본도 따라 커진다 - 작으면 큰 빈 칸에 점 하나로 보인다 */
const PREVIEW_SIZE = 176;
/** 그림체 칩 높이. 44 미만이라 hitSlop 으로 터치 영역을 채운다 */
const CHIP_HEIGHT = 40;

type Props = {
  submitting: boolean;
  errorMessage?: string;
  /** 기분은 필수라 `Emotion` 이다. 고르기 전에는 버튼이 눌리지 않는다 */
  onSubmit: (content: string, userHint: Emotion) => void;
  /** 그림체. 집은 프로필(`aiStyle`)이라 화면이 주고 화면이 저장한다 */
  style: DrawStyle;
  onStyleChange: (style: DrawStyle) => void;
  /**
   * 04 에서 "다시 쓰기"로 넘어오며 **들고 온 것**. 지운 기록의 글·기분·그림이다.
   *
   * <p>빈 종이로 돌려보내면 방금 쓴 글을 다시 치게 된다 - 고치려고 누른 것이지
   * 지우려고 누른 것이 아니다. 그림까지 같이 보여야 "이 그림이 마음에 안 들어서 고치는 중"이라는
   * 맥락이 유지된다. 새로 들어오면(처음 쓰는 날) 없다.
   */
  carried?: { content: string; emotion: Emotion | null; imageUrl: string | null } | null;
};

/**
 * 02 홈 · 오늘 기록 전. 입력값은 화면이 들고 있는 로컬 상태다(frontend-state 0장).
 *
 * <p><b>화면 전체가 그림일기 한 장이다</b>(시안 `docs/screen/images/sample/homeInputDiary.png`).
 * 머리 띠에 날짜와 오늘의 기분, 가운데에 그림칸, 아래에 괘선 글칸 - 초등학교 그림일기 학습지의
 * 구조 그대로다. 전에는 그림 틀·감정 칩·공책이 각자 테두리를 두르고 따로 떠 있었는데,
 * 한 장에 들어오니 테두리가 셋에서 하나로 줄고 화면이 <b>입력 폼이 아니라 일기장</b>으로 읽힌다.
 *
 * <p>감정 9종은 학습지의 <b>날씨 아이콘 자리</b>다. 전에는 가로 스크롤이라 3.5 개만 보였는데 -
 * 필수 입력의 선택지 절반이 화면 밖에 있던 셈이다 - 얼굴만 한 줄에 늘어놓아 <b>아홉이 한눈에</b>
 * 들어온다. 고른 것의 이름은 띠 오른쪽에 글로 나온다(그림만으로는 비슷한 둘이 구분되지 않는다,
 * 프로젝트 스킬 3장).
 *
 * <p>그림체는 <b>그림칸 안</b>에 둔다. 고르는 즉시 바로 위 견본이 바뀌므로 둘이 떨어지면
 * 무엇이 변했는지 눈이 못 따라간다.
 */
export function DiaryComposer({
  submitting,
  errorMessage,
  onSubmit,
  style,
  onStyleChange,
  carried,
}: Props) {
  const colors = useColors();

  const [content, setContent] = useState(carried?.content ?? '');
  /**
   * 오늘의 기분. **null 이 없다** - 처음부터 하나가 골라져 있고 해제되지 않는다.
   * 그래서 "안 고른 상태"를 다루는 분기가 이 화면에서 통째로 사라졌다.
   */
  const [hint, setHint] = useState<Emotion>(carried?.emotion ?? DEFAULT_EMOTION);
  const [lines, setLines] = useState(MIN_LINES);

  const written = content.trim().length > 0;
  const canSubmit = written && !submitting;

  /** 비활성 버튼의 이유. **한 번에 하나만** 말한다. 순서는 종이에 적는 순서와 같다 */
  const missing = !written ? '오늘 한 줄을 써 주세요' : null;

  return (
    <View style={styles.root}>
      <DiarySheet
        head={
          <View style={sheetStyles.headRow}>
            {/*
              학습지의 **"년 월 일" 빈칸**이다(시안). 단위(년·월·일)는 종이에 인쇄된 글자이고
              숫자는 거기 채워 넣은 값이라 **둘의 굵기와 색을 다르게** 둔다 - 한 덩어리로 쓰면
              그냥 날짜 문자열이 되고 "채워 넣은 종이"라는 느낌이 사라진다.
            */}
            <View style={sheetStyles.dateRow}>
              {splitTodayParts(new Date()).map((part) => (
                <View key={part.unit} style={sheetStyles.datePart}>
                  <Text style={[sheetStyles.dateValue, { color: colors.text }]}>{part.value}</Text>
                  <Text style={[sheetStyles.dateUnit, { color: colors.textMuted }]}>{part.unit}</Text>
                </View>
              ))}
            </View>

            {/*
              날짜 오른쪽 빈자리에는 **고른 기분 하나만** 올라온다 - 학습지에서 날씨 아이콘에
              동그라미를 치고 나면 그 날의 날씨가 한 칸으로 정해지는 것과 같다.
              고르는 일은 아래 기분 칸이 하고, 여기는 **결과**만 보인다.
            */}
            <View style={sheetStyles.headMood}>
              <EmotionFace emotion={hint} size={SHEET_HEAD_FACE} />
              <Text style={[sheetStyles.moodPicked, { color: colors.text }]}>
                {EMOTION_LABEL[hint]}
              </Text>
            </View>
          </View>
        }
        art={
          <>
            {carried?.imageUrl ? (
              <>
                <Image
                  source={{ uri: carried.imageUrl }}
                  style={styles.carriedImage}
                  resizeMode="cover"
                  accessibilityLabel="지난 그림"
                />
                <Text style={[styles.hint, styles.center, { color: colors.textSubtle }]}>
                  지난 그림 · 글을 고치고 다시 그리면 새 그림이 나와요
                </Text>
              </>
            ) : (
              <>
                <StylePreview style={style} size={PREVIEW_SIZE} />
                {/* **견본이지 결과가 아니다.** 그림만 두면 "오늘은 이렇게 그려진다"로 읽힌다 */}
                <Text style={[styles.hint, styles.center, { color: colors.textSubtle }]}>
                  {DRAW_STYLE_LABEL[style]} 예시 · 오늘의 그림은 쓰고 나면 여기에 나와요
                </Text>
              </>
            )}

          </>
        }
        mood={
          <>
            {/*
              아홉을 한 줄에 늘어놓고 고른 것에만 동그라미를 친다 - 면을 칠하면 과일 색과
              캐릭터가 같은 계열이라 그림이 묻힌다(프로젝트 스킬 3장).
            */}
            <View style={sheetStyles.faceRow}>
              {QUICK_EMOTIONS.map((emotion) => {
                const selected = hint === emotion;
                return (
                  <Pressable
                    key={emotion}
                    // 누르면 그 감정으로 바뀌기만 한다. 다시 눌러도 해제되지 않는다
                    onPress={() => setHint(emotion)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={EMOTION_LABEL[emotion]}
                    hitSlop={(MIN_TOUCH_TARGET - SHEET_FACE) / 2}
                    style={({ pressed }) => [
                      sheetStyles.face,
                      {
                        borderColor: selected ? colors.primary : 'transparent',
                        opacity: pressed ? 0.6 : selected ? 1 : 0.55,
                      },
                    ]}
                  >
                    <EmotionFace emotion={emotion} size={SHEET_FACE} />
                  </Pressable>
                );
              })}
            </View>
          </>
        }
        write={
          <>
            <SheetRules lineHeight={LINE_HEIGHT} lines={lines} topPad={WRITE_TOP} />

            <TextInput
              value={content}
              onChangeText={setContent}
              onContentSizeChange={(event) => {
                const rows = Math.ceil(event.nativeEvent.contentSize.height / LINE_HEIGHT);
                setLines(Math.min(MAX_LINES, Math.max(MIN_LINES, rows)));
              }}
              placeholder="오늘 무슨 일이 있었나요?"
              placeholderTextColor={colors.textSubtle}
              maxLength={MAX_CONTENT_LENGTH}
              multiline
              textAlignVertical="top"
              accessibilityLabel="오늘의 한 줄 기록"
              accessibilityHint={`${MAX_CONTENT_LENGTH}자까지 쓸 수 있어요`}
              style={[sheetStyles.text, { color: colors.text, height: LINE_HEIGHT * lines }]}
            />

            {/*
              글자 수는 **줄을 먹지 않는다.** 한 줄로 두었더니 첫 괘선 위가 통째로 비어
              글이 둘째 줄부터 시작했다 - 학습지의 첫 줄이 비어 있는 꼴이다.
              띄워서 오른쪽 아래에 얹는다. 글이 거기까지 차면 숫자 위로 지나가지만,
              그 자리는 200자를 꽉 채웠을 때뿐이고 그때는 숫자가 빨강이라 오히려 눈에 띈다.
            */}
            <View style={styles.counterSlot} pointerEvents="none">
              <Counter length={content.length} />
            </View>
          </>
        }
      />


      {/*
        그림체는 **종이 밖, 그리기 버튼 위**다. 학습지에 없는 칸이라 종이 안에 넣으면
        그 장의 일부로 읽히는데, 이건 일기의 내용이 아니라 "어떻게 그릴지"를 정하는 설정이다.
        바로 위 종이의 견본이 즉시 바뀌므로 떨어져 있어도 무엇이 변했는지는 보인다.
      */}
      <View style={styles.styleRow}>
        <Text style={[styles.outsideLabel, { color: colors.textMuted }]}>그림체</Text>
        {DRAW_STYLES.map((item) => {
              const selected = style === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => onStyleChange(item.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`그림체 ${item.label}`}
                  hitSlop={(MIN_TOUCH_TARGET - CHIP_HEIGHT) / 2}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary : 'transparent',
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.chipLabel,
                      { color: selected ? colors.primaryFg : colors.textMuted },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
          );
        })}
      </View>

      <View style={styles.submit}>
        {/*
          **안내 문구는 화면에 띄우지 않는다.** 무엇이 비었는지는 종이가 이미 보여 준다 -
          기분을 안 골랐으면 아홉 개 중 어디에도 동그라미가 없고, 안 썼으면 괘선이 비어 있다.
          그 위에 글로 또 말하면 잔소리가 되고, 버튼 위 한 줄이 종이를 밀어 낸다.
          다만 **스크린리더에는 남긴다**(`accessibilityHint`) - 화면을 못 보는 사용자에게는
          "비활성"만으로 이유가 전달되지 않는다.
        */}
        {errorMessage ? (
          <Muted style={[styles.center, { color: colors.danger }]}>{errorMessage}</Muted>
        ) : null}
        <Button
          label="오늘 그리기"
          size="large"
          loading={submitting}
          disabled={!canSubmit}
          accessibilityHint={missing ?? undefined}
          onPress={() => (hint ? onSubmit(content.trim(), hint) : undefined)}
        />
      </View>
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
    <Text
      style={[
        styles.counter,
        { color: full ? colors.danger : near ? colors.warning : colors.textMuted },
      ]}
    >
      {length} / {MAX_CONTENT_LENGTH}
    </Text>
  );
}

const styles = StyleSheet.create({
  /**
   * 종이 한 장 - 그림체 - (세기) - 버튼.
   *
   * <p><b>`flex: 1` 이라야 종이가 남는 세로를 다 먹고 버튼이 바닥에 붙는다.</b> 없으면 셋이
   * 내용 높이만큼만 차지해 화면 위쪽에 모여 뜨고 아래가 통째로 빈다 - 종이가 "한 장"이 아니라
   * 작은 카드로 보이는 이유가 그것이었다.
   */
  root: { flex: 1, gap: space[3] },

  /** 고른 기분. 얼굴과 이름이 붙어 다닌다 - 그림만으로는 비슷한 둘이 구분되지 않는다 */
  /** 빈칸 줄. 네 쌍이 왼쪽부터 늘어선다 */
  /** 채워 넣은 값. 진하고 크다 */
  /**
   * 채워 넣은 값. 17 -> 19 로 키웠다.
   *
   * <p><b>굵게는 못 한다.</b> 이 손글씨 서체는 Regular 한 벌뿐이라(배포처에 Bold/Medium 자체가 없다)
   * 패밀리로 굵기를 고를 수 없고, `fontWeight` 로 합성하는 것은 안드로이드에서 안 먹는다
   * (`CLAUDE.md` 서체 선언). 그래서 **크기와 색**으로만 세운다 - 종이에서 가장 진한 글자색이다.
   */
  /** 인쇄된 단위. 연하고 작다 */

  /** 아홉이 한 줄. `space-between` 이라 폭이 달라져도 양 끝이 여백에 붙는다 */
  /** 고른 것에만 동그라미. 면을 칠하지 않는다 */
  styleRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  chip: {
    flex: 1,
    height: CHIP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1.3,
  },
  chipLabel: { fontSize: font.base, fontFamily: font.medium },

  counterSlot: { position: 'absolute', right: 0, bottom: -2 },
  counter: { fontSize: font.base, fontFamily: font.hand },
  /** 종이 **밖**의 라벨. 손글씨는 종이 안쪽만이다(tokens `font.hand` 주석) */
  outsideLabel: { fontSize: font.base, fontFamily: font.medium },
  /** 견본 설명. 그림 바로 아래라 작아도 읽히지만 12 는 과하게 작았다 */
  hint: { fontSize: font.base, fontFamily: font.hand },
  /** 들고 온 그림. 그림칸을 꽉 채운다 - 결과 화면에서 보던 크기 그대로여야 이어진 것으로 읽힌다 */
  carriedImage: { flex: 1, width: '100%' },

  submit: { gap: space[2] },
  center: { textAlign: 'center' },
});
