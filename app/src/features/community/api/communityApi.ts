import { request, requestPage } from '@/shared/api/httpClient';
import type { Weather } from '@/shared/weather';

/** 추천은 오늘 기록이 있어야 동작한다. 없으면 서버가 조용히 최신순으로 떨어뜨린다. */
export type PostSort = 'RECOMMENDED' | 'POPULAR' | 'LATEST';

export type ReportReason = 'ABUSE' | 'SPAM' | 'SEXUAL' | 'PRIVACY' | 'OTHER';

export type CommunityPost = {
  id: string;
  authorName: string;
  weather: string;
  content: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  mine: boolean;
  createdAt: string;
};

export type FeedQuery = { sort: PostSort; weathers: Weather[]; cursor?: string; size?: number };

/** URL과 메서드는 이 파일에만. 날씨 다중 필터는 같은 키를 반복한다(weather=SUNNY&weather=RAIN). */
export const communityApi = {
  feed: ({ sort, weathers, cursor, size = 20 }: FeedQuery, signal?: AbortSignal) => {
    const params = new URLSearchParams({ sort, size: String(size) });
    weathers.forEach((weather) => params.append('weather', weather));
    if (cursor) {
      params.set('cursor', cursor);
    }
    return requestPage<CommunityPost>(`/api/v1/community/posts?${params}`, signal);
  },

  share: (diaryId: string) =>
    request<{ id: string }>('/api/v1/community/posts', { method: 'POST', body: { diaryId } }),

  like: (postId: string) =>
    request<void>(`/api/v1/community/posts/${postId}/like`, { method: 'POST' }),

  unlike: (postId: string) =>
    request<void>(`/api/v1/community/posts/${postId}/like`, { method: 'DELETE' }),

  report: (postId: string, reason: ReportReason) =>
    request<void>(`/api/v1/community/posts/${postId}/report`, { method: 'POST', body: { reason } }),
};
