# frontend-architecture - 참고

SKILL.md의 절 번호와 같은 순서.

## 1. 폴더 구조 실제 예

```
src/
├── app/
│   ├── main.tsx
│   ├── router.tsx
│   ├── providers.tsx         # QueryClientProvider, ThemeProvider ...
│   └── styles/tokens.css     # design-system
├── features/
│   ├── article/
│   │   ├── api/
│   │   │   ├── articleApi.ts       # getArticles, getArticle, createArticle ...
│   │   │   └── articleTypes.ts     # Article, ArticleSummary, CreateArticleRequest
│   │   ├── components/
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── ArticleList.tsx
│   │   │   └── ArticleForm.tsx
│   │   ├── hooks/
│   │   │   ├── useArticles.ts      # TanStack Query 래핑
│   │   │   └── useArticleForm.ts
│   │   ├── model/
│   │   │   ├── articleStatus.ts    # 상태 전이 규칙, 라벨 매핑
│   │   │   └── articleQueryKeys.ts
│   │   └── index.ts
│   └── member/
├── shared/
│   ├── ui/                   # Button, Input, Modal, Skeleton ...
│   ├── hooks/                # useDebounce, useMediaQuery ...
│   ├── lib/                  # formatDate, cn ...
│   └── api/                  # httpClient, ApiError, 봉투 타입 (frontend-api-client)
└── pages/
    ├── ArticleListPage.tsx
    └── ArticleDetailPage.tsx
```

`index.ts` 예:

```ts
// features/article/index.ts - 밖에서 쓸 것만
export { ArticleList } from './components/ArticleList';
export { useArticles } from './hooks/useArticles';
export type { Article, ArticleSummary } from './api/articleTypes';
// ArticleCard, ArticleForm은 내보내지 않는다 - feature 내부 부품
```

이 파일이 feature의 경계다. 다른 feature가 `features/article/components/ArticleCard`를 직접 import하면 ESLint(`no-restricted-imports` 또는 `eslint-plugin-boundaries`)로 막는다.

### 왜 feature 기준인가

종류별 폴더(`components/`, `hooks/`, `types/`)는 화면이 10개일 때는 괜찮다. 30개가 넘으면 `components/` 안에 파일이 100개가 되고, 기능 하나를 고치려면 폴더 5개를 오간다. feature 기준이면 "게시글 관련은 전부 `features/article/` 안"이라 한 폴더에서 끝난다. 백엔드의 도메인 패키지 구조(`ddd-spring`)와 같은 논리다.

## 2. 컴포넌트 분리

### 나누기 전

```tsx
function ArticleListPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const { data, isLoading, error } = useQuery({ ... });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div>
      <input value={keyword} onChange={e => setKeyword(e.target.value)} />
      {data.items.length === 0 ? (
        <Empty />
      ) : (
        data.items.map(a => (
          <div key={a.id} onClick={() => setSelected(a.id)} className={selected === a.id ? 'active' : ''}>
            <h3>{a.title}</h3>
            <p>{a.author} · {formatDate(a.createdAt)}</p>
            {a.status === 'DRAFT' && <span>임시</span>}
            {/* ... 40줄 더 */}
          </div>
        ))
      )}
      <Pagination page={page} onChange={setPage} />
      {selected && <ArticleDetailPanel id={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
```

### 나눈 후

```tsx
// pages/ArticleListPage.tsx - 조합만
function ArticleListPage() {
  return (
    <PageLayout title="게시글">
      <ArticleList />
    </PageLayout>
  );
}

// features/article/components/ArticleList.tsx - 데이터 + 상태 + 조합
function ArticleList() {
  const { keyword, setKeyword, page, setPage } = useArticleListFilter();
  const { data, isLoading, error } = useArticles({ keyword, page });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (isLoading) return <ArticleListSkeleton />;
  if (error) return <ErrorBox error={error} />;
  if (data.items.length === 0) return <Empty action={<Button>첫 글 쓰기</Button>} />;

  return (
    <>
      <SearchInput value={keyword} onChange={setKeyword} />
      {data.items.map(a => (
        <ArticleCard key={a.id} {...toCardProps(a)} selected={a.id === selectedId} onSelect={setSelectedId} />
      ))}
      <Pagination page={page} onChange={setPage} />
      {selectedId && <ArticleDetailPanel id={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  );
}

// features/article/components/ArticleCard.tsx - props만 받아 그림
type Props = {
  id: number;
  title: string;
  authorName: string;
  createdAt: string;
  isDraft: boolean;
  selected: boolean;
  onSelect: (id: number) => void;
};
```

- 페이지는 레이아웃과 feature 조합만.
- `ArticleList`가 데이터·상태를 들고 있고, `ArticleCard`는 서버 응답 모양을 모른다(`toCardProps`로 변환).
- 로딩/에러/빈 상태가 조기 반환으로 위에 모여 정상 렌더링이 깔끔하다(`ui-fundamentals` 13장).

## 3. 불리언 props -> 열거형

```tsx
// 나쁜 예 - 조합이 폭발하고 모순 상태(isPrimary && isGhost)가 가능
<Button isPrimary isLarge isOutline />

// 좋은 예
<Button variant="primary" size="lg" />

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};
```

## 4. 훅 추출

```ts
// features/article/hooks/useArticleForm.ts
export function useArticleForm(initial?: Article) {
  const [values, setValues] = useState<ArticleFormValues>(toFormValues(initial));
  const [errors, setErrors] = useState<FormErrors>({});
  const create = useCreateArticle();   // frontend-state의 mutation 훅

  const setField = <K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) =>
    setValues(prev => ({ ...prev, [key]: value }));

  const submit = async () => {
    const result = validate(values);
    if (!result.ok) { setErrors(result.errors); return; }
    await create.mutateAsync(values, {
      onError: e => setErrors(fromServerErrors(e)),   // 422 필드 에러 매핑
    });
  };

  return { values, errors, setField, submit, isSubmitting: create.isPending };
}
```

- 반환이 객체라 호출부에서 필요한 것만 꺼내 쓴다.
- 폼 검증(클라이언트)과 서버 422(`api-design`)의 `errors[]`를 같은 `errors` 상태로 합친다.

## Vue 대응표

| React | Vue 3 | 비고 |
|---|---|---|
| `useState` | `ref` / `reactive` | 컴포저블 반환은 `ref` |
| `useMemo` / 파생값 | `computed` | Vue는 캐싱이 기본 |
| `useEffect` | `watch` / `watchEffect` / `onMounted` | 목적별로 나뉘어 있어 더 명확 |
| `useContext` | `provide` / `inject` | 타입은 `InjectionKey<T>` |
| props 콜백 `onSelect` | `emit('select', id)` | `defineEmits<{ select: [id: number] }>()` |
| `children` | `<slot>` | 이름 있는 슬롯은 `#header` |
| 커스텀 훅 `useX` | 컴포저블 `useX` | 폴더는 `composables/` |
| `React.memo` | 불필요 | 반응성 시스템이 의존 추적 |
| React Compiler | 불필요 | Vue는 컴파일 시점 최적화가 기본 |
| TanStack Query (React) | TanStack Query (Vue) 또는 Pinia Colada | `frontend-state` 참고 |
| Zustand | Pinia | Pinia가 공식 |

- Vue SFC는 `<script setup lang="ts">` 고정. Options API는 새 코드에 쓰지 않는다.
- `defineProps<Props>()`에 기본값은 `withDefaults`. Vue 3.5+에서는 구조분해 기본값(`const { size = 'md' } = defineProps<Props>()`)이 반응성을 유지한다.

## 6. tsconfig 권장

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": false,
    "verbatimModuleSyntax": true,
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- `noUncheckedIndexedAccess`는 배열/객체 인덱스 접근을 `T | undefined`로 만든다. 처음엔 귀찮지만 런타임 `undefined` 에러의 상당수를 컴파일 단계로 옮긴다.
- 경로 별칭 `@/`는 `features/article/...`처럼 상대 경로 지옥(`../../../`)을 없앤다.

### 서버 enum 폴백

```ts
export const ARTICLE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

// 서버가 새 값을 추가해도 화면이 깨지지 않게
export function toArticleStatus(raw: string): ArticleStatus | 'UNKNOWN' {
  return (ARTICLE_STATUSES as readonly string[]).includes(raw) ? (raw as ArticleStatus) : 'UNKNOWN';
}
```

백엔드 `db-schema-and-migration` 3장의 `UNKNOWN` 컨버터와 같은 발상이다. 양쪽 다 있어야 배포 순서에 상관없이 안전하다.

## 참고

- React 문서 - Thinking in React: https://react.dev/learn/thinking-in-react
- React 문서 - Versions: https://react.dev/versions
- Vue 문서 - Composition API FAQ: https://vuejs.org/guide/extras/composition-api-faq.html
- Feature-Sliced Design (구조 참고, 전부 따를 필요는 없음): https://feature-sliced.design/
- TypeScript - tsconfig reference: https://www.typescriptlang.org/tsconfig/
