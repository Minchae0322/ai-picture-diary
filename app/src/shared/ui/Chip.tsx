import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { EmotionFace } from '@/shared/ui/EmotionFace';
import { SketchBorder } from '@/shared/ui/SketchBorder';
import { seedFromString } from '@/shared/ui/sketch';
import type { Emotion } from '@/shared/emotion';

type Props = {
  label: string;
  selected?: boolean;
  /**
   * 감정. 주면 라벨 앞에 캐릭터 그림이 붙는다(prototype `chip({ emotion })`).
   * **면을 그 감정 색으로 물들이지 않는다** - 과일 색과 캐릭터가 같은 계열이라 그림이 묻힌다.
   */
  emotion?: Emotion;
  /** 장식용 색점. 감정을 가리키는 자리에는 쓰지 않는다 - 그건 `emotion` 이다 */
  dot?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** 칩 높이는 35(9+9+17)로 44 미만이다. 히트 영역만 세로로 넓힌다 */
/** 칩의 키. 터치 영역은 여기서 계산해 44 를 채운다 - 키를 바꾸면 hitSlop 도 따라온다 */
const CHIP_HEIGHT = 36;
const HIT_SLOP = {
  top: Math.max(0, (MIN_TOUCH_TARGET - CHIP_HEIGHT) / 2),
  bottom: Math.max(0, (MIN_TOUCH_TARGET - CHIP_HEIGHT) / 2),
  left: 0,
  right: 0,
};

/**
 * prototype.html `.chip`. 02 빠른 감정 · 05 요약 · 06 자주 쓴 말 · 08 필터 · 10 Plus 가 같은 모양이다.
 *
 * `onPress` 가 없으면 읽기 전용(06 단어 칩의 탭 동작은 미정)이라 버튼 역할을 주지 않는다.
 */
export function Chip({ label, selected = false, emotion, dot, onPress, accessibilityLabel }: Props) {
  const colors = useColors();

  // `color-mix(in srgb, DOT 28%, transparent)` 과 같은 값. 색이 7자 hex 라 알파를 붙인다
  const tinted = dot && !selected;
  const surface = {
    backgroundColor: selected ? colors.primary : tinted ? `${dot}47` : colors.surface,
  };
  // 테두리는 손으로 긋는다. 라벨마다 다른 seed 라 한 줄에 선 칩들이 제각기 떨린다
  const strokeColor = selected ? colors.primary : tinted ? `${dot}8c` : colors.borderStrong;
  const seed = seedFromString(label);
  const textColor = selected ? colors.primaryFg : colors.text;

  const body = (
    <>
      <SketchBorder
        radius={CHIP_HEIGHT / 2}
        color={strokeColor}
        strokeWidth={1.3}
        wobble={0.8}
        seed={seed}
      />
      {emotion ? <EmotionFace emotion={emotion} size={22} /> : null}
      {dot ? (
        <View
          style={[
            styles.dot,
            { backgroundColor: dot, borderColor: colors.primaryFg, borderWidth: selected ? 1.5 : 0 },
          ]}
        />
      ) : null}
      <Text
        style={[
          styles.text,
          { color: textColor, fontFamily: selected ? font.bold : font.medium },
        ]}
      >
        {label}
      </Text>
    </>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={accessibilityLabel ?? label} style={[styles.chip, surface]}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.chip,
        surface,
        pressed ? { borderColor: colors.primary } : null,
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /**
   * **키를 고정한다.** 전에는 세로 여백만 주고 내용이 키를 정하게 뒀는데, `EmotionFace` 는
   * 감정별 배율(`EMOTION_SCALE`) 때문에 실제 변이 `size` 보다 크다 - 슬픈(1.23)은 29.5,
   * 행복한(1.07)은 25.7. 그래서 한 줄에 선 칩들의 키가 **감정마다 달랐고**, 얼굴 없는 칩
   * ("추천"·"인기")은 그보다 12 가까이 낮았다. 36 으로 묶으면 무엇이 들어가도 한 줄이 가지런하다.
   * 얼굴은 22 로 둔다 - 가장 큰 배율에서도 27 이라 36 안에 넉넉히 들어온다.
   */
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1] + 2,
    height: CHIP_HEIGHT,
    paddingLeft: space[3],
    paddingRight: space[3] + 2,
    borderRadius: radius.full,
  },
  dot: { width: 12, height: 12, borderRadius: radius.full },
  text: { fontSize: font.sm },
});
