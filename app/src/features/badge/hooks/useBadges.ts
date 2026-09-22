import { useQuery } from '@tanstack/react-query';
import { badgeApi } from '../api/badgeApi';

export const badgeKeys = {
  all: ['badge'] as const,
  collection: () => [...badgeKeys.all, 'collection'] as const,
};

export function useBadges() {
  return useQuery({
    queryKey: badgeKeys.collection(),
    queryFn: ({ signal }) => badgeApi.collection(signal),
    staleTime: 60_000,
  });
}

/** 04 "뱃지 획득!" 카드용. 판정은 서버가 했고 여기서는 언제 받았는지만 본다. */
export function earnedOn<T extends { earned: boolean; earnedAt: string | null }>(
  badges: T[],
  isoDate: string,
): T[] {
  return badges.filter((badge) => badge.earned && badge.earnedAt?.startsWith(isoDate) === true);
}
