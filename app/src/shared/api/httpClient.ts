import { ApiError } from './ApiError';
import type { ApiEnvelope, ApiErrorBody } from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
/** 인증 전 임시 사용자 헤더. spring-auth 적용 시 Authorization 인터셉터로 교체 */
const DEV_USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID ?? '1';
const TIMEOUT_MS = 10_000;

type Options = {
  method?: 'GET' | 'POST';
  body?: unknown;
  signal?: AbortSignal;
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
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': DEV_USER_ID,
      },
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
      headers: { 'X-User-Id': DEV_USER_ID },
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
