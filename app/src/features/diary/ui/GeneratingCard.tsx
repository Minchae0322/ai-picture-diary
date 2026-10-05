import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/shared/ui/Card';
import { Heading, Muted } from '@/shared/ui/Type';
import { font, leading, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/** prototype `.loader` 의 젤리 세 알. 지름과 시작 지연이 서로 다르다 */
const JELLIES = [
  { size: 66, delay: 0, accent: true },
  { size: 82, delay: 160, accent: false },
  { size: 56, delay: 320, accent: true },
];

/**
 * 03 AI 생성 중. 진행 문구는 서버 상태로만 바뀐다 - 가짜 진행률을 만들지 않는다.
 * 그래서 막대도 비율이 아니라 **불확정 막대**다(prototype `.indet`).
 */
export function GeneratingCard({ content }: { content: string }) {
  const colors = useColors();

  return (
    <Card contentStyle={styles.card}>
      <Text style={[styles.quote, { color: colors.text }]}>“{content}”</Text>

      <View
        style={styles.loader}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {JELLIES.map((jelly) => (
          <Jelly
            key={jelly.size}
            size={jelly.size}
            delay={jelly.delay}
            color={jelly.accent ? colors.accentSoft : colors.primary}
          />
        ))}
      </View>

      <Heading>AI가 오늘을 그리는 중...</Heading>
      <Indeterminate />
      <Muted style={styles.caption}>감정을 읽고 그림을 그리고 있어요</Muted>
    </Card>
  );
}

/** `@keyframes breathe` - 1.4초에 걸쳐 0.88 -> 1 로 부풀고 투명도도 같이 오른다 */
function Jelly({ size, delay, color }: { size: number; delay: number; color: string }) {
  const beat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(beat, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(beat, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [beat, delay]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        backgroundColor: color,
        opacity: beat.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] }),
        transform: [{ scale: beat.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
      }}
    />
  );
}

/** `@keyframes slide` - 폭 35%의 조각이 왼쪽 밖에서 오른쪽 밖으로 지나간다 */
function Indeterminate() {
  const colors = useColors();
  const slide = useRef(new Animated.Value(0)).current;
  // 이동 거리를 비율이 아니라 px 로 줘야 native driver 를 쓸 수 있다. 그래서 트랙 폭을 재 둔다
  const [track, setTrack] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(slide, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [slide]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="AI가 오늘을 그리는 중"
      onLayout={(event) => setTrack(event.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: colors.track }]}
    >
      <Animated.View
        style={[
          styles.chunk,
          {
            backgroundColor: colors.primary,
            transform: [
              {
                translateX: slide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-track * CHUNK, track],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

/** 조각이 트랙에서 차지하는 비율. prototype `.indet i { width: 35% }` */
const CHUNK = 0.35;

const styles = StyleSheet.create({
  card: { paddingVertical: space[8] },
  quote: {
    fontSize: font.md,
    lineHeight: leading(font.md),
    fontFamily: font.medium,
  },
  loader: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[3],
  },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  chunk: { width: `${CHUNK * 100}%`, height: '100%', borderRadius: 4 },
  caption: { marginTop: -space[3] },
});
