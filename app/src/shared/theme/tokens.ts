/**
 * 디자인 토큰. 프리셋 muted-sky, 주 타깃 모바일(390x844).
 * 3계층: 원시 -> 의미 -> 컴포넌트. 컴포넌트는 의미 토큰만 참조한다(design-system 1장).
 * RN이라 CSS 변수가 없어 TS 객체로 표현한다(expo-app-conventions 4장).
 *
 * 값의 출처는 `.claude/skills/design-system/presets/muted-sky.md`.
 * **이 파일이 색의 진실이다.** Figma 시안(복숭아 톤)과 갈라져 있고, 그 방향은 의도된 것이다
 * (figma-workflow 4장. docs/screen/README.md "토큰의 진실" 참고).
 */

import type { Emotion } from '@/shared/emotion';

const primitive = {
  /** 배경 바닐라 */
  paper: '#faf4dc',
  paperRaised: 'rgba(255,253,247,0.95)',
  paperLine: '#ece3c2',

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

  /** 형광펜 띠. 그 위 글자는 배경과 같은 바닐라라 글자가 파인 것처럼 보인다 */
  cocoa600: '#7c5445',

  red600: '#b0434e',
  amber700: '#8a6a1f',
  green700: '#1f7a63',

  night900: '#111a21',
  night800: '#18242d',
  night700: '#1c2831',
  night600: '#26343f',
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
  /** 표면 위에서만 쓴다. 배경 위는 textMuted (muted-sky 2장) */
  textSubtle: string;
  /** 장식 전용 - 점선 테두리, 인디케이터, 뜻 없는 큰 글리프 */
  decor: string;
  primary: string;
  primaryPressed: string;
  primaryFg: string;
  /** 주 버튼 그림자에 섞는 브랜드색 */
  primaryShadow: string;
  danger: string;
  warning: string;
  success: string;
  /** 03 화면의 딤 오버레이 */
  scrim: string;
  skeleton: string;
  /** 진행 막대의 빈 부분 */
  track: string;
  /** 01 헤드라인의 형광펜 띠 */
  highlight: string;
  /** 그 띠 위에 얹히는 글자색 */
  highlightText: string;
  /** 01 히어로 뒤 노트 괘선 */
  rule: string;
  /** 감정 색 위에 바로 얹히는 글자색. 감정 색이 테마 불변이라 이것도 고정이다 */
  emotionInk: string;
};

const light: Colors = {
  bg: primitive.paper,
  surface: 'rgba(255,255,255,0.92)',
  surfaceRaised: primitive.paperRaised,
  /** 배경이 밝아 흰 카드가 묻힌다. 테두리가 경계를 대신 잡는다(배경과 ΔE 4.7) */
  border: 'rgba(37,53,68,0.12)',
  borderStrong: primitive.paperLine,

  text: primitive.slate900,
  textMuted: primitive.slate600,
  textSubtle: primitive.slate500,
  decor: primitive.slate300,

  primary: primitive.blue600,
  primaryPressed: primitive.blue700,
  primaryFg: '#ffffff',
  primaryShadow: 'rgba(63,109,142,0.32)',

  danger: primitive.red600,
  warning: primitive.amber700,
  success: primitive.green700,

  scrim: 'rgba(37,53,68,0.32)',
  skeleton: 'rgba(37,53,68,0.07)',
  track: 'rgba(37,53,68,0.10)',

  highlight: primitive.cocoa600,
  highlightText: primitive.paper,
  rule: 'rgba(63,63,63,0.22)',
  emotionInk: primitive.slate900,
};

const dark: Colors = {
  bg: primitive.night900,
  surface: primitive.night700,
  surfaceRaised: primitive.night600,
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',

  text: '#e8f0f6',
  textMuted: '#b3c4d1',
  textSubtle: '#8ea1b1',
  decor: '#5d6d7b',

  primary: primitive.blue300,
  primaryPressed: '#b3d4ec',
  primaryFg: '#0e1a23',
  primaryShadow: 'rgba(0,0,0,0.5)',

  danger: '#ef8b95',
  warning: '#e0b45f',
  success: '#6cc7ab',

  scrim: 'rgba(0,0,0,0.55)',
  skeleton: 'rgba(255,255,255,0.07)',
  track: 'rgba(255,255,255,0.12)',

  /** 띠가 어둡고 글자가 밝은 조합이라 다크에서도 그대로 통한다(4.30:1). 따로 잡지 않는다 */
  highlight: primitive.cocoa600,
  highlightText: primitive.paper,
  /** 어두운 배경에서 #3f3f3f 괘선은 보이지 않는다 */
  rule: 'rgba(255,255,255,0.12)',
  /** 감정 색이 다크에서도 같은 값이라 라이트와 같다 */
  emotionInk: primitive.slate900,
};

export const colorsFor = (scheme: string | null | undefined) => (scheme === 'dark' ? dark : light);

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 12: 48, 16: 64 } as const;
export const radius = { sm: 10, md: 16, lg: 24, xl: 34, full: 9999 } as const;

/**
 * 서체는 **SUIT 하나**다. 등록은 `app/app/_layout.tsx` 의 `useFonts(FONT_ASSETS)` 한 곳.
 *
 * **굵기는 패밀리로 고른다.** RN은 커스텀 폰트에서 `fontWeight` 로 굵기를 합성하지 못한다
 * (특히 안드로이드). 그래서 `weightBold` 같은 토큰을 두지 않는다.
 * 그리고 RN은 폰트가 상속되지 않으므로 **글자가 있는 스타일마다 `fontFamily` 를 넣는다.**
 */
export const font = {
  micro: 10,
  xs: 12,
  sm: 13,
  base: 14,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  /** 01 온보딩 헤드라인 */
  display: 34,

  regular: 'SUIT-Regular',
  medium: 'SUIT-Medium',
  bold: 'SUIT-Bold',
  black: 'SUIT-Heavy',
} as const;

/** `useFonts` 에 그대로 넘긴다. 굵기마다 파일이 따로다 */
export const FONT_ASSETS = {
  'SUIT-Regular': require('@assets/fonts/SUIT-Regular.otf'),
  'SUIT-Medium': require('@assets/fonts/SUIT-Medium.otf'),
  'SUIT-Bold': require('@assets/fonts/SUIT-Bold.otf'),
  'SUIT-Heavy': require('@assets/fonts/SUIT-Heavy.otf'),
} as const;

/** 줄 높이. 본문 1.45, 제목은 호출부에서 비율을 넘긴다 */
export const leading = (size: number, ratio = 1.45) => Math.round(size * ratio);

/** 버튼 높이 4단계(design-system 5.5장). 44 미만이면 히트 영역을 따로 넓힌다. */
export const buttonHeight = { small: 33, medium: 40, large: 48, xlarge: 63 } as const;

/** 터치 타깃 최소값(expo-app-conventions 2장) */
export const MIN_TOUCH_TARGET = 44;

/** 390 기준 본문 칼럼. 태블릿에서 글줄이 늘어지지 않게 가둔다 */
export const CONTENT_MAX_WIDTH = 420;

/** iOS/Android 그림자 API가 달라 둘 다 담는다 */
export const shadow = {
  sm: {
    shadowColor: primitive.slate900,
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: primitive.slate900,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;

/**
 * 감정 9종의 색조. 05 캘린더 셀과 06 차트가 같은 색을 쓴다.
 *
 * **색이 뜻을 나르지 않는다.** 과일에서 뽑은 색이라 빨강이 셋이다
 * (체리 ENERGETIC #d33b57 / 딸기 HAPPY #e3564f / 토마토 SOSO #dd4a3c) - dataviz 범주형 검증을 통과하지 못한다.
 * 그래서 이 색은 **배경 wash 와 테두리에만** 쓰고, 정체성은 늘 `EmotionFace` 그림과 라벨이 전한다.
 * 색 하나로 감정을 표시하는 자리를 새로 만들지 않는다.
 */
export type EmotionColors = Record<Emotion, string>;

const emotion: EmotionColors = {
  HAPPY: '#e3564f',
  ENERGETIC: '#d33b57',
  SOSO: '#dd4a3c',
  SHY: '#eda7ae',
  EMBARRASSED: '#e08a3c',
  TIRED: '#8a9e62',
  SAD: '#5b3f8f',
  DEPRESSED: '#3b3f7a',
  ANGRY: '#c2ba3e',
};

/**
 * 감정 색은 **스킴에 따라 갈리지 않는다.** 과일에서 뽑은 색이라 테마가 바뀐다고 과일이 바뀌지 않고,
 * 그 위에 얹히는 글자색(`emotionInk`)도 고정해 두었기 때문이다.
 * 함수 모양은 유지해 호출부가 스킴 인자를 계속 넘길 수 있게 한다.
 */
export const emotionColorsFor = (_scheme: string | null | undefined) => emotion;

/** 탭바 아이콘의 색. 탭마다 다른 악센트 하나씩 */
export const tabTint = {
  index: primitive.blue400,
  calendar: primitive.amber300,
  graph: primitive.violet300,
  community: primitive.sage300,
  my: primitive.mauve300,
} as const;
