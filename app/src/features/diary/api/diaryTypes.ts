/** 서버 명세(docs/api/)에서 한 번만 정의한다. */
export {
  WEATHERS,
  WEATHER_ICON,
  WEATHER_LABEL,
  toWeather,
  weatherLabel,
  type Weather,
} from '@/shared/weather';

import type { Weather } from '@/shared/weather';

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

/** 05 감정 캘린더. days 에는 기록이 있는 날만 들어온다. */
export type DiaryCalendar = {
  month: string;          // "2026-08"
  days: { date: string; diaryId: string; weather: Weather; moodScore: number | null }[];
  summary: { weather: Weather; days: number }[];
  recordedDays: number;
};

/** 06 감정 그래프. 무기록일은 points 에 없다 - 선을 끊으라는 뜻이다. */
export type DiaryStats = {
  period: StatsPeriod;
  from: string;
  to: string;
  points: { date: string; moodScore: number }[];
  average: number | null;
  previousAverage: number | null;
  bestDate: string | null;
  bestScore: number | null;
  streakDays: number;
  recordedDays: number;
  words: { word: string; count: number }[];
};

export type StatsPeriod = 'WEEK' | 'MONTH' | 'YEAR';

/** 02 연속 배지 · 06 KPI · 10 통계가 같이 쓰는 값. */
export type DiaryOverview = { totalCount: number; streakDays: number };

/** 기분 점수 범위. 서버 app.diary.mood-min/max 와 같은 값이어야 한다(06 Y축). */
export const MOOD_MIN = -3;
export const MOOD_MAX = 3;

/** 02 빠른 감정 칩 (시안 기준 4종) */
export const QUICK_WEATHERS: Weather[] = ['SUNNY', 'PARTLY_CLOUDY', 'CLOUDY', 'RAIN'];
