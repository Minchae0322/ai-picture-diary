import { Pressable, StyleSheet, Text, View } from 'react-native';
import { allowsLevel, EMOTION_LABEL, emotionPolarity, type Emotion } from '@/shared/emotion';
import { font, MIN_TOUCH_TARGET, radius, space } from '@/shared/theme/tokens';
import { useColors, useEmotionColors } from '@/shared/theme/useColors';
import { EmotionFace } from '@/shared/ui/EmotionFace';

/** 왼쪽에서 오른쪽으로. 가운데(0)는 칸이 아니라 두 칸 사이의 경계다 */
const STEPS = [-2, -1, 1, 2] as const;

type Props = {
  emotion: Emotion;
  /** -2 ~ 2. 0 은 기준 */
  level: number;
  onChange: (level: number) => void;
};

/**
 * 감정 세기 게이지. 가운데가 0(무난함)이고 양옆으로 1, 2 칸이다.
 *
 * <p>칸을 누르면 가운데에서 그 칸까지 채워진다 - 막대 하나가 "얼마나"를 한눈에 말한다.
 * 같은 칸을 다시 누르면 0으로 돌아간다.
 *
 * <p>**고를 수 없는 쪽은 감추지 않고 회색으로 덮는다.** 감춰 버리면 왜 한쪽만 있는지 알 수 없다.
 * 어느 쪽을 고를 수 있는지는 감정의 극성이 정한다(`emotionPolarity`).
 */
export function EmotionGauge({ emotion, level, onChange }: Props) {
  const colors = useColors();
  const emotionColors = useEmotionColors();
  const polarity = emotionPolarity(emotion);

  const allows = (step: number) => allowsLevel(emotion, step);
  const filled = (step: number) => level !== 0 && (step > 0 ? level >= step : level <= step);

  return (
    <View accessibilityRole="adjustable" accessibilityLabel={`${EMOTION_LABEL[emotion]} 세기`}>
      <View style={[styles.track, { borderColor: colors.border }]}>
        {STEPS.map((step, i) => {
          const can = allows(step);
          const on = filled(step);
          return (
            <Pressable
              key={step}
              onPress={() => onChange(level === step ? 0 : step)}
              disabled={!can}
              accessibilityRole="button"
              accessibilityState={{ selected: on, disabled: !can }}
              accessibilityLabel={`세기 ${step > 0 ? '+' : ''}${step}`}
              style={[
                styles.step,
                // 칸 사이 눈금. 가운데는 조금 진하게 - 0 이 어디인지 보여야 한다
                i > 0 && {
                  borderLeftWidth: i === 2 ? 1.5 : 1,
                  borderLeftColor: i === 2 ? colors.borderStrong : colors.border,
                },
                on && { backgroundColor: emotionColors[emotion] },
                !can && { backgroundColor: colors.track },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.scale}>
        {([-2, -1] as const).map((v) => (
          <Text key={v} style={[styles.tick, { color: colors.textMuted }, !allows(v) && styles.tickOff]}>
            {v}
          </Text>
        ))}
        <EmotionFace emotion={emotion} size={22} />
        {([1, 2] as const).map((v) => (
          <Text key={v} style={[styles.tick, { color: colors.textMuted }, !allows(v) && styles.tickOff]}>
            {v}
          </Text>
        ))}
      </View>

      {polarity === 'NEUTRAL' ? (
        <Text style={[styles.note, { color: colors.textSubtle }]}>무난함이 기준점이에요</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 26,
    borderRadius: radius.full,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  /** 칸 자체는 26 이지만 누르는 영역은 줄 전체 높이라 44 를 넘긴다 */
  step: { flex: 1, minHeight: MIN_TOUCH_TARGET - 18 },
  scale: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space[1],
  },
  tick: { fontSize: font.xs, fontFamily: font.regular },
  tickOff: { opacity: 0.45 },
  note: { marginTop: space[1], fontSize: font.xs, fontFamily: font.regular, textAlign: 'center' },
});
