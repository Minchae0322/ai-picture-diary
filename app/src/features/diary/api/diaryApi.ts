import { request, requestPage } from '@/shared/api/httpClient';
import type {
  DiaryCalendar,
  DiaryCreated,
  DiaryDetail,
  DiaryOverview,
  DiaryStats,
  DiarySummary,
  StatsPeriod,
  Weather,
} from './diaryTypes';

/** URL과 메서드는 이 파일에만 나온다(frontend-api-client 1장). */
export const diaryApi = {
  today: (signal?: AbortSignal) => request<DiaryDetail | null>('/api/v1/diaries/today', { signal }),

  detail: (id: string, signal?: AbortSignal) =>
    request<DiaryDetail>(`/api/v1/diaries/${id}`, { signal }),

  recent: (size: number, signal?: AbortSignal) =>
    requestPage<DiarySummary>(`/api/v1/diaries?size=${size}`, signal),

  write: (content: string, userHint: Weather | null) =>
    request<DiaryCreated>('/api/v1/diaries', { method: 'POST', body: { content, userHint } }),

  regenerate: (id: string) =>
    request<DiaryCreated>(`/api/v1/diaries/${id}/regenerate`, { method: 'POST' }),

  /** 05. month 는 "2026-08". 생략하면 서버 기준 이번 달. */
  calendar: (month: string, signal?: AbortSignal) =>
    request<DiaryCalendar>(`/api/v1/diaries/calendar?month=${month}`, { signal }),

  stats: (period: StatsPeriod, signal?: AbortSignal) =>
    request<DiaryStats>(`/api/v1/diaries/stats?period=${period}`, { signal }),

  overview: (signal?: AbortSignal) => request<DiaryOverview>('/api/v1/diaries/overview', { signal }),
};
