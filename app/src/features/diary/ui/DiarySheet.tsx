import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SketchBorder } from '@/shared/ui/SketchBorder';
import { SketchLine } from '@/shared/ui/SketchLine';
import { font, radius, scale, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/**
 * 그림일기 <b>한 장</b>. 머리 띠 - 그림칸 - 글칸이 한 종이 안에 있다.
 *
 * <p>시안은 `docs/screen/images/sample/homeInputDiary.png` - 초등학교 그림일기 학습지다.
 * 그 종이의 구조가 이 제품의 구조와 같다: 위에 날짜와 날씨를 적고, 가운데에 그림을 그리고,
 * 아래 괘선에 글을 쓴다. <b>학습지의 "날씨" 자리가 우리의 감정 9종이다</b> - 제품이 날씨 6종에서
 * 감정 9종으로 간 내력(2026-10-19)이 공교롭게도 이 자리에서 다시 만난다.
 *
 * <p><b>전에는 세 덩이가 따로 떠 있었다.</b> 그림 틀 한 장, 공책 한 장, 감정 칩 한 무더기가
 * 각자의 테두리를 두르고 세로로 나열됐다. 셋이 한 장에 들어오면 테두리가 셋에서 하나로 줄고,
 * 무엇보다 <b>화면이 "입력 폼"이 아니라 "오늘의 일기장"으로 읽힌다.</b>
 *
 * <p>칸을 가르는 선은 자로 잰 `borderWidth` 가 아니라 `SketchLine` 이다. 학습지의 검은 직선을
 * 그대로 옮기면 손그림 체계에서 그 선만 기계가 된다(`hand-drawn-ui` 1장).
 * <b>이 종이는 화면 위에 놓인 한 장</b>이고 사용자가 쓰는 자리라, 테두리와 칸선이 전부
 * 손으로 그은 선이어야 한다(`paper-background` 2장). 바탕에 반듯한 선이 없으니 더 그렇다.
 */
export function DiarySheet({
  head,
  art,
  mood,
  write,
}: {
  /** 머리 띠. 날짜와 **고른** 기분 하나 */
  head: ReactNode;
  /** 그림칸. 아직 없으면 견본, 다 되면 그림 */
  art: ReactNode;
  /**
   * 기분 고르는 칸. **그림과 글 사이**다.
   *
   * <p>처음에는 머리 띠에 두었는데(학습지의 날씨 자리) 아홉 개가 띠를 가득 채워 날짜가 눌렸다.
   * 여기로 내리면 <b>그림과 글을 잇는 자리</b>가 된다 - "이 그림은 이런 기분이었고, 그래서 이런 글을
   * 썼다"는 순서로 읽힌다. 고른 결과만 머리 띠로 올라간다.
   */
  mood?: ReactNode;
  /** 글칸. 괘선은 이 컴포넌트가 깔고 글은 호출부가 얹는다 */
  write: ReactNode;
}) {
  const colors = useColors();

  return (
    <View style={[styles.sheet, { backgroundColor: colors.surfaceSolid }]}>
      <View style={styles.head}>{head}</View>
      <Divider seed={401} />

      <View style={styles.art}>{art}</View>
      <Divider seed={457} />

      {mood ? (
        <>
          <View style={styles.mood}>{mood}</View>
          <Divider seed={509} />
        </>
      ) : null}

      <View style={styles.write}>{write}</View>

      {/* 테두리는 맨 위에. 안쪽 칸선보다 진하고 굵어 "한 장"의 가장자리가 된다 */}
      <SketchBorder radius={radius.lg} color={colors.sheetLine} strokeWidth={1.9} seed={373} />
    </View>
  );
}

/** 칸을 가르는 선. 괘선보다 진하고 테두리보다 연하다 - 셋의 위계가 종이를 읽히게 한다 */
function Divider({ seed }: { seed: number }) {
  const colors = useColors();
  return (
    <SketchLine
      color={colors.sheetLine}
      sway={0.6}
      wavelength={140}
      strokeWidth={1.3}
      roughness={0.9}
      opacity={0.9}
      height={6}
      seed={seed}
    />
  );
}

/** 글칸의 괘선 한 줄. 간격과 글줄 높이가 같아야 글자가 줄 위에 앉는다 */
export function SheetRules({
  lineHeight,
  lines,
  topPad,
  seed = 311,
}: {
  lineHeight: number;
  lines: number;
  topPad: number;
  seed?: number;
}) {
  const colors = useColors();
  return (
    <View
      style={[styles.rules, { top: topPad }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: lines }, (_, i) => (
        <SketchLine
          key={i}
          color={colors.rule}
          // 글자가 앉는 선이라 거의 곧게. 물결이 크면 글줄이 기울어 보인다
          sway={0.9}
          wavelength={120}
          strokeWidth={1.1}
          roughness={0.9}
          opacity={0.8}
          height={6}
          seed={seed + i * 17}
          /*
            선은 글줄 **상자의 바닥**이 아니라 글자 밑단보다 조금 아래다. 상자 바닥에 맞추면
            (전에 -6) 손글씨 서체의 글자가 상자 안에서 아래쪽에 앉아 선이 밑단을 긋고 지나간다.
            RULE_DROP 만큼 더 내려 글자가 선 **위에** 앉게 한다 - 서체를 바꾸면 이 값을 다시 본다.
          */
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: lineHeight * (i + 1) - 6 + RULE_DROP,
          }}
        />
      ))}
    </View>
  );
}

/**
 * 글칸 위 여백. **괘선과 글이 같은 값에서 시작해야 한다** - 둘이 다르면 그 차이만큼
 * 선이 글자 속으로 올라온다(2026-10-25 에 4px 어긋나 실제로 겹쳤다).
 * 그래서 상수를 하나 두고 `write` 패딩과 `SheetRules` 의 `topPad` 가 같이 쓴다.
 */
export const WRITE_TOP = 12;

/**
 * 괘선을 글줄 상자 바닥에서 더 내리는 양. 손글씨(`font.hand`)의 글자가 상자 안에서
 * 아래쪽에 앉아, 상자 바닥에 선을 그으면 밑단을 긋고 지나간다. **서체를 바꾸면 다시 잰다.**
 */
const RULE_DROP = 5;

/** 기분 줄의 얼굴 크기. 아홉이 한 줄에 들어가야 한다 */
export const SHEET_FACE = 34;
/** 머리 띠에 올라오는 **결정된** 기분 하나. 날짜 줄과 세로를 맞추되 더 크다 */
export const SHEET_HEAD_FACE = 31;
/** 글줄 높이이자 괘선 간격. 둘이 같아야 글자가 줄 위에 앉는다 */
export const LINE_HEIGHT = 32;

/**
 * 종이 안쪽의 글자와 줄. <b>02 와 04 가 같이 쓴다</b> - 한쪽에만 두면 쓰는 화면과 결과 화면의
 * 종이가 갈라진다(실제로 04 만 옛 카드로 남아 그랬다).
 *
 * <p>종이 안은 전부 손글씨(`font.hand`)다. 그 서체는 굵기가 한 벌뿐이라
 * 위계를 <b>크기와 색</b>으로만 만든다.
 */
export const sheetStyles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  /** "년 월 일" 빈칸 줄 */
  dateRow: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: space[3] },
  datePart: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  /** 채워 넣은 값 */
  dateValue: { fontSize: scale(19), fontFamily: font.hand },
  /** 인쇄된 단위 */
  dateUnit: { fontSize: font.xs, fontFamily: font.hand },

  /** 고른(또는 판정된) 기분. 얼굴과 이름이 붙어 다닌다 */
  headMood: { flexDirection: 'row', alignItems: 'center', gap: space[1] },
  moodPicked: { fontSize: font.lg, fontFamily: font.hand },

  /** 아홉이 한 줄 */
  faceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  /** 고른 것에만 동그라미. 면을 칠하지 않는다 - 과일 색과 캐릭터가 같은 계열이라 그림이 묻힌다 */
  face: {
    width: SHEET_FACE + 2,
    height: SHEET_FACE + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1.5,
  },

  /** 괘선 위에 앉는 글 */
  text: { padding: 0, fontSize: scale(18), lineHeight: LINE_HEIGHT, fontFamily: font.hand },
});

/**
 * 칸 안쪽 좌우 여백. 학습지의 여백처럼 글과 그림이 테두리에 닿지 않게 한다.
 *
 * <p>16 에서 **14** 로 좁혔다. 감정 아홉이 한 줄에 들어가야 하는데 여백 2 가 곧 얼굴 크기다 -
 * 머리 띠가 이 종이에서 가로를 가장 빡빡하게 쓰는 칸이다.
 */
export const SHEET_PAD = 14;

const styles = StyleSheet.create({
  sheet: {
    /**
     * **남는 세로를 종이가 다 먹는다.** 학습지는 공책 한 쪽을 통째로 쓰는 물건이라
     * 화면 가운데 작게 떠 있으면 "종이"가 아니라 "카드"로 읽힌다(시안 참고).
     */
    flex: 1,
    /** 네 귀가 같으면 컴퍼스로 그린 것이다(`hand-drawn-ui` 3장) */
    borderTopLeftRadius: 22,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 18,
    overflow: 'hidden',
  },
  head: { paddingHorizontal: SHEET_PAD, paddingVertical: space[3], gap: space[2] },
  /** 머리 띠와 글칸이 쓰고 남은 세로는 전부 그림칸이 가져간다 - 시안도 그림칸이 가장 크다 */
  art: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[4],
    gap: space[3],
  },
  mood: { paddingHorizontal: SHEET_PAD, paddingVertical: space[2], gap: space[1] },
  write: { paddingHorizontal: SHEET_PAD, paddingTop: WRITE_TOP, paddingBottom: space[4] },
  rules: { position: 'absolute', left: SHEET_PAD, right: SHEET_PAD, bottom: 0 },
});
