import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, Path } from 'react-native-svg';
import {
  ellipsePoints,
  hachureLines,
  makeRandom,
  polygonPoints,
  roundedRectPoints,
  sketchPath,
  solidPath,
  type HatchLine,
  type Point,
} from '@/shared/ui/sketch';
import { radius } from '@/shared/theme/tokens';
import { useColors } from '@/shared/theme/useColors';

/** 한 번 칠하고 지나가는 데 걸리는 시간. 더 빠르면 초조하고, 더 느리면 멈춘 것처럼 보인다 */
const SWEEP_MS = 2600;

/** 연필 그림이 들어가는 상자. 심 끝(tip)이 오른쪽 아래 귀에 있다 */
const PENCIL = { width: 42, height: 52, tip: [37, 46] as Point };

type Props = {
  /** 그림 자리의 높이. 오버레이는 150, 최소화된 띠는 84 */
  height?: number;
};

/**
 * **색연필이 칠해 나가는 그림 자리.** 03 생성 중 화면의 기다림이다.
 *
 * <p>빙글 도는 원이나 비율 막대를 쓰지 않는다 - 이 체계의 기다림은 **차오르는 빗금**이다
 * (`hand-drawn-ui` 5장). 그리고 비율 막대는 거짓말이 된다: 서버가 진행률을 주지 않기 때문이다
 * (03 화면 문서 4장). 왕복하는 색연필은 "되고 있다"만 말하고 "얼마나 됐다"는 말하지 않는다.
 *
 * <p>그리는 순서가 전부다.
 * <ol>
 *   <li>빗금 두 벌(각도·색이 다른 색연필 두 자루)을 밑그림 안쪽에만 깔고
 *   <li>아직 안 칠한 쪽을 <b>바닥과 같은 색의 종이</b>로 덮고
 *   <li><b>밑그림과 액자 선은 그 위에</b> - 윤곽까지 덮이면 반쪽짜리 덩어리로 보인다.
 *       종이에는 연필 선이 먼저 있고 색이 나중에 올라간다
 *   <li>덮개의 경계에 연필을 세운다
 * </ol>
 * 덮개와 연필이 같은 값으로 움직이므로 연필 심은 늘 칠한 경계에 붙어 있다.
 */
export function DrawingBoard({ height = 150 }: Props) {
  const colors = useColors();
  const [width, setWidth] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: SWEEP_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const onLayout = (event: LayoutChangeEvent) => {
    const measured = Math.round(event.nativeEvent.layout.width);
    if (measured !== width) {
      setWidth(measured);
    }
  };

  const art = useMemo(() => {
    if (width < 24) {
      return null;
    }
    const frame = roundedRectPoints(2, 2, width - 4, height - 4, 20);

    /*
      그려지는 것은 **꼭지 달린 둥근 과일 하나**다. 감정 아홉이 전부 과일이라 어느 하나로도
      읽히지 않는다 - 판정 전에 특정 감정을 그리면 결과를 미리 말해 버린다.
      빗금을 액자 전체에 깔지 않는 이유도 같다: 면이 꽉 차면 그림이 아니라 무늬가 된다.
    */
    const d = Math.min(height * 0.66, width * 0.42);
    const cx = width / 2 - 6;
    const cy = height / 2 + 4;
    const body = ellipsePoints(cx, cy, d * 1.06, d);
    const foot: Point = [cx - 4, cy - d / 2];
    const stem: Point[] = [
      foot,
      [foot[0] + d * 0.03, foot[1] - d * 0.09],
      [foot[0] + d * 0.09, foot[1] - d * 0.13],
    ];
    const leafAt: Point = [foot[0] + d * 0.2, foot[1] - d * 0.11];
    const leaf = ellipsePoints(leafAt[0], leafAt[1], d * 0.27, d * 0.12).map((point) =>
      turn(point, leafAt, -14),
    );

    // 선마다 힘을 달리 준다. 같은 농도로 그은 빗금은 색연필이 아니라 패턴 무늬다
    const warmRand = makeRandom(5);
    const coolRand = makeRandom(9);
    return {
      clip: solidPath(body),
      outline: sketchPath(frame, 1.4, 0.8, 31),
      echo: sketchPath(frame, 1.05, 0.8, 31 + 977),
      body: sketchPath(body, 1.6, 0.9, 83),
      stem: sketchPath(stem, 1.1, 0.5, 91, false),
      leaf: sketchPath(leaf, 1.3, 0.7, 97),
      // 색연필 두 자루. 각도가 다른 빗금이 겹쳐야 한 번에 칠한 면이 아니라 쌓은 면이 된다
      warm: shade(hachureLines(width, height, 9, -35, 17, 1.4), warmRand, 0.22, 0.33),
      cool: shade(hachureLines(width, height, 15, 24, 53, 1.4), coolRand, 0.12, 0.26),
    };
  }, [width, height]);

  // 덮개와 연필이 같은 값을 쓴다 - 둘이 어긋나면 연필이 허공을 칠한다
  const travel = sweep.interpolate({ inputRange: [0, 1], outputRange: [0, width] });

  // ClipPath 의 id 는 앱 전역이다. 상수로 두면 한 화면에 둘이 설 때 서로의 그림을 자른다
  const clipId = `drawingBoardClip${height}`;

  return (
    <View
      onLayout={onLayout}
      style={[styles.board, { height, borderRadius: radius.lg, backgroundColor: colors.surfaceSolid }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {art ? (
        <>
          {/* 1. 색연필이 지나간 자리. 끝에서 연하게 풀려야 다시 시작할 때 툭 끊기지 않는다 */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { opacity: sweep.interpolate({ inputRange: [0, 0.1, 0.84, 1], outputRange: [0.5, 1, 1, 0] }) },
            ]}
          >
            <Svg width={width} height={height}>
              <Defs>
                <ClipPath id={clipId}>
                  <Path d={art.clip} />
                </ClipPath>
              </Defs>
              <G clipPath={`url(#${clipId})`}>
                {art.warm.map(({ line, opacity }, index) => (
                  <Line
                    key={`w${index}`}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={colors.primary}
                    strokeWidth={1.3}
                    strokeOpacity={opacity}
                    strokeLinecap="round"
                  />
                ))}
                {art.cool.map(({ line, opacity }, index) => (
                  <Line
                    key={`c${index}`}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={colors.accentSoft}
                    strokeWidth={1.1}
                    strokeOpacity={opacity}
                    strokeLinecap="round"
                  />
                ))}
              </G>
            </Svg>
          </Animated.View>

          {/* 2. 아직 안 칠한 쪽. 바닥과 같은 색이라 경계가 보이지 않는다 */}
          {/* 경계를 비스듬히 눕힌다. 자로 자른 듯한 수직선이면 손이 쓸고 간 자리로 안 보인다.
              위아래·오른쪽으로 넉넉히 키워야 기울인 네 귀에 덮이지 않은 쐐기가 안 생긴다 */}
          <Animated.View
            style={[
              styles.curtain,
              {
                width: width + 30,
                backgroundColor: colors.surfaceSolid,
                transform: [{ translateX: travel }, { rotate: '9deg' }],
              },
            ]}
          />

          {/* 3. 밑그림. **덮개보다 위다.** 윤곽까지 덮이면 반쪽짜리 덩어리로 보인다 -
              종이 위에 연필로 먼저 그려 둔 선이 있고, 색만 칠해 나가는 것이 맞다 */}
          <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path d={art.body} stroke={colors.text} strokeOpacity={0.32} strokeWidth={1.6} fill="none" strokeLinecap="round" />
            <Path d={art.stem} stroke={colors.text} strokeOpacity={0.32} strokeWidth={1.8} fill="none" strokeLinecap="round" />
            <Path d={art.leaf} stroke={colors.text} strokeOpacity={0.3} strokeWidth={1.5} fill="none" strokeLinecap="round" />
          </Svg>

          {/* 4. 연필. 위아래로 조금 흔들려야 미끄러지는 것이 아니라 칠하는 것으로 보인다 */}
          <Animated.View
            style={[
              styles.pencil,
              {
                // 낮은 띠에서는 자루 끝이 액자 위로 잘린다. 늘 안쪽에 두고 심만 경계에 맞춘다
                top: Math.max(2, height * 0.52 - PENCIL.tip[1]),
                // 왼쪽 벽에서 반쯤 잘린 채 나타나지 않게, 들어오는 동안만 연하게 띄운다
                opacity: sweep.interpolate({ inputRange: [0, 0.08, 0.92, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateX: travel },
                  {
                    translateY: sweep.interpolate({
                      inputRange: [0, 0.25, 0.5, 0.75, 1],
                      outputRange: [0, -2.5, 0, -2.5, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pencil barrel={colors.primary} wood={colors.borderStrong} ink={colors.text} />
          </Animated.View>

          {/* 5. 액자. 덮개보다 위에 있어야 네 변이 처음부터 다 보인다 */}
          <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path
              d={art.echo}
              stroke={colors.border}
              strokeWidth={1.4}
              strokeOpacity={0.4}
              strokeLinecap="round"
              fill="none"
              translateX={0.6}
              translateY={0.5}
            />
            <Path
              d={art.outline}
              stroke={colors.border}
              strokeWidth={1.7}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </>
      ) : null}
    </View>
  );
}

/**
 * 색연필 한 자루. 심 -> 깎인 나무 -> 자루 세 조각을 **축과 수직 벡터로** 찍는다 -
 * 좌표를 손으로 박으면 기울기를 바꿀 때마다 열두 개를 다시 센다.
 */
function Pencil({ barrel, wood, ink }: { barrel: string; wood: string; ink: string }) {
  const art = useMemo(() => {
    const [tx, ty] = PENCIL.tip;
    const axis: Point = [-0.6, -0.8]; // 왼쪽 위로 누운 방향
    const perp: Point = [0.8, -0.6];
    const at = (len: number, half: number): [Point, Point] => [
      [tx + axis[0] * len + perp[0] * half, ty + axis[1] * len + perp[1] * half],
      [tx + axis[0] * len - perp[0] * half, ty + axis[1] * len - perp[1] * half],
    ];
    const [lead1, lead2] = at(7, 3.2);
    const [neck1, neck2] = at(13, 4.8);
    const [end1, end2] = at(44, 4.8);
    return {
      lead: sketchPath(polygonPoints([PENCIL.tip, lead1, lead2], 4), 0.8, 0.3, 61),
      wood: sketchPath(polygonPoints([lead1, neck1, neck2, lead2], 4), 0.8, 0.3, 67),
      barrel: sketchPath(polygonPoints([neck1, end1, end2, neck2], 6), 1.1, 0.4, 71),
    };
  }, []);

  return (
    <Svg width={PENCIL.width} height={PENCIL.height} pointerEvents="none">
      <Path d={art.barrel} fill={barrel} stroke={ink} strokeWidth={1.4} strokeOpacity={0.55} />
      <Path d={art.wood} fill={wood} stroke={ink} strokeWidth={1.3} strokeOpacity={0.5} />
      <Path d={art.lead} fill={ink} stroke={ink} strokeWidth={1} strokeOpacity={0.8} />
    </Svg>
  );
}

/** 점 하나를 기준점 둘레로 돌린다. SVG 변형 대신 좌표를 미리 돌려 두면 그릴 때 따질 것이 없다 */
function turn([x, y]: Point, [ox, oy]: Point, deg: number): Point {
  const rad = (deg * Math.PI) / 180;
  const dx = x - ox;
  const dy = y - oy;
  return [ox + dx * Math.cos(rad) - dy * Math.sin(rad), oy + dx * Math.sin(rad) + dy * Math.cos(rad)];
}

/** 빗금 한 벌에 힘의 차이를 준다. seed 를 받은 난수라 늘 같은 농도다 */
function shade(lines: HatchLine[], rand: () => number, base: number, spread: number) {
  return lines.map((line) => ({ line, opacity: base + rand() * spread }));
}

const styles = StyleSheet.create({
  board: { overflow: 'hidden' },
  curtain: { position: 'absolute', top: -60, bottom: -60, left: 0 },
  // 심 끝이 덮개의 경계에 오도록 상자를 왼쪽으로 밀어 둔다
  pencil: { position: 'absolute', left: -PENCIL.tip[0] },
});
