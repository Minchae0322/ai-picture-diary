import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Weather } from '@/shared/weather';
import { communityApi, type CommunityPost, type PostSort, type ReportReason } from '../api/communityApi';

export const communityKeys = {
  all: ['community'] as const,
  feed: (sort: PostSort, weathers: Weather[]) =>
    [...communityKeys.all, 'feed', sort, [...weathers].sort().join(',')] as const,
};

type FeedPage = { items: CommunityPost[]; nextCursor: string | null };

/** 08 무한 스크롤. 커서 페이징이라 offset 을 만들지 않는다. */
export function useFeed(sort: PostSort, weathers: Weather[]) {
  return useInfiniteQuery({
    queryKey: communityKeys.feed(sort, weathers),
    queryFn: ({ pageParam, signal }) =>
      communityApi.feed({ sort, weathers, cursor: pageParam ?? undefined }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor,
    staleTime: 30_000,
  });
}

/**
 * 좋아요 낙관적 업데이트. 실패하면 되돌린다. 서버는 멱등이라 연타해도 결과가 같고,
 * 여기서는 캐시만 뒤집으므로 이전 상태를 스냅샷으로 잡아 둔다(frontend-state 6장).
 */
export function useToggleLike(sort: PostSort, weathers: Weather[]) {
  const queryClient = useQueryClient();
  const key = communityKeys.feed(sort, weathers);

  return useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      liked ? communityApi.unlike(postId) : communityApi.like(postId),
    onMutate: async ({ postId, liked }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);

      queryClient.setQueryData(key, (old: { pages: FeedPage[]; pageParams: unknown[] } | undefined) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((post) =>
                  post.id === postId
                    ? {
                        ...post,
                        likedByMe: !liked,
                        likeCount: post.likeCount + (liked ? -1 : 1),
                      }
                    : post,
                ),
              })),
            }
          : old,
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/** 04 "공유" -> 08 피드. 성공하면 피드를 무효화해 새 글이 바로 보이게 한다. */
export function useSharePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (diaryId: string) => communityApi.share(diaryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useReportPost() {
  return useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: ReportReason }) =>
      communityApi.report(postId, reason),
  });
}
