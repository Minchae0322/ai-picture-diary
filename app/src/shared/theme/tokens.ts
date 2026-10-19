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
  /**
   * 배경 종이. **브랜드에서 뽑은 아주 연한 하늘**이다(2026-10-20).
   *
   * <p>따뜻한 쪽을 두 번 시도했다가 두 번 다 접었다 - 오트밀(`#F3EBDA`)은 탁했고
   * 크림(`#FBF8F0`)도 아니었다. 문제는 밝기가 아니라 **노란기 자체**였다.
   *
   * <p>그래서 온도를 뒤집었다. 브랜드색 흐린 하늘(`#3f6d8e`)을 아주 연하게 푼 값이라
   * 회색처럼 밋밋하지 않고 제품의 색과 이어진다. 그리고 과일 캐릭터가 전부 따뜻한 색이라
   * **서늘한 바탕 위에서 오히려 살아난다** - 크림 위에서는 같은 계열끼리 뭉쳤다.
   *
   * 본문 `#253544` 대비 **11.48**, 보조 `#4e6375` **5.70**, 흰 카드와 ΔE **3.2**
   * (따뜻한 후보들보다 오히려 분리가 낫다). 경계는 손그림 선이 잡으므로 면 차이는 거들기만 하면 된다.
   */
  paper: '#F2F5F8',
  /** 아래로 갈수록 조금 깊어진다. 종이 한 장을 비스듬히 본 정도 */
  paperDeep: '#E9EEF3',
  paperRaised: 'rgba(255,255,255,0.97)',
  paperLine: '#e2d6ba',

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
  /** 배경 세로 그라디언트. prototype.html `.phone` 의 sky-50 -> sky-100 -> sky-200 */
  bgTop: string;
  bgBottom: string;
  surface: string;
  surfaceRaised: string;
  /** 반투명이 아닌 면. 입력 필드·soft 버튼·시트·차트 점 테두리가 쓴다(prototype `--surface-solid`) */
  surfaceSolid: string;
  /** 솟은 카드의 위/아래 색(prototype `--raised-a`/`--raised-b`).
   *  Svg 그라디언트의 stop 이라 알파를 페이지 바닥색에 미리 섞어 불투명 값으로 둔다 */
  raisedA: string;
  raisedB: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  /** 표면 위에서만 쓴다. 배경 위는 textMuted (muted-sky 2장) */
  textSubtle: string;
  /** 장식 전용 - 점선 테두리, 인디케이터, 뜻 없는 큰 글리프 */
  decor: string;
  primary: string;
  /** 장식 악센트. 점선 캔버스·로더·dots·배너 그라디언트 끝(prototype `--accent-soft`) */
  accentSoft: string;
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
  /** 화면 우상단 햇살 글로우. 라이트는 따뜻한 흰빛, 다크는 옅은 하늘빛.
   *  Svg 그라디언트의 stop 이라 색과 투명도를 쪼개 둔다 */
  glow: string;
  glowOpacity: number;
  /** 01 헤드라인의 형광펜 띠 */
  highlight: string;
  /** 그 띠 위에 얹히는 글자색 */
  highlightText: string;
  /** 01 히어로 뒤 노트 괘선 */
  rule: string;
  /** 감정 색 위에 바로 얹히는 글자색. 감정 색이 테마 불변이라 이것도 고정이다 */
  emotionInk: string;
  /** 감정 캐릭터가 얹히는 면. 과일 색을 깔면 같은 계열이라 캐릭터가 묻힌다 */
  faceBg: string;
  /** 종이 결로 흩뿌리는 점의 색. 라이트는 흑연, 다크는 흰빛 */
  grain: string;
};

const light: Colors = {
  bg: primitive.paper,
  bgTop: primitive.paper,
  /** 아래로 갈수록 아주 조금 깊어진다 - 종이 한 장을 비스듬히 본 느낌 */
  bgBottom: primitive.paperDeep,
  surface: 'rgba(255,255,255,0.96)',
  surfaceRaised: primitive.paperRaised,
  surfaceSolid: '#ffffff',
  raisedA: '#ffffff',
  raisedB: '#FFFDF9',
  /**
   * 배경이 밝아 흰 카드가 묻힌다 - 카드 면과 배경의 차이는 **ΔE 4.3**(OKLab x100)뿐이라
   * 경계를 면 색으로는 만들 수 없다. 테두리가 그 일을 대신한다.
   *
   * 0.12 에서 **0.16** 으로 올렸다(2026-10-20). 0.12 일 때 테두리 선과 배경의 차이가 ΔE 5.2 라
   * 화면 전체가 뿌옇게 읽혔다. 0.16 이면 7.4 로 올라가 카드가 제 모양으로 선다.
   * 더 올리면(0.20 -> 9.8) 선이 먼저 보이기 시작해 바닐라의 부드러움이 깨진다.
   */
  border: 'rgba(37,53,68,0.16)',
  borderStrong: primitive.paperLine,

  text: primitive.slate900,
  textMuted: primitive.slate600,
  textSubtle: primitive.slate500,
  decor: primitive.slate300,

  primary: primitive.blue600,
  accentSoft: primitive.blue400,
  primaryPressed: primitive.blue700,
  primaryFg: '#ffffff',
  primaryShadow: 'rgba(63,109,142,0.32)',

  danger: primitive.red600,
  warning: primitive.amber700,
  success: primitive.green700,

  scrim: 'rgba(37,53,68,0.32)',
  skeleton: 'rgba(37,53,68,0.07)',
  track: 'rgba(37,53,68,0.10)',

  /** 바탕이 서늘해져 글로우도 같이 식혔다. 따뜻한 빛만 남으면 그 모서리만 누렇게 뜬다 */
  glow: '#f8fbff',
  glowOpacity: 0.85,
  highlight: primitive.cocoa600,
  highlightText: primitive.paper,
  rule: 'rgba(63,63,63,0.22)',
  emotionInk: primitive.slate900,
  grain: '#3B3B3B',
  /**
   * 분리 정도는 **그림의 실제 픽셀**로 잰다 - 대표색 한 점으로 재면 여러 색을 가진 캐릭터를 놓친다.
   * 불투명 픽셀의 ΔE 중앙값(OKLab x100): 블루베리 50.9 / 가지 49.7 / 체리·딸기·토마토 35.7 /
   * 당근 30.2 / 아보카도 24.1 / 키위 20.6 / **복숭아 19.7** - 연분홍이라 제일 약하지만 충분하다.
   * 배경과 ΔE 10 이내인 픽셀은 어느 캐릭터도 1% 미만이다.
   * 바닐라 페이지 배경과는 ΔE 12.3, 위에 글자가 오면 #253544 로 8.32:1.
   * 그림이 테마를 따라 바뀌지 않으므로 이 면도 다크에서 같은 값이다.
   */
  faceBg: '#b8d7e7',
};

const dark: Colors = {
  bg: primitive.night900,
  bgTop: primitive.night900,
  bgBottom: primitive.night800,
  surface: primitive.night700,
  surfaceRaised: primitive.night600,
  surfaceSolid: primitive.night700,
  raisedA: primitive.night600,
  raisedB: primitive.night700,
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',

  text: '#e8f0f6',
  textMuted: '#b3c4d1',
  textSubtle: '#8ea1b1',
  decor: '#5d6d7b',

  primary: primitive.blue300,
  accentSoft: primitive.blue300,
  primaryPressed: '#b3d4ec',
  primaryFg: '#0e1a23',
  primaryShadow: 'rgba(0,0,0,0.5)',

  danger: '#ef8b95',
  warning: '#e0b45f',
  success: '#6cc7ab',

  scrim: 'rgba(0,0,0,0.55)',
  skeleton: 'rgba(255,255,255,0.07)',
  track: 'rgba(255,255,255,0.12)',

  glow: primitive.blue300,
  glowOpacity: 0.16,
  /** 띠가 어둡고 글자가 밝은 조합이라 다크에서도 그대로 통한다(4.30:1). 따로 잡지 않는다 */
  highlight: primitive.cocoa600,
  highlightText: primitive.paper,
  /** 어두운 배경에서 #3f3f3f 괘선은 보이지 않는다 */
  rule: 'rgba(255,255,255,0.12)',
  /** 감정 색이 다크에서도 같은 값이라 라이트와 같다 */
  emotionInk: primitive.slate900,
  /** 캐릭터 그림이 테마를 따라 바뀌지 않으니 이 면도 같다 */
  faceBg: '#b8d7e7',
  /** 어두운 면 위에서는 흰 점이 종이 결이 된다 */
  grain: '#ffffff',
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

/** 버튼 크기별 글자 크기. prototype `.btn` / `.btn.sm` / `.btn.md` / `.btn.xl` */
export const buttonFontSize = {
  small: font.sm,
  medium: font.base,
  large: font.md,
  xlarge: font.lg,
} as const;

/**
 * 화면 좌우 여백. prototype 의 `.pad`(28) 와 `.pad.g20`(20) 두 벌이다.
 * 카드가 화면 폭을 꽉 쓰는 화면(캘린더·그래프·피드·MY)이 narrow 를 쓴다.
 */
export const gutter = { wide: 28, narrow: 20 } as const;

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
  /** 카드가 바닥에서 뜨는 정도. 테두리와 함께 경계를 만든다 - 둘 중 하나만으로는 약하다 */
  md: {
    shadowColor: primitive.slate900,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  /** 탭바처럼 **위로** 뜨는 면. prototype `--shadow-up` */
  up: {
    shadowColor: primitive.slate900,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
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

/**
 * 탭바 아이콘의 색. 탭마다 다른 악센트 하나씩(prototype `--t-home` ~ `--t-my`).
 *
 * **선택된 탭의 아이콘은 3:1 을 넘겨야 한다**(비텍스트 대비). 전에는 장식용 `*300` 원시값을
 * 그대로 썼는데, 흰 탭바 위에서 선택 상태가 홈 3.01 / 그래프 2.56 / MY 2.39 / 커뮤니티 2.04 /
 * **캘린더 1.82** 였다 - 고른 탭조차 기준 아래였다.
 * 같은 색상(OKLab 의 a·b)을 유지한 채 명도만 내려 전부 3.2 이상으로 맞춘다. 하늘색 계열이라는
 * 인상은 그대로고 눈에만 또렷해진다.
 *
 * 다크에서는 어두운 면 위라 원래의 연한 값이 더 잘 보인다. 그대로 쓴다.
 */
const tabTintLight = {
  index: '#5696bf',
  calendar: '#b18645',
  graph: '#9788b4',
  community: '#699888',
  my: '#ad829b',
} as const;

const tabTintDark = {
  index: primitive.blue300,
  calendar: primitive.amber300,
  graph: primitive.violet300,
  community: primitive.sage300,
  my: primitive.mauve300,
} as const;

export const tabTintFor = (scheme: string | null | undefined) =>
  scheme === 'dark' ? tabTintDark : tabTintLight;

/**
 * 고르지 않은 탭의 색. **같은 색을 흐리게 쓰지 않는다.**
 *
 * 전에는 탭 색을 28% 로 깔았는데, 그러면 캘린더의 선택/비선택 차이가 대비로 0.64 밖에 안 났다 -
 * 흐린 노랑과 덜 흐린 노랑이라 어느 쪽이 켜진 것인지 읽히지 않는다.
 * 비선택을 **무채색**으로 두면 "색이 있다 / 없다" 라는, 명도 차이보다 훨씬 또렷한 신호가 된다.
 * 탭바 전체가 회색 띠가 되는 것도 아니다 - 고른 탭 하나는 늘 제 색을 들고 있다.
 */
export const tabInactiveFor = (scheme: string | null | undefined) =>
  scheme === 'dark' ? '#6b7a86' : '#9aa7b2';
