import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type Props = {
  from: string;
  to: string;
  /** 위쪽 정지점의 투명도. prototype 의 썸네일은 `rgba(255,255,255,.9)` 로 시작한다 */
  fromOpacity?: number;
};

/**
 * 부모를 꽉 채우는 세로 2단 그라디언트. 부모가 `overflow: hidden` 과 라운드를 쥐고 있어야 한다.
 *
 * prototype.html 의 `linear-gradient(180deg, rgba(255,255,255,.9), 날씨색)` 자리 전부가 쓴다 -
 * 02 최근 기록 썸네일 · 07 뱃지 메달 · 08 피드 썸네일. RN 에는 그라디언트 문법이 없어 Svg 로 그린다.
 */
export function GradientFill({ from, to, fromOpacity = 1 }: Props) {
  // defs 이름이 겹치면 다른 그라디언트가 서로를 덮어쓴다. 색에서 이름을 만들어 같은 색끼리만 공유한다
  const id = `grad${slug(from)}${slug(to)}${Math.round(fromOpacity * 100)}`;

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={from} stopOpacity={fromOpacity} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

const slug = (color: string) => color.replace(/[^a-zA-Z0-9]/g, '');
