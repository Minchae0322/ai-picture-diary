import type { ApiErrorBody } from './types';

/** 모든 실패는 이 타입 하나로 통일한다. 분기는 code로, message 문자열 매칭 금지. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly traceId?: string,
    readonly fieldErrors?: ApiErrorBody['error']['errors'],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromBody(status: number, body: ApiErrorBody): ApiError {
    return new ApiError(status, body.error.code, body.error.message, body.meta?.traceId, body.error.errors);
  }

  static network(message = '네트워크에 연결할 수 없어요.'): ApiError {
    return new ApiError(0, 'NETWORK_ERROR', message);
  }

  static timeout(): ApiError {
    return new ApiError(0, 'TIMEOUT', '응답이 너무 늦어요. 다시 시도해 주세요.');
  }

  static invalidResponse(): ApiError {
    return new ApiError(0, 'INVALID_RESPONSE', '알 수 없는 응답이에요.');
  }
}
