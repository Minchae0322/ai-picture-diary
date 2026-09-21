/**
 * 디자인 토큰. 프리셋 muted-sky, 주 타깃 모바일(390x844).
 * 3계층: 원시 -> 의미 -> 컴포넌트. 컴포넌트는 의미 토큰만 참조한다(design-system 1장).
 * RN이라 CSS 변수가 없어 TS 객체로 표현한다(expo-app-conventions 4장).
 *
 * 값의 출처는 `.claude/skills/design-system/presets/muted-sky.md`.
 * **이 파일이 색의 진실이다.** Figma 시안(복숭아 톤)과 갈라져 있고, 그 방향은 의도된 것이다
 * (figma-workflow 4장. docs/screen/README.md "토큰의 진실" 참고).
 */

const primitive = {
  sky50: '#f4f8fb',
  sky100: '#e8f0f6',
  sky150: '#e2eef7',
  sky200: '#d8e4ee',
  mist: '#eef4f9',

  slate900: '#253544',
  slate600: '#4e6375',
  slate500: '#5b6e7f',
  /** 장식 전용. 텍스트로 쓰면 1.5:1 (muted-sky 5장) */
  slate300: '#a8bccd',

  blue300: '#8fbfe0',
  /** 장식 전용. 텍스트로 쓰면 2.8:1 */
  blue400: '#5b9bc4',
  blue600: '#3f6d8e',
  blue700: '#325a77',

  amber300: '#e5b877',
  sand200: '#dcc9a6',
  gray300: '#b6bfc8',
  steel300: '#8fa9c8',
  ice200: '#cfe0ee',
  mauve300: '#c79ab4',
  violet300: '#a99ac7',
  sage300: '#8fbfae',

  red600: '#b0434e',
  amber700: '#8a6a1f',
  green700: '#1f7a63',

  night900: '#111a21',
  night800: '#18242d',
  night700: '#1c2831',
  night600: '#26343f',
} as const;

/** LinearGradient가 요구하는 모양. 최소 두 색 */
export type Gradient = readonly [string, string, ...string[]];

/** 의미 토큰(2단계). 다크 모드는 이 표만 다시 정의한다 */
export type Colors = {
  bg: string;
  bgGradient: Gradient;
  bgGradientStops: readonly [number, number, ...number[]];
  glow: string;
  surface: string;
  surfaceSolid: string;
  surfaceRaised: Gradient;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  decor: string;
  accentSoft: string;
  primary: string;
  primaryPressed: string;
  primaryFg: string;
  primaryShadow: string;
  danger: string;
  warning: string;
  success: string;
  focus: string;
  scrim: string;
  skeleton: string;
  track: string;
};

const light: Colors = {
  /** 배경은 단색이 아니라 그라디언트다. Screen이 bgGradient를 쓴다 */
  bg: primitive.sky50,
  bgGradient: [primitive.sky50, primitive.sky100, primitive.sky200],
  bgGradientStops: [0, 0.55, 1],
  /** 상단 우측 글로우. 배경이 하늘색이라 빛도 차갑다(muted-sky 4장) */
  glow: 'rgba(205,228,245,0.9)',

  surface: 'rgba(255,255,255,0.92)',
  surfaceSolid: '#ffffff',
  surfaceRaised: ['rgba(255,255,255,0.85)', 'rgba(226,238,247,0.85)'],
  border: 'rgba(255,255,255,0.9)',
  borderStrong: '#d9e5ee',

  text: primitive.slate900,
  textMuted: primitive.slate600,
  /** 표면 위에서만 쓴다. 배경 그라디언트 위는 textMuted (muted-sky 2장) */
  textSubtle: primitive.slate500,
  /** 장식 전용 - 점선 테두리, 인디케이터, 뜻 없는 큰 글리프 */
  decor: primitive.slate300,
  accentSoft: primitive.blue400,

  primary: primitive.blue600,
  primaryPressed: primitive.blue700,
  primaryFg: '#ffffff',
  /** 주 버튼 그림자에 섞는 브랜드색 */
  primaryShadow: 'rgba(63,109,142,0.32)',

  danger: primitive.red600,
  warning: primitive.amber700,
  success: primitive.green700,
  focus: primitive.blue600,

  /** 03 화면의 딤 오버레이 */
  scrim: 'rgba(37,53,68,0.32)',
  /** 스켈레톤 자리 */
  skeleton: 'rgba(37,53,68,0.07)',
  /** 진행 막대의 빈 부분 */
  track: 'rgba(37,53,68,0.10)',
  cloud: '#ffffff',
  cloudOpacity: 1,
};

const dark: Colors = {
  bg: primitive.night900,
  bgGradient: [primitive.night900, primitive.night800, primitive.night800],
  bgGradientStops: [0, 0.55, 1],
  glow: 'rgba(143,191,224,0.16)',

  surface: primitive.night700,
  surfaceSolid: primitive.night700,
  surfaceRaised: [primitive.night600, primitive.night700],
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',

  text: '#e8f0f6',
  textMuted: '#b3c4d1',
  textSubtle: '#8ea1b1',
  decor: '#5d6d7b',
  accentSoft: primitive.blue300,

  primary: primitive.blue300,
  primaryPressed: '#b3d4ec',
  primaryFg: '#0e1a23',
  primaryShadow: 'rgba(0,0,0,0.5)',

  danger: '#ef8b95',
  warning: '#e0b45f',
  success: '#6cc7ab',
  focus: primitive.blue300,

  scrim: 'rgba(0,0,0,0.55)',
  skeleton: 'rgba(255,255,255,0.07)',
  track: 'rgba(255,255,255,0.12)',
  /** 밤하늘에서는 구름이 흰 판으로 튄다. 살짝 푸른 흰색에 알파를 크게 내린다 */
  cloud: '#cbe0f0',
  cloudOpacity: 0.24,
};

export const colorsFor = (scheme: 'light' | 'dark' | null | undefined): Colors =>
  scheme === 'dark' ? dark : light;

/** 날씨 6종의 색. 색만으로 뜻을 전하지 않는다 - 항상 라벨이나 글리프를 같이 둔다(dataviz) */
export const weatherColor = {
  SUNNY: primitive.amber300,
  PARTLY_CLOUDY: primitive.sand200,
  CLOUDY: primitive.gray300,
  RAIN: primitive.steel300,
  SNOW: primitive.ice200,
  RAINBOW: primitive.mauve300,
} as const;

/** 탭바 아이콘의 색. 탭마다 다른 악센트 하나씩 */
export const tabTint = {
  index: primitive.blue400,
  calendar: primitive.amber300,
  graph: primitive.violet300,
  community: primitive.sage300,
  my: primitive.mauve300,
} as const;

/** 28이 화면 좌우 기본 여백. 카드가 가장자리까지 가는 화면만 20 */
export const space = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 12: 48, 16: 64,
} as const;

export const radius = { sm: 10, md: 16, lg: 24, xl: 34, full: 9999 } as const;

export const font = {
  micro: 10, xs: 12, sm: 13, base: 14, md: 15, lg: 17, xl: 20, xxl: 24, display: 34,
  weightMedium: '500', weightBold: '700', weightBlack: '900',
} as const;

/** 줄간격은 px로 계산해 넘긴다. RN의 lineHeight는 배수를 받지 않는다 */
export const leading = (size: number, ratio = 1.45): number => Math.round(size * ratio);

/** 버튼 높이 4단계(design-system 5.5장). 44 미만이면 히트 영역을 따로 넓힌다 */
export const buttonHeight = { small: 33, medium: 40, large: 48, xlarge: 63 } as const;

/** 터치 타깃 최소값(expo-app-conventions 2장) */
export const MIN_TOUCH_TARGET = 44;

/** 기준 시안 폭. 이보다 넓어져도 본문은 이 폭을 넘지 않는다 */
export const CONTENT_MAX_WIDTH = 430;

/** iOS/Android 그림자 API가 달라 둘 다 담는다 */
export const shadow = {
  sm: {
    shadowColor: '#253544',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  md: {
    shadowColor: '#253544',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  /** 탭바처럼 위로 떨어지는 그림자 */
  up: {
    shadowColor: '#253544',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
} as const;

export const duration = { fast: 150, base: 200, slow: 300 } as const;
