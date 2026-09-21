/** 서버 명세(docs/api/)에서 한 번만 정의한다. */
export type Weather = 'SUNNY' | 'PARTLY_CLOUDY' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'RAINBOW';
export type DiaryStatus = 'GENERATING' | 'DONE' | 'FAILED';

export type DiaryDetail = {
  id: string;
  entryDate: string;      // ISO date. 표시 직전에 변환한다
  content: string;
  status: DiaryStatus;
  weather: Weather | null;
  moodScore: number | null;
  aiComment: string | null;
  imageUrl: string | null;
  canRegenerate: boolean;
};

export type DiarySummary = {
  id: string;
  entryDate: string;
  weather: Weather | null;
  content: string;
};

export type DiaryCreated = { id: string; status: DiaryStatus };

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

/** 02 빠른 감정 칩 (시안 기준 4종) */
export const QUICK_WEATHERS: Weather[] = ['SUNNY', 'PARTLY_CLOUDY', 'CLOUDY', 'RAIN'];
