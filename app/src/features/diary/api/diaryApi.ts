import { request, requestPage } from '@/shared/api/httpClient';
import type { DiaryCreated, DiaryDetail, DiarySummary, Weather } from './diaryTypes';

/** URL과 메서드는 이 파일에만 나온다(frontend-api-client 1장). */
export const diaryApi = {
  today: (signal?: AbortSignal) => request<DiaryDetail | null>('/api/v1/diaries/today', { signal }),

  detail: (id: string, signal?: AbortSignal) => request<DiaryDetail>(`/api/v1/diaries/${id}`, { signal }),

  recent: (size: number, signal?: AbortSignal) =>
    requestPage<DiarySummary>(`/api/v1/diaries?size=${size}`, signal),

  write: (content: string, userHint: Weather | null) =>
    request<DiaryCreated>('/api/v1/diaries', { method: 'POST', body: { content, userHint } }),

  regenerate: (id: string) =>
    request<DiaryCreated>(`/api/v1/diaries/${id}/regenerate`, { method: 'POST' }),
};
