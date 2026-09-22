import type { ReactNode } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * 앱의 모든 아이콘. 이모지를 쓰지 않는다 - 플랫폼/버전마다 모양이 다르고, 색과 굵기를 토큰에 맞출 수 없고,
 * 스크린리더가 이름을 제멋대로 읽는다.
 *
 * <p>선 아이콘 하나의 규격: 24 뷰박스, stroke 1.8, 둥근 끝. 채우기는 heart 처럼 "눌린 상태"를 보여야 할 때만.
 * 새 아이콘은 이 표에 한 줄 추가한다 - 파일을 늘리지 않는다.
 */
const CLOUD = 'M7 17.5h9a3.4 3.4 0 0 0 .3-6.8 5 5 0 0 0-9.6 1.4A3.2 3.2 0 0 0 7 17.5z';

const rays = (cx: number, cy: number, r: number, len: number) =>
  [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const x1 = cx + Math.cos(rad) * r;
    const y1 = cy + Math.sin(rad) * r;
    const x2 = cx + Math.cos(rad) * (r + len);
    const y2 = cy + Math.sin(rad) * (r + len);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }).join('');

const ICONS = {
  // 날씨 6종 - shared/weather.ts 의 Weather 와 1:1
  sunny: (s: string) => (
    <>
      <Circle cx={12} cy={12} r={4.2} stroke={s} strokeWidth={1.8} />
      <Path d={rays(12, 12, 6.4, 2.4)} stroke={s} strokeWidth={1.8} strokeLinecap="round" />
    </>
  ),
  'partly-cloudy': (s: string) => (
    <>
      <Circle cx={8.5} cy={7.5} r={2.8} stroke={s} strokeWidth={1.8} />
      <Path d={rays(8.5, 7.5, 4.6, 1.8)} stroke={s} strokeWidth={1.6} strokeLinecap="round" />
      <Path d={CLOUD} stroke={s} strokeWidth={1.8} fill="none" />
    </>
  ),
  cloudy: (s: string) => <Path d={CLOUD} stroke={s} strokeWidth={1.8} fill="none" />,
  rain: (s: string) => (
    <>
      <Path d={CLOUD} stroke={s} strokeWidth={1.8} fill="none" />
      <Path d="M9 19l-.8 2.4M12.5 19l-.8 2.4M16 19l-.8 2.4" stroke={s} strokeWidth={1.8} strokeLinecap="round" />
    </>
  ),
  snow: (s: string) => (
    <>
      <Path d={CLOUD} stroke={s} strokeWidth={1.8} fill="none" />
      <Circle cx={9} cy={20.2} r={1} fill={s} />
      <Circle cx={12.5} cy={21.6} r={1} fill={s} />
      <Circle cx={16} cy={20.2} r={1} fill={s} />
    </>
  ),
  rainbow: (s: string) => (
    <>
      <Path d="M3.5 19a8.5 8.5 0 0 1 17 0" stroke={s} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M7 19a5 5 0 0 1 10 0" stroke={s} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M10.5 19a1.5 1.5 0 0 1 3 0" stroke={s} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </>
  ),

  // 탭바 5개
  home: (s: string) => (
    <Path
      d="M4 11.2L12 5l8 6.2M6.6 10.2V19h10.8v-8.8"
      stroke={s}
      strokeWidth={1.8}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  calendar: (s: string) => (
    <Path
      d="M5 7.5h14v12H5zM5 11.5h14M9 5v4M15 5v4"
      stroke={s}
      strokeWidth={1.8}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  chart: (s: string) => (
    <Path
      d="M4.5 19h15M6.5 15.2l4-4 3 2.4 4-6"
      stroke={s}
      strokeWidth={1.8}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  chat: (s: string) => (
    <Path
      d="M20 12.2a5.5 5.5 0 0 1-5.5 5.5H9.2L5 21v-4.1A5.5 5.5 0 0 1 4 13.7v-1.5A5.5 5.5 0 0 1 9.5 6.7h5A5.5 5.5 0 0 1 20 12.2z"
      stroke={s}
      strokeWidth={1.8}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  person: (s: string) => (
    <>
      <Circle cx={12} cy={9} r={3.4} stroke={s} strokeWidth={1.8} />
      <Path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" stroke={s} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </>
  ),

  // 10 설정 목록
  bell: (s: string) => (
    <>
      <Path
        d="M6 17h12l-1.5-2.2V11a4.5 4.5 0 0 0-9 0v3.8L6 17z"
        stroke={s}
        strokeWidth={1.8}
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M10.2 19.5a2 2 0 0 0 3.6 0" stroke={s} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </>
  ),
  palette: (s: string) => (
    <>
      <Path
        d="M12 3.5a8.5 8.5 0 1 0 0 17c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-1 .8-1.8 1.8-1.8h1.3a4.6 4.6 0 0 0 4.6-4.6c0-3.6-3.8-6.5-8.5-6.5z"
        stroke={s}
        strokeWidth={1.8}
        fill="none"
      />
      <Circle cx={8} cy={12.5} r={1.1} fill={s} />
      <Circle cx={9.8} cy={8.6} r={1.1} fill={s} />
      <Circle cx={14.4} cy={8.2} r={1.1} fill={s} />
    </>
  ),
  sparkle: (s: string) => (
    <>
      <Path
        d="M11 3.5l1.6 4.3 4.3 1.6-4.3 1.6L11 15.3 9.4 11l-4.3-1.6L9.4 7.8 11 3.5z"
        stroke={s}
        strokeWidth={1.7}
        fill="none"
        strokeLinejoin="round"
      />
      <Path
        d="M17.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"
        stroke={s}
        strokeWidth={1.5}
        fill="none"
        strokeLinejoin="round"
      />
    </>
  ),
  lock: (s: string) => (
    <>
      <Path d="M5.5 11h13v9h-13z" stroke={s} strokeWidth={1.8} fill="none" strokeLinejoin="round" />
      <Path d="M8.5 11V8.4a3.5 3.5 0 0 1 7 0V11" stroke={s} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </>
  ),
  download: (s: string) => (
    <Path
      d="M12 4v10m0 0l-3.6-3.6M12 14l3.6-3.6M5 19h14"
      stroke={s}
      strokeWidth={1.8}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  account: (s: string) => (
    <>
      <Circle cx={12} cy={12} r={8.5} stroke={s} strokeWidth={1.8} />
      <Circle cx={12} cy={10} r={2.6} stroke={s} strokeWidth={1.8} />
      <Path d="M7 18.4a5.3 5.3 0 0 1 10 0" stroke={s} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </>
  ),
  medal: (s: string) => (
    <>
      <Circle cx={12} cy={14.5} r={5} stroke={s} strokeWidth={1.8} />
      <Path d="M9.2 3.5l2 6M14.8 3.5l-2 6" stroke={s} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </>
  ),

  // 그 밖
  candy: (s: string) => (
    <>
      <Circle cx={12} cy={12} r={4.4} stroke={s} strokeWidth={1.8} />
      <Path
        d="M3.5 8.2l4.4 2.6v2.4L3.5 15.8V8.2zM20.5 8.2l-4.4 2.6v2.4l4.4 2.6V8.2z"
        stroke={s}
        strokeWidth={1.7}
        fill="none"
        strokeLinejoin="round"
      />
    </>
  ),
  crown: (s: string) => (
    <Path
      d="M4.5 18h15M5 8.5l3.6 3.2L12 5.5l3.4 6.2L19 8.5l-1.3 7.5H6.3L5 8.5z"
      stroke={s}
      strokeWidth={1.8}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  flame: (s: string) => (
    <Path
      d="M12 21a5.4 5.4 0 0 0 5.4-5.4c0-3.9-3.4-5.4-3.4-8.8 0 0-3 1.5-3 4.4 0 1.5-1.5 1-1.5-1-1.2 2-2.9 2.6-2.9 5.4A5.4 5.4 0 0 0 12 21z"
      stroke={s}
      strokeWidth={1.8}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  heart: (s: string) => (
    <Path
      d="M12 20.3S4.6 15.8 3.6 11.4A4.7 4.7 0 0 1 12 7.6a4.7 4.7 0 0 1 8.4 3.8c-1 4.4-8.4 8.9-8.4 8.9z"
      fill={s}
    />
  ),
  'heart-outline': (s: string) => (
    <Path
      d="M12 20.3S4.6 15.8 3.6 11.4A4.7 4.7 0 0 1 12 7.6a4.7 4.7 0 0 1 8.4 3.8c-1 4.4-8.4 8.9-8.4 8.9z"
      stroke={s}
      strokeWidth={1.8}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  bear: (s: string) => (
    <>
      <Circle cx={7.4} cy={7.6} r={2.6} stroke={s} strokeWidth={1.8} />
      <Circle cx={16.6} cy={7.6} r={2.6} stroke={s} strokeWidth={1.8} />
      <Circle cx={12} cy={14} r={5.8} stroke={s} strokeWidth={1.8} />
      <Circle cx={10} cy={13} r={0.9} fill={s} />
      <Circle cx={14} cy={13} r={0.9} fill={s} />
    </>
  ),
} as const;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  color: string;
  /** 아이콘이 유일한 정보일 때만 준다. 옆에 같은 뜻의 글자가 있으면 생략해 중복 낭독을 막는다. */
  label?: string;
};

export function Icon({ name, size = 20, color, label }: Props): ReactNode {
  const a11y = label
    ? { accessibilityRole: 'image' as const, accessibilityLabel: label }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...a11y}>
      {ICONS[name](color)}
    </Svg>
  );
}
