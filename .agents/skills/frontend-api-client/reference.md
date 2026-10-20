# frontend-api-client - 참고

SKILL.md의 절 번호와 같은 순서. 의존성 없는 `fetch` 래퍼 기준, axios는 마지막 절.

## 3. ApiError

```ts
// shared/api/ApiError.ts
export type FieldError = { field: string; reason: string; message: string };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly errors: FieldError[] = [],
    public readonly traceId: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static network(cause: unknown) {
    return new ApiError(0, 'NETWORK_ERROR', '네트워크 연결을 확인해 주세요.', [], null);
  }
  static timeout() {
    return new ApiError(0, 'TIMEOUT', '응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.');
  }
  static invalidResponse(status: number) {
    return new ApiError(status, 'INVALID_RESPONSE', '서버 응답을 해석할 수 없습니다.');
  }

  /** 폼 필드별 에러 맵으로 */
  fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.errors.map(e => [e.field, e.message]));
  }
}
```

## 1. fetch 래퍼

```ts
// shared/api/httpClient.ts
import { ApiError } from './ApiError';
import { getAccessToken, refreshAccessToken, clearSession } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const DEFAULT_TIMEOUT = 10_000;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;                 // 객체면 JSON, FormData면 그대로
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  idempotencyKey?: string;
  _retried?: boolean;             // 401 재시도 1회 표시 (내부용)
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, headers = {}, signal, timeoutMs = DEFAULT_TIMEOUT, idempotencyKey } = options;

  const url = new URL(path, BASE_URL);
  Object.entries(query ?? {}).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), timeoutMs);
  signal?.addEventListener('abort', () => controller.abort(signal.reason));

  const isFormData = body instanceof FormData;
  const token = getAccessToken();

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',                                 // 리프레시 쿠키
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        'X-Request-Id': crypto.randomUUID(),
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (controller.signal.reason?.name === 'TimeoutError') throw ApiError.timeout();
    if (signal?.aborted) throw e;                              // 호출자 취소는 그대로
    throw ApiError.network(e);
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 && !options._retried && !path.includes('/auth/refresh')) {
    const refreshed = await refreshAccessToken();              // 단일화된 리프레시
    if (refreshed) return request<T>(path, { ...options, _retried: true });
    clearSession();
    throw new ApiError(401, 'AUTH_EXPIRED', '다시 로그인해 주세요.');
  }

  if (response.status === 204) return undefined as T;

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw ApiError.invalidResponse(response.status);
  }

  if (!response.ok) {
    const b = json as { error?: { code: string; message: string; errors?: FieldError[] }; meta?: { traceId?: string } };
    throw new ApiError(
      response.status,
      b.error?.code ?? 'UNKNOWN',
      b.error?.message ?? '요청을 처리하지 못했습니다.',
      b.error?.errors ?? [],
      b.meta?.traceId ?? null,
    );
  }

  return (json as { data: T }).data;                           // 봉투 벗기기
}

// 목록용 - meta가 필요하므로 봉투를 통째로
export async function requestPage<P>(path: string, options: RequestOptions = {}): Promise<P> {
  // request()와 같되 마지막 줄만 `return json as P;`
}
```

- `credentials: 'include'`는 리프레시 쿠키를 보내기 위해 필요하다. 서버 CORS에 `allowCredentials`가 있어야 한다(`config-and-secrets`).
- `_retried`가 401 무한 루프를 막는다. 리프레시 경로 자체도 제외한다.
- 요청 타임아웃과 호출자의 `signal`을 하나의 `AbortController`로 합친다.

## 4. 리프레시 단일화

```ts
// shared/api/auth.ts
import { useSessionStore } from '@/shared/store/useSessionStore';

let refreshing: Promise<boolean> | null = null;

export const getAccessToken = () => useSessionStore.getState().accessToken;
export const clearSession = () => useSessionStore.getState().clear();

export function refreshAccessToken(): Promise<boolean> {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => { refreshing = null; });
  }
  return refreshing;                                           // 동시 401은 같은 Promise를 기다린다
}

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(new URL('/api/v1/auth/refresh', import.meta.env.VITE_API_BASE_URL), {
      method: 'POST',
      credentials: 'include',                                  // HttpOnly 리프레시 쿠키
    });
    if (!res.ok) return false;
    const { data } = await res.json();
    useSessionStore.getState().setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}
```

세 요청이 거의 동시에 401을 받으면 첫 번째만 리프레시를 호출하고 나머지 둘은 그 Promise를 기다린다. 리프레시 토큰 회전(`spring-auth` 4장)이 켜져 있으면 두 번째 리프레시 요청은 "재사용 감지"로 세션 전체가 끊기므로, 이 단일화 없이는 다중 탭·동시 요청에서 사용자가 이유 없이 로그아웃된다.

## 2·6. API 함수와 커서 페이징

```ts
// features/article/api/articleApi.ts
import { request, requestPage } from '@/shared/api/httpClient';
import type { CursorPage } from '@/shared/api/types';
import type { Article, ArticleFilter, CreateArticleRequest } from './articleTypes';

export const articleApi = {
  getArticles: (filter: ArticleFilter, signal?: AbortSignal) =>
    requestPage<CursorPage<Article>>('/api/v1/articles', {
      query: { q: filter.keyword || undefined, status: filter.status, sort: filter.sort, cursor: filter.cursor, size: 20 },
      signal,
    }),

  getArticle: (id: number, signal?: AbortSignal) =>
    request<Article>(`/api/v1/articles/${id}`, { signal }),

  createArticle: (req: CreateArticleRequest) =>
    request<Article>('/api/v1/articles', { method: 'POST', body: req }),

  publish: (id: number, idempotencyKey: string) =>
    request<Article>(`/api/v1/articles/${id}/publish`, { method: 'POST', idempotencyKey }),
};
```

- URL과 메서드는 이 파일에만 있다. 훅은 `articleApi.getArticles(filter, signal)`만 안다.
- `signal`은 TanStack Query의 `queryFn: ({ signal }) => articleApi.getArticles(filter, signal)`에서 온다. 검색어가 바뀌면 이전 요청이 취소된다.
- 액션 엔드포인트(`/publish`)는 `api-design` 3장의 `POST .../<동사>` 형태를 그대로 따른다.

### 폼 제출 멱등성 키

```ts
// 폼이 열릴 때 한 번 생성, 재시도에도 같은 키
const [idempotencyKey] = useState(() => crypto.randomUUID());
const publish = usePublishArticle();
<Button onClick={() => publish.mutate({ id, idempotencyKey })} disabled={publish.isPending} />
```

제출이 성공하거나 폼을 닫으면 키를 버린다. 성공 후 같은 키로 다시 보내면 서버는 처음 응답을 그대로 돌려준다(`api-design` 10장).

## 3. 에러 문구 매핑

```ts
// shared/api/errorMessages.ts
export const ERROR_MESSAGES: Partial<Record<string, string>> = {
  AUTH_EXPIRED: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
  ARTICLE_ALREADY_PUBLISHED: '이미 송고된 기사입니다.',
  // 서버 message를 그대로 써도 되는 코드는 등록하지 않는다
};

export const toUserMessage = (e: unknown) =>
  e instanceof ApiError ? (ERROR_MESSAGES[e.code] ?? e.message) : '알 수 없는 오류가 발생했습니다.';
```

```tsx
// 에러 화면에 traceId
<ErrorBox message={toUserMessage(error)} traceId={error instanceof ApiError ? error.traceId : null} />
```

## 7. 업로드

```ts
uploadImage: (file: File, onProgress?: (ratio: number) => void) =>
  new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();                         // 진행률은 fetch가 지원하지 않는다
    const form = new FormData();
    form.append('file', file);
    xhr.open('POST', new URL('/api/v1/uploads', BASE_URL));
    xhr.setRequestHeader('Authorization', `Bearer ${getAccessToken()}`);   // Content-Type은 지정하지 않는다
    xhr.timeout = 120_000;
    xhr.upload.onprogress = e => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => xhr.status < 300
      ? resolve(JSON.parse(xhr.responseText).data)
      : reject(new ApiError(xhr.status, 'UPLOAD_FAILED', '업로드에 실패했습니다.'));
    xhr.onerror = () => reject(ApiError.network(null));
    xhr.ontimeout = () => reject(ApiError.timeout());
    xhr.send(form);
  }),
```

## 8. MSW

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('*/api/v1/articles', () =>
    HttpResponse.json({ data: [fixtureArticle], meta: { traceId: 'mock', nextCursor: null, hasNext: false } })),
  http.post('*/api/v1/articles', () =>
    HttpResponse.json({ error: { code: 'COMMON_VALIDATION', message: '입력값을 확인해 주세요.',
      errors: [{ field: 'title', reason: 'NotBlank', message: '제목을 입력해 주세요.' }] }, meta: { traceId: 'mock' } },
      { status: 400 })),
];
```

Mock 응답도 **봉투 형식을 정확히** 지킨다. 형식이 다르면 실제 서버에 붙였을 때 처음 깨진다. 픽스처는 `docs/api/` 명세의 예시 응답을 그대로 쓴다.

## axios를 쓴다면

같은 구조를 인터셉터로 옮긴다.

- 요청 인터셉터: `Authorization`, `X-Request-Id`, FormData면 `Content-Type` 삭제.
- 응답 인터셉터: 성공이면 `response.data.data`를 반환, 실패면 `ApiError`로 변환해 `Promise.reject`.
- 401 재시도: 응답 인터셉터에서 `config._retried` 플래그 + 단일화된 `refreshAccessToken()`.
- 타임아웃: 인스턴스 `timeout` 옵션. 취소: `signal` 옵션(`CancelToken`은 deprecated).

## 참고

- MDN - fetch / AbortController: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- TanStack Query - Query Cancellation: https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation
- MSW: https://mswjs.io/docs/
- OWASP - HTML5 Security Cheat Sheet (Local Storage 절): https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
