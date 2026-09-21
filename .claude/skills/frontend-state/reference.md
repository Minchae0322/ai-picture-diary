# frontend-state - 참고

SKILL.md의 절 번호와 같은 순서. 코드는 React + TanStack Query v5 기준, Vue는 마지막 절.

## 0. 왜 서버 상태를 스토어에 넣으면 안 되는가

스토어에 API 응답을 복사하는 순간 그 데이터는 두 군데(서버, 스토어)에 있고, 다음 질문에 전부 손으로 답해야 한다: 언제 다시 가져오나, 다른 화면이 바꾸면 어떻게 알리나, 두 화면이 동시에 요청하면 두 번 가나, 오래된 데이터를 언제 버리나, 로딩과 에러는 어디에 두나. TanStack Query는 이 질문들이 라이브러리의 존재 이유다. 스토어에 넣는다는 건 그걸 전부 직접 다시 만들겠다는 뜻이다.

## 2. 쿼리 키 팩토리

```ts
// features/article/model/articleQueryKeys.ts
export const articleKeys = {
  all: ['article'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  list: (filter: ArticleFilter) => [...articleKeys.lists(), filter] as const,
  details: () => [...articleKeys.all, 'detail'] as const,
  detail: (id: number) => [...articleKeys.details(), id] as const,
};
```

- `all`로 전부, `lists()`로 목록만, `detail(id)`로 하나만 무효화할 수 있다.
- `filter`는 `{ keyword: string; status?: ArticleStatus; cursor?: string }`처럼 직렬화 가능한 값만.

## 1. 훅 래핑

```ts
// features/article/hooks/useArticles.ts
export function useArticles(filter: ArticleFilter) {
  return useQuery({
    queryKey: articleKeys.list(filter),
    queryFn: () => articleApi.getArticles(filter),   // frontend-api-client
    staleTime: 30_000,
    select: data => ({ ...data, items: data.items.map(toArticleSummary) }),
  });
}

export function useArticle(id: number | undefined) {
  return useQuery({
    queryKey: articleKeys.detail(id!),
    queryFn: () => articleApi.getArticle(id!),
    enabled: id !== undefined,
    staleTime: 60_000,
  });
}
```

### 무한 스크롤 (커서 페이징)

`api-design`의 커서 응답(`meta.nextCursor`, `meta.hasNext`)과 짝이다.

```ts
export function useArticleFeed(filter: Omit<ArticleFilter, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: articleKeys.list(filter),
    queryFn: ({ pageParam }) => articleApi.getArticles({ ...filter, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => (last.meta.hasNext ? last.meta.nextCursor : undefined),
    staleTime: 30_000,
  });
}
```

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useArticleFeed(filter);
const items = data?.pages.flatMap(p => p.data) ?? [];
// IntersectionObserver로 마지막 요소가 보이면 fetchNextPage()
```

## 3. 변경과 무효화

```ts
// features/article/hooks/useCreateArticle.ts
export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateArticleRequest) => articleApi.createArticle(req),
    onSuccess: created => {
      queryClient.setQueryData(articleKeys.detail(created.id), created);   // 상세는 바로
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });   // 목록은 무효화
    },
  });
}

// 다른 feature에 영향을 주는 변경
export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: orderApi.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: stockKeys.all });   // 재고도. 여기 적어두는 게 규칙
    },
  });
}
```

### 낙관적 업데이트 (롤백 포함)

```ts
export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => articleApi.toggleLike(id),
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: articleKeys.detail(id) });
      const previous = queryClient.getQueryData<Article>(articleKeys.detail(id));
      queryClient.setQueryData<Article>(articleKeys.detail(id), old =>
        old && { ...old, liked: !old.liked, likeCount: old.likeCount + (old.liked ? -1 : 1) });
      return { previous };
    },
    onError: (_e, id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(articleKeys.detail(id), ctx.previous);   // 롤백
    },
    onSettled: (_d, _e, id) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(id) });
    },
  });
}
```

`onMutate` -> `onError` 롤백 -> `onSettled` 재조회. 이 세 개가 다 있어야 낙관적 업데이트다. 하나라도 없으면 그냥 버그다.

## 4. 로딩과 에러

```tsx
function ArticleList() {
  const { data, isPending, isFetching, error } = useArticles(filter);

  if (isPending) return <ArticleListSkeleton />;            // 처음 로딩
  if (error) return <ErrorBox error={error} onRetry={refetch} />;
  if (data.items.length === 0) return <Empty />;

  return (
    <div aria-busy={isFetching}>                            {/* 재조회는 은은하게 */}
      {isFetching && <TopProgressBar />}
      {data.items.map(...)}
    </div>
  );
}
```

에러 바운더리 + `throwOnError`:

```tsx
// 예상 못 한 에러(500 등)만 바운더리로, 처리 가능한 에러는 컴포넌트에서
useQuery({
  ...,
  throwOnError: error => error instanceof ApiError && error.status >= 500,
});
```

```tsx
<ErrorBoundary fallback={<PageError />}>
  <ArticleList />
</ErrorBoundary>
```

## 5. Zustand 스토어

```ts
// shared/store/useSessionStore.ts
type SessionState = {
  user: SessionUser | null;
  accessToken: string | null;         // 메모리에만. persist 대상 아님
  setSession: (user: SessionUser, token: string) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>()(set => ({
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => set({ user, accessToken }),
  clear: () => set({ user: null, accessToken: null }),
}));

// 선택자로 조각만 구독
const user = useSessionStore(s => s.user);
```

```ts
// 영속화는 민감하지 않은 것만
export const useUiStore = create<UiState>()(
  persist(
    set => ({ theme: 'system', sidebarOpen: true, setTheme: theme => set({ theme }) }),
    { name: 'ui', partialize: s => ({ theme: s.theme, sidebarOpen: s.sidebarOpen }) },
  ),
);
```

## 6. URL 필터 훅

```ts
// features/article/hooks/useArticleListFilter.ts
const DEFAULT: ArticleFilter = { keyword: '', status: undefined, sort: 'latest' };

export function useArticleListFilter() {
  const [params, setParams] = useSearchParams();

  const filter: ArticleFilter = {
    keyword: params.get('q') ?? DEFAULT.keyword,
    status: toArticleStatus(params.get('status')) ?? DEFAULT.status,
    sort: (params.get('sort') as ArticleSort) ?? DEFAULT.sort,
  };

  const update = (patch: Partial<ArticleFilter>) =>
    setParams(prev => {
      const next = new URLSearchParams(prev);
      const merged = { ...filter, ...patch };
      merged.keyword ? next.set('q', merged.keyword) : next.delete('q');   // 기본값은 URL에서 제거
      merged.status ? next.set('status', merged.status) : next.delete('status');
      merged.sort !== DEFAULT.sort ? next.set('sort', merged.sort) : next.delete('sort');
      return next;
    });

  return { filter, update };
}
```

이 훅의 `filter`를 그대로 `useArticles(filter)`에 넘기면 URL이 바뀔 때 쿼리 키가 바뀌고 자동으로 재조회된다. 스토어도 `useEffect`도 필요 없다.

## Vue 대응

| React | Vue 3 |
|---|---|
| `@tanstack/react-query` | `@tanstack/vue-query` (같은 개념, `useQuery`에 `ref`/`computed`를 넘기면 반응) 또는 Pinia Colada |
| Zustand | Pinia (`defineStore`, setup 문법 권장) |
| `useSearchParams` | `useRoute().query` + `router.replace({ query })` |
| `ErrorBoundary` | `onErrorCaptured` 또는 `<Suspense>` + 상위 처리 |

```ts
// Vue - 쿼리 키에 반응형 값
const filter = computed(() => ({ keyword: route.query.q ?? '' }));
const { data } = useQuery({
  queryKey: computed(() => articleKeys.list(filter.value)),
  queryFn: () => articleApi.getArticles(filter.value),
  staleTime: 30_000,
});
```

Pinia 스토어에 API 응답을 넣는 관행이 Vue 진영에 오래 있었다. 같은 이유로 권장하지 않는다. Pinia는 세션·UI·설정만.

## 참고

- TanStack Query - Important Defaults: https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
- TanStack Query - Query Keys: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
- TanStack Query - Optimistic Updates: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
- TkDodo - Practical React Query (키 팩토리, staleTime 논의의 원전): https://tkdodo.eu/blog/practical-react-query
- Zustand: https://zustand.docs.pmnd.rs/
- Pinia: https://pinia.vuejs.org/
