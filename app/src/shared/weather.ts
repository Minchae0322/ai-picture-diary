/**
 * 감정 날씨 6종. 서버 enum(diary.Weather)과 1:1이고 표시명·이모지는 프론트가 매핑한다(api-design 5장).
 * 커뮤니티·캘린더·그래프가 같은 어휘를 써야 해서 feature 가 아니라 shared 에 둔다.
 */
import type { IconName } from './ui/Icon';

export type Weather = 'SUNNY' | 'PARTLY_CLOUDY' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'RAINBOW';

export const WEATHERS: Weather[] = ['SUNNY', 'PARTLY_CLOUDY', 'CLOUDY', 'RAIN', 'SNOW', 'RAINBOW'];

export const WEATHER_LABEL: Record<Weather, string> = {
  SUNNY: '맑음',
  PARTLY_CLOUDY: '구름조금',
  CLOUDY: '흐림',
  RAIN: '비',
  SNOW: '눈',
  RAINBOW: '무지개',
};

/** 이모지 대신 SVG 아이콘 이름. 모양·색·굵기를 토큰에 맞추려면 그림을 우리가 가져야 한다. */
export const WEATHER_ICON: Record<Weather, IconName> = {
  SUNNY: 'sunny',
  PARTLY_CLOUDY: 'partly-cloudy',
  CLOUDY: 'cloudy',
  RAIN: 'rain',
  SNOW: 'snow',
  RAINBOW: 'rainbow',
};

/** 서버가 준 문자열이 6종 밖이면 화면이 깨지지 않게 null 로 떨어뜨린다. */
export function toWeather(value: string | null | undefined): Weather | null {
  return value && (WEATHERS as string[]).includes(value) ? (value as Weather) : null;
}

/** 이모지는 스크린리더가 이상하게 읽는다 - 라벨을 따로 준다(ui-fundamentals 접근성). */
export function weatherLabel(weather: Weather | null): string {
  return weather ? WEATHER_LABEL[weather] : '기록 없음';
}
