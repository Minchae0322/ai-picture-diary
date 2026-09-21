/** 서버 응답 봉투. api-design 3장과 1:1 (frontend-api-client 2장) */
export type ApiEnvelope<T> = { data: T; meta: { traceId: string } };
export type CursorEnvelope<T> = {
  data: T[];
  meta: { traceId: string; nextCursor: string | null; hasNext: boolean };
};
export type ApiErrorBody = {
  error: { code: string; message: string; errors?: { field: string; reason: string; message: string }[] };
  meta: { traceId: string };
};
