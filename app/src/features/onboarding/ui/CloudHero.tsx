import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type DimensionValue } from 'react-native';
import Svg, { Circle, G, Rect } from 'react-native-svg';
import { useColors } from '@/shared/theme/useColors';

/**
 * 01 온보딩의 히어로. 둥둥 뜨는 구름 세 장.
 *
 * 구름 한 장은 둥근 바 하나 + 원 네 개를 같은 색으로 겹친 것이다(겹치면 합집합으로 보인다).
 * 모양·좌표·타이밍은 `docs/screen/prototype.html` 의 `.cloud-*` 와 같은 값이다. 한쪽만 고치지 않는다.
 *
 * 세 장의 진폭·주기·시작 시점을 전부 다르게 줘서 서로 맞물려 움직이지 않게 한다.
 */

const FRAME = { width: 290, height: 220 } as const;

type CloudSpec = {
  key: string;
  width: number;
  left?: number;
  right?: number;
  top: number;
  opacity: number;
  dx: number;
  dy: number;
  /** ms */
  duration: number;
  /** 시작 위상. 0~1 */
  phase: number;
};

const CLOUDS: CloudSpec[] = [
  { key: 'back', width: 152, left: -10, top: 104, opacity: 0.5, dx: -8, dy: -10, duration: 13000, phase: 0 },
  { key: 'small', width: 116, right: -6, top: 132, opacity: 0.72, dx: 10, dy: -16, duration: 9000, phase: 0.33 },
  { key: 'front', width: 208, left: 44, top: 24, opacity: 0.95, dx: 6, dy: -14, duration: 11000, phase: 0.14 },
];

export function CloudHero() {
  return (
    <View
      style={styles.frame}
      accessibilityRole="image"
      accessibilityLabel="하늘에 구름이 떠 있는 그림"
    >
      {CLOUDS.map((cloud) => (
        <FloatingCloud key={cloud.key} spec={cloud} />
      ))}
    </View>
  );
}

function FloatingCloud({ spec }: { spec: CloudSpec }) {
  const colors = useColors();
  // 0 -> 1 -> 0 을 반복한다. 0.5 지점이 가장 높이 뜬 순간이다
  const progress = useRef(new Animated.Value(spec.phase)).current;

  useEffect(() => {
    const half = spec.duration / 2;
    const leg = (toValue: number) =>
      Animated.timing(progress, {
        toValue,
        duration: half,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([leg(1), leg(0)]));
    loop.start();
    return () => loop.stop();
  }, [progress, spec.duration]);

  const height = (spec.width * 64) / 120;

  return (
    <Animated.View
      style={[
        styles.cloud,
        {
          width: spec.width,
          height,
          top: spec.top,
          left: spec.left as DimensionValue | undefined,
          right: spec.right as DimensionValue | undefined,
          opacity: spec.opacity * colors.cloudOpacity,
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, spec.dx] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, spec.dy] }) },
          ],
        },
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 120 64">
        <G fill={colors.cloud}>
          <Rect x={6} y={34} width={108} height={28} rx={14} />
          <Circle cx={20} cy={42} r={14} />
          <Circle cx={38} cy={34} r={22} />
          <Circle cx={72} cy={28} r={26} />
          <Circle cx={98} cy={38} r={18} />
        </G>
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { width: FRAME.width, height: FRAME.height },
  cloud: { position: 'absolute' },
});
