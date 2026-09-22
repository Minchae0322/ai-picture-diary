import { request } from '@/shared/api/httpClient';

/** 07 뱃지. 조건 문구까지 서버가 준다 - 앱을 새로 배포하지 않고 뱃지를 늘리기 위함이다. */
export type Badge = {
  code: string;
  name: string;
  condition: string;
  earned: boolean;
  earnedAt: string | null;
};

export type BadgeCollection = { badges: Badge[]; earnedCount: number; totalCount: number };

export const badgeApi = {
  collection: (signal?: AbortSignal) => request<BadgeCollection>('/api/v1/badges', { signal }),
};
