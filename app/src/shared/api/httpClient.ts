import { ApiError } from './ApiError';
import type { ApiEnvelope, ApiErrorBody } from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
/**
 * 개발용 탈출구. 값이 있으면 그 번호로 고정해 남의 데이터를 흉내 낼 수 있다(ADR 2026-10-20).
 * 비워 두면 기기 등록으로 받은 게스트 번호를 쓴다 - 그것이 실제 사용자가 걷는 길이다.
 */
const DEV_USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID;
const TIMEOUT_MS = 10_000;

/**
 * 현재 사용자 번호. 앱이 뜰 때 `AccountProvider` 가 한 번 넣는다.
 *
 * <p>헤더 값을 모듈 변수로 두는 이유는 호출부(기능별 api 파일)가 사용자 번호를 들고 다니지 않게 하려는 것이다 -
 * 인증이 붙으면 이 자리가 액세스 토큰으로 바뀌고 호출부는 그대로다(frontend-api-client 1장).
 */
let currentUserId: string | null = null;

export function setRequestUserId(userId: string | null): void {
  currentUserId = userId;
}

/** 인증 전 임시 사용자 헤더. spring-auth 적용 시 Authorization 인터셉터로 교체 */
function userIdHeader(): string {
  return DEV_USER_ID ?? currentUserId ?? '';
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** 사용자 번호를 받으러 가는 호출(기기 등록)만 true. 그 외에는 늘 헤더를 붙인다 */
  anonymous?: boolean;
};

/** HTTP 인스턴스는 하나. 화면/훅에서 fetch를 직접 부르지 않는다(frontend-api-client 1장). */
export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  options.signal?.addEventListener('abort', () => controller.abort());

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: options.anonymous
        ? { 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json', 'X-User-Id': userIdHeader() },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (e) {
    throw controller.signal.aborted ? ApiError.timeout() : ApiError.network();
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (payload && typeof payload === 'object' && 'error' in payload) {
      throw ApiError.fromBody(response.status, payload as ApiErrorBody);
    }
    throw ApiError.invalidResponse();
  }
  if (!payload || !('data' in payload)) {
    throw ApiError.invalidResponse();
  }
  // 봉투는 여기서만 벗긴다. 호출자는 T만 본다.
  return (payload as ApiEnvelope<T>).data;
}

export { BASE_URL };

/** 커서 목록은 meta가 필요해 봉투를 조금 다르게 벗긴다. */
export async function requestPage<T>(path: string, signal?: AbortSignal): Promise<{ items: T[]; nextCursor: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  signal?.addEventListener('abort', () => controller.abort());

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'X-User-Id': userIdHeader() },
      signal: controller.signal,
    });
  } catch {
    throw controller.signal.aborted ? ApiError.timeout() : ApiError.network();
  } finally {
    clearTimeout(timer);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (payload && typeof payload === 'object' && 'error' in payload) {
      throw ApiError.fromBody(response.status, payload as ApiErrorBody);
    }
    throw ApiError.invalidResponse();
  }
  if (!payload || !Array.isArray(payload.data)) {
    throw ApiError.invalidResponse();
  }
  return { items: payload.data as T[], nextCursor: payload.meta?.nextCursor ?? null };
}
