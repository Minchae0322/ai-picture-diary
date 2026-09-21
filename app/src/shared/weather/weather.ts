/**
 * 날씨는 일기·캘린더·그래프·커뮤니티 네 feature가 같이 쓰는 어휘라 shared에 둔다.
 * feature끼리 직접 import하지 않는다(frontend-architecture 1장).
 *
 * 6종 고정. 늘리려면 07 뱃지의 "감정 6종 전부" 조건도 같이 본다(프로젝트 스킬 3장).
 */
export const WEATHERS = ['SUNNY', 'PARTLY_CLOUDY', 'CLOUDY', 'RAIN', 'SNOW', 'RAINBOW'] as const;
export type Weather = (typeof WEATHERS)[number];

/** 표시명은 프론트가 매핑한다(api-design 5장) */
export const WEATHER_LABEL: Record<Weather, string> = {
  SUNNY: '맑음',
  PARTLY_CLOUDY: '구름조금',
  CLOUDY: '흐림',
  RAIN: '비',
  SNOW: '눈',
  RAINBOW: '무지개',
};

export const WEATHER_EMOJI: Record<Weather, string> = {
  SUNNY: '☀️',
  PARTLY_CLOUDY: '⛅',
  CLOUDY: '☁️',
  RAIN: '🌧️',
  SNOW: '❄️',
  RAINBOW: '🌈',
};

/** 02 빠른 감정 칩 (시안 `quick-chips` 4종) */
export const QUICK_WEATHERS: Weather[] = ['SUNNY', 'PARTLY_CLOUDY', 'CLOUDY', 'RAIN'];

/** 기분 점수 범위. 04 표시, 06 그래프 축, DB check 제약이 같은 값이다 */
export const MOOD_MIN = -3;
export const MOOD_MAX = 3;

/** "+2" / "-1" / "0". 부호를 항상 붙여 04와 06이 같은 표기를 쓰게 한다 */
export function formatMood(score: number): string {
  return score > 0 ? `+${score}` : String(score);
}
