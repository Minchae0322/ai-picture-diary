import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
  /** 모서리 반경. 손이 그린 모서리라 네 귀가 조금씩 다르다 */
  radius: number;
  color: string;
  /** 선 굵기의 기준값. 두 번 그어 실제로는 이보다 굵게 보인다 */
  strokeWidth?: number;
  /**
   * 같은 상자는 늘 같은 선이어야 한다. 리렌더마다 새 난수를 뽑으면 **선이 춤춘다** -
   * 손으로 그린 느낌이 아니라 고장 난 화면이 된다. 자리마다 다른 수를 주면 모양이 갈린다.
   */
  seed?: number;
  /** 흔들림의 크기(px). 1 안팎이 연필, 2 를 넘기면 취한 선이 된다 */
  wobble?: number;
};

/**
 * 손으로 그린 테두리. `borderWidth` 가 만드는 자로 잰 선 대신 쓴다.
 *
 * <p>레퍼런스(Hand Drawn)의 핵심은 선의 떨림과 눌린 자국이다. 흉내 내는 방법은 셋이다.
 *
 * <ol>
 *   <li>둘레를 일정 간격으로 찍고 각 점을 조금씩 밀어 **떨림**을 만든다
 *   <li>그 점들을 꺾은선이 아니라 **2차 곡선**으로 이어 연필이 지나간 자취처럼 부드럽게 만든다
 *   <li>같은 테두리를 **두 번** 긋는다 - 한 번은 진하게, 한 번은 연하고 살짝 밀어서.
 *       사람이 그은 선은 한 번에 안 맞아 겹쳐 긋는다. 이게 있고 없고가 가장 크게 갈린다
 * </ol>
 *
 * <p>난수는 `seed` 로 고정한다. 애니메이션이 아니라 **정지한 그림**이어야 한다.
 */
export function SketchBorder({ radius, color, strokeWidth = 2, seed = 1, wobble = 1.1 }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  };

  const paths = useMemo(() => {
    if (size.width < 4 || size.height < 4) {
      return null;
    }
    return {
      main: sketchRect(size.width, size.height, radius, wobble, seed),
      echo: sketchRect(size.width, size.height, radius, wobble * 0.8, seed + 977),
    };
  }, [size.width, size.height, radius, wobble, seed]);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      {paths ? (
        <Svg width={size.width} height={size.height}>
          {/* 겹쳐 그은 자국. 연하고 살짝 어긋나 있어야 한 번에 못 그은 선으로 보인다 */}
          <Path
            d={paths.echo}
            stroke={color}
            strokeWidth={strokeWidth * 0.8}
            strokeOpacity={0.4}
            strokeLinecap="round"
            fill="none"
            translateX={0.6}
            translateY={0.5}
          />
          <Path
            d={paths.main}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      ) : null}
    </View>
  );
}

/** 같은 seed 면 같은 선. 손으로 그린 것이지 매번 새로 그리는 것이 아니다 */
function makeRandom(seed: number) {
  let state = seed * 9301 + 49297;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * 모서리가 둥근 사각형의 둘레를 따라 점을 찍고, 각 점을 법선 방향으로 흔든 뒤
 * 2차 곡선으로 잇는다. 꺾은선으로 이으면 떨림이 각져서 "깨진 선"으로 보인다.
 */
function sketchRect(w: number, h: number, r: number, wobble: number, seed: number): string {
  const rand = makeRandom(seed);
  const radius = Math.min(r, w / 2, h / 2);
  const points: Array<[number, number]> = [];

  // 둘레를 약 7px 마다 찍는다. 촘촘하면 떨림이 안 보이고, 성기면 각이 진다
  const step = 7;
  const corner = (cx: number, cy: number, from: number, to: number) => {
    const arc = Math.abs(to - from) * radius;
    const count = Math.max(3, Math.round(arc / step));
    for (let i = 0; i <= count; i += 1) {
      const angle = from + ((to - from) * i) / count;
      points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
    }
  };
  const edge = (x1: number, y1: number, x2: number, y2: number) => {
    const length = Math.hypot(x2 - x1, y2 - y1);
    const count = Math.max(1, Math.round(length / step));
    for (let i = 1; i < count; i += 1) {
      points.push([x1 + ((x2 - x1) * i) / count, y1 + ((y2 - y1) * i) / count]);
    }
  };

  const inset = 1.2; // 선 굵기가 상자 밖으로 삐져나가지 않게 살짝 안쪽에 그린다
  const left = inset;
  const top = inset;
  const right = w - inset;
  const bottom = h - inset;
  const HALF_PI = Math.PI / 2;

  corner(left + radius, top + radius, Math.PI, Math.PI * 1.5);
  edge(left + radius, top, right - radius, top);
  corner(right - radius, top + radius, Math.PI * 1.5, Math.PI * 2);
  edge(right, top + radius, right, bottom - radius);
  corner(right - radius, bottom - radius, 0, HALF_PI);
  edge(right - radius, bottom, left + radius, bottom);
  corner(left + radius, bottom - radius, HALF_PI, Math.PI);
  edge(left, bottom - radius, left, top + radius);

  const jittered = points.map(([x, y]) => [
    x + (rand() - 0.5) * wobble * 2,
    y + (rand() - 0.5) * wobble * 2,
  ]) as Array<[number, number]>;

  const mid = (a: [number, number], b: [number, number]) =>
    [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as [number, number];

  const first = mid(jittered[jittered.length - 1], jittered[0]);
  let d = `M ${first[0].toFixed(2)} ${first[1].toFixed(2)}`;
  for (let i = 0; i < jittered.length; i += 1) {
    const current = jittered[i];
    const next = jittered[(i + 1) % jittered.length];
    const end = mid(current, next);
    d += ` Q ${current[0].toFixed(2)} ${current[1].toFixed(2)} ${end[0].toFixed(2)} ${end[1].toFixed(2)}`;
  }
  return `${d} Z`;
}
