import { useMemo } from 'react';
import Svg, { ClipPath, Defs, G, Line, Path } from 'react-native-svg';
import {
  ellipsePoints,
  hachureLines,
  roundedRectPoints,
  sketchPath,
  solidPath,
  type Point,
} from '@/shared/ui/sketch';
import type { DrawStyle } from '../api/diaryTypes';

/**
 * 그림체 맛보기. 고른 그림체로 <b>우는 아이</b>를 그려 준다.
 *
 * <p>왜 그림이냐면, "크레파스 / 수채화 / 연필 / 파스텔"이라는 <b>말만으로는 고를 수 없기 때문</b>이다.
 * 글자 네 개는 네 개의 이름일 뿐이고, 고른 결과가 어떻게 생겼는지는 그려 봐야 안다.
 *
 * <p>왜 우는 아이냐면 그림체의 차이가 <b>가장 크게 갈리는 소재</b>라서다. 선의 굵기(크레파스),
 * 번짐(수채화), 흐린 결(연필), 부드러운 면(파스텔)이 눈물과 얼굴선에서 바로 드러난다.
 * 웃는 얼굴은 어느 그림체로 그려도 비슷해 보인다.
 *
 * <p><b>자산 PNG 가 아니라 SVG 로 직접 그린다.</b> 그림체마다 예시 이미지를 네 장 두면 그림체를
 * 늘릴 때마다 디자이너를 기다려야 하고, 번들도 그만큼 무거워진다. 같은 도형 한 벌을 그림체별
 * 레시피로 다르게 칠하면 그림체가 늘어도 레시피 한 줄이다(이 저장소는 아이콘·캐릭터·로더를
 * 전부 이렇게 그린다 - `Icon.tsx`, `DrawingBoard.tsx`).
 *
 * <p><b>이것은 결과가 아니라 견본이다.</b> 실제 일기 그림은 AI 가 그 날의 문장으로 그린다 -
 * 여기 우는 아이가 떠 있다고 해서 오늘의 그림이 울고 있는 것이 아니다. 그래서 호출부가
 * "이런 느낌으로 그려요" 같은 말을 옆에 붙인다.
 */

/** 그림을 그리는 좌표계. 실제 크기는 `Svg` 가 맞춰 준다 */
const BOX = 100;

type Recipe = {
  /** 살결·옷의 면 색. null 이면 면을 칠하지 않는다(연필) */
  fill: string | null;
  fillOpacity: number;
  /** 윤곽선. null 이면 긋지 않는다(수채화는 번진 면만 남는다) */
  stroke: string | null;
  strokeWidth: number;
  /** 떨림. 크레파스가 가장 크고 연필이 그 다음, 파스텔은 얌전하다 */
  roughness: number;
  /** 면 위에 빗금을 얹는가. 크레파스의 결이다 */
  hachure: boolean;
  /** 면을 윤곽선보다 살짝 밀어 그리는가. 수채화가 종이에서 번진 자국이다 */
  bleed: number;
};

const RECIPE: Record<DrawStyle, Recipe> = {
  /** 두껍고 떨리는 선 + 빗금 결. 색연필·크레파스는 면을 꽉 채우지 못한다 */
  crayon: {
    fill: '#F2B5A0',
    fillOpacity: 0.95,
    stroke: '#2C2825',
    strokeWidth: 2.6,
    roughness: 2.2,
    hachure: true,
    bleed: 0,
  },
  /**
   * 번진 면 + **아주 연한 선**. 처음에 선을 아예 껐더니 눈·입까지 같이 지워져 얼굴이 사라졌다 -
   * 남은 것이 눈물 둘뿐이라 그게 눈으로 읽혔다. 실제 수채화도 물감이 고인 자리에 선이 남는다.
   */
  watercolor: {
    fill: '#E79A86',
    fillOpacity: 0.5,
    stroke: '#B4705E',
    strokeWidth: 1.1,
    roughness: 2.8,
    hachure: false,
    bleed: 2.2,
  },
  /** 면 없이 가는 흑연 선만. 겹쳐 그은 자국이 스케치가 된다 */
  pencil: {
    fill: null,
    fillOpacity: 0,
    stroke: '#5A554F',
    strokeWidth: 1.2,
    roughness: 1.9,
    hachure: false,
    bleed: 0,
  },
  /** 부드러운 면 + 아주 연한 선. 네 중 가장 얌전하다 */
  pastel: {
    fill: '#F6C9B8',
    fillOpacity: 0.9,
    stroke: '#B59A8C',
    strokeWidth: 1.4,
    roughness: 1.1,
    hachure: false,
    bleed: 0,
  },
};

/** 우는 아이 한 벌. 좌표는 100x100 기준이고 그림체가 달라도 **모양은 같다** */
const FIGURE = {
  head: ellipsePoints(50, 40, 44, 46),
  /**
   * 어깨. 머리 아래를 받쳐 사람으로 읽히게 하는 최소한의 몸.
   * 머리와 **살짝 겹친다** - 떨어뜨리면 사람이 아니라 눈사람이 된다.
   */
  body: roundedRectPoints(28, 62, 44, 38, 16),
  /** 감은 눈 둘. 우는 눈은 호가 아래로 굽는다 */
  eyeLeft: [
    [36, 40],
    [40, 35],
    [44, 40],
  ] as Point[],
  eyeRight: [
    [56, 40],
    [60, 35],
    [64, 40],
  ] as Point[],
  /** 벌린 입 */
  mouth: ellipsePoints(50, 55, 14, 10),
  /** 눈물 두 줄기 */
  tearLeft: ellipsePoints(39, 50, 6, 10),
  tearRight: ellipsePoints(61, 50, 6, 10),
};

export function StylePreview({ style, size }: { style: DrawStyle; size: number }) {
  const recipe = RECIPE[style];

  /**
   * 같은 그림체면 늘 같은 그림이어야 한다. 그림체를 바꿀 때만 선이 다시 그어지도록
   * seed 를 그림체에서 뽑는다 - 리렌더마다 새로 뽑으면 선이 춤춘다(`hand-drawn-ui` 1장).
   */
  const seed = useMemo(
    () => style.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7) % 9973,
    [style],
  );

  const outline = (points: Point[], index: number, closed = true) =>
    sketchPath(points, recipe.roughness, 0.8, seed + index * 37, closed);

  /** 면. 수채화는 선보다 살짝 밀어 그려 "번진" 자국을 만든다 */
  const area = (points: Point[], index: number) =>
    recipe.bleed === 0
      ? solidPath(points)
      : solidPath(points.map(([px, py]) => [px + recipe.bleed, py + recipe.bleed * 0.6]));

  const filled: Array<{ points: Point[]; key: string }> = [
    { points: FIGURE.body, key: 'body' },
    { points: FIGURE.head, key: 'head' },
  ];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`}>
      <Defs>
        {recipe.hachure ? (
          <ClipPath id={`preview-clip-${style}`}>
            <Path d={solidPath(FIGURE.head)} />
          </ClipPath>
        ) : null}
      </Defs>

      {/* 1. 면 */}
      {recipe.fill
        ? filled.map((shape, index) => (
            <Path
              key={`fill-${shape.key}`}
              d={area(shape.points, index)}
              fill={recipe.fill ?? undefined}
              fillOpacity={recipe.fillOpacity}
            />
          ))
        : null}

      {/* 2. 크레파스의 결. 얼굴 안쪽만 잘라 얹는다 */}
      {recipe.hachure ? (
        <G clipPath={`url(#preview-clip-${style})`}>
          {hachureLines(BOX, BOX, 5, -35, seed).map((line, index) => (
            <Line
              key={`hatch-${index}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#D98B6E"
              strokeWidth={1.1}
              strokeOpacity={0.5}
              strokeLinecap="round"
            />
          ))}
        </G>
      ) : null}

      {/* 3. 눈물은 면이 있는 그림체에서도 늘 보인다 - 이 그림의 주제다 */}
      {[FIGURE.tearLeft, FIGURE.tearRight].map((points, index) => (
        <Path
          key={`tear-${index}`}
          d={solidPath(points)}
          fill="#7FB4D4"
          fillOpacity={style === 'pencil' ? 0.35 : 0.75}
        />
      ))}

      {/* 4. 윤곽선. 두 번 긋는다 - 한 번만 그으면 사람이 그은 선으로 안 보인다 */}
      {recipe.stroke
        ? [
            { points: FIGURE.body, closed: true },
            { points: FIGURE.head, closed: true },
            { points: FIGURE.mouth, closed: true },
            { points: FIGURE.eyeLeft, closed: false },
            { points: FIGURE.eyeRight, closed: false },
          ].map((shape, index) => (
            <G key={`line-${index}`}>
              <Path
                d={outline(shape.points, index + 11, shape.closed)}
                stroke={recipe.stroke ?? undefined}
                strokeWidth={recipe.strokeWidth}
                strokeOpacity={0.4}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d={outline(shape.points, index, shape.closed)}
                stroke={recipe.stroke ?? undefined}
                strokeWidth={recipe.strokeWidth}
                strokeLinecap="round"
                fill="none"
              />
            </G>
          ))
        : null}
    </Svg>
  );
}
