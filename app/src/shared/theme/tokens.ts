/**
 * 디자인 토큰. 프리셋 soft-modern(브랜드만 젤리 바이올렛으로 교체), 주 타깃 모바일.
 * 3계층: 원시 -> 의미 -> 컴포넌트. 컴포넌트는 의미 토큰만 참조한다(design-system 1장).
 * RN이라 CSS 변수가 없어 TS 객체로 표현한다(expo-app-conventions 4장).
 */

import type { Weather } from '@/shared/weather';

const primitive = {
  neutral0: '#ffffff',
  neutral50: '#f7f8fa',
  neutral100: '#eef0f4',
  neutral200: '#e2e5eb',
  neutral300: '#cbd0d9',
  neutral400: '#9aa2b1',
  neutral500: '#6b7385',
  neutral800: '#232936',
  neutral900: '#151a23',
  neutral950: '#0d1117',
  brand100: '#e7e2ff',
  brand300: '#b3a5ff',
  brand500: '#6c5ce7',
  brand600: '#5849c4',
  red500: '#dc2f3c',
  amber500: '#d97706',
  green500: '#128a5e',
} as const;

/** 의미 토큰의 모양. primitive 가 as const 라 추론에 맡기면 리터럴 타입이 되어 다크 팔레트가 안 맞는다. */
export type Colors = {
  bg: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryPressed: string;
  primaryFg: string;
  danger: string;
  warning: string;
  success: string;
};

const light: Colors = {
  bg: primitive.neutral50,
  surface: primitive.neutral0,
  surfaceRaised: primitive.neutral0,
  border: primitive.neutral200,
  borderStrong: primitive.neutral300,
  text: primitive.neutral900,
  textMuted: primitive.neutral500,
  textSubtle: primitive.neutral400,
  primary: primitive.brand500,
  primaryPressed: primitive.brand600,
  primaryFg: '#ffffff',
  danger: primitive.red500,
  warning: primitive.amber500,
  success: primitive.green500,
};

const dark: Colors = {
  bg: primitive.neutral950,
  surface: primitive.neutral900,
  surfaceRaised: primitive.neutral800,
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: primitive.neutral100,
  textMuted: primitive.neutral400,
  textSubtle: primitive.neutral500,
  primary: primitive.brand300,
  primaryPressed: primitive.brand100,
  primaryFg: primitive.neutral950,
  danger: primitive.red500,
  warning: primitive.amber500,
  success: primitive.green500,
};

export const colorsFor = (scheme: string | null | undefined) => (scheme === 'dark' ? dark : light);

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48, 16: 64 } as const;
export const radius = { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 } as const;
export const font = {
  xs: 12, sm: 14, base: 16, lg: 20, xl: 24, xxl: 32,
  weightMedium: '500', weightBold: '700',
} as const;

/** 버튼 높이 4단계(design-system 5.5장). 44 미만이면 히트 영역을 따로 넓힌다. */
export const buttonHeight = { small: 32, medium: 40, large: 48, xlarge: 56 } as const;

/** 터치 타깃 최소값(expo-app-conventions 2장) */
export const MIN_TOUCH_TARGET = 44;

/** iOS/Android 그림자 API가 달라 둘 다 담는다 */
export const shadow = {
  sm: {
    shadowColor: '#151a23',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: '#151a23',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;

/**
 * 날씨 6종의 의미 색. 05 캘린더 셀과 06 차트가 같은 색을 쓴다.
 * 색만으로 뜻을 전달하지 않는다 - 옆에 항상 이모지나 라벨이 붙는다(dataviz / ui-fundamentals).
 */
export type WeatherColors = Record<Weather, string>;

const weatherLight: WeatherColors = {
  SUNNY: '#e8a33d',
  PARTLY_CLOUDY: '#7fa8d9',
  CLOUDY: '#8b93a3',
  RAIN: '#4f74b8',
  SNOW: '#6fb5c7',
  RAINBOW: primitive.brand500,
};

const weatherDark: WeatherColors = {
  SUNNY: '#f0bd6b',
  PARTLY_CLOUDY: '#9dc0e8',
  CLOUDY: '#a7aebd',
  RAIN: '#7d9cd9',
  SNOW: '#8fd0e0',
  RAINBOW: primitive.brand300,
};

export const weatherColorsFor = (scheme: string | null | undefined) =>
  scheme === 'dark' ? weatherDark : weatherLight;
