import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { font, leading, radius, space } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';
import { Card } from '@/shared/ui/Card';

/**
 * 03 AI 생성 중 (시안 8:91). 02 위에 딤을 덮는 오버레이다.
 *
 * 시안은 진행 막대가 68% 찬 모습이지만 **그렇게 그리지 않는다.**
 * 서버가 단계 이벤트를 주지 않아 그 숫자는 시간 기반 가짜 진행이 된다
 * (docs/screen/03-generating.md 4장 "시간 기반 가짜 진행 금지", 7장 미정).
 * 대신 왕복하는 불확정 막대를 쓴다. 서버가 단계를 주면 ProgressBar로 바꾼다.
 */
export function GeneratingOverlay({ content }: { content: string }) {
  const colors = useColors();

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: colors.scrim }]}>
      <Card style={styles.card}>
        <Text style={[styles.quote, { color: colors.text }]}>“{content}”</Text>

        <JellyLoader />

        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          AI가 오늘을 그리는 중...
        </Text>
        <IndeterminateBar />
        <Text style={[styles.caption, { color: colors.textMuted }]}>
          감정을 읽고 그림을 그리고 있어요
        </Text>
      </Card>
    </View>
  );
}

/** 시안 `loader`: 크기가 다른 젤리 3개. 숨 쉬듯 번갈아 커진다 */
function JellyLoader() {
  const colors = useColors();
  const jellies = [
    { size: 66, delay: 0, color: colors.accentSoft },
    { size: 82, delay: 160, color: colors.primary },
    { size: 56, delay: 320, color: colors.accentSoft },
  ];
  return (
    <View
      style={styles.loader}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {jellies.map((jelly) => (
        <Jelly key={jelly.size} size={jelly.size} delay={jelly.delay} color={jelly.color} />
      ))}
    </View>
  );
}

function Jelly({ size, delay, color }: { size: number; delay: number; color: string }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, progress]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        backgroundColor: color,
        opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] }),
        transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
      }}
    />
  );
}

/** 왕복 막대. 진행률을 주장하지 않고 "일하는 중"만 알린다 */
function IndeterminateBar() {
  const colors = useColors();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(slide, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [slide]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="AI가 오늘을 그리는 중"
      style={[styles.track, { backgroundColor: colors.track }]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: colors.primary,
            left: slide.interpolate({ inputRange: [0, 1], outputRange: ['-35%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[7] },
  card: { width: '100%', maxWidth: 334, gap: space[6], paddingVertical: space[8] },
  quote: { fontSize: font.md, lineHeight: leading(font.md), fontFamily: font.medium },
  loader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[3], height: 150 },
  title: { fontSize: font.lg, lineHeight: leading(font.lg), fontFamily: font.bold },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, bottom: 0, width: '35%', borderRadius: 4 },
  caption: { fontSize: font.xs, fontFamily: font.regular, lineHeight: leading(font.xs), marginTop: -space[3] },
});
