/** 서버 명세(docs/api/)에서 한 번만 정의한다. */
import type { Weather } from '@/shared/weather';

export type { Weather };
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
