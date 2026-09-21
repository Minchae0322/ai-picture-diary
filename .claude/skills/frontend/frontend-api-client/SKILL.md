---
name: frontend-api-client
description: 프론트엔드에서 백엔드 API를 호출하는 코드를 쓰거나 고칠 때 자동 적용. "API 호출", "axios", "fetch", "인터셉터", "토큰 갱신", "401 처리", "에러 처리", "응답 타입", "무한 스크롤 API", "업로드" 요청이나 HTTP 요청 코드가 새로 생기는 순간 트리거. api-design의 봉투/ErrorCode/커서 페이징/멱등성 키를 클라이언트에서 받는 규칙, 단일 HTTP 클라이언트 계층, ApiError 타입, 401 -> 리프레시 -> 재시도 흐름, 타임아웃과 취소, 요청 로그를 담는다.
---

# 프론트엔드 API 계층 (frontend-api-client)

## 목적

백엔드가 `api-design`대로 응답을 만들면, 프론트는 그것을 **한 곳에서 한 번만** 해석해야 한다. 봉투를 벗기고, 에러를 `ApiError`로 바꾸고, 401을 처리하고, 타임아웃을 거는 일이 컴포넌트마다 반복되면 API가 바뀔 때 전부 깨진다.

## 언제 적용

API 함수 추가/변경, HTTP 클라이언트 설정, 인증 토큰 처리, 에러 처리 코드, 파일 업로드, 무한 스크롤 연동, "가끔 401이 뜬다"·"에러 메시지가 화면마다 다르다" 같은 문제.

> **React Native / Expo라면** 이 스킬을 먼저 읽고, `expo-app-conventions`에서 달라지는 절만 덮어쓴다. 순서를 뒤집지 않는다.

## 1. 계층 구조

```
shared/api/
├── httpClient.ts     # 인스턴스 하나. baseURL, 타임아웃, 인터셉터, 봉투 해석
├── ApiError.ts       # 서버 에러 봉투 -> 예외 클래스
├── types.ts          # 봉투 타입: ApiResponse<T>, CursorPage<T>, OffsetPage<T>
└── auth.ts           # 토큰 보관·갱신 (httpClient만 사용)
features/<x>/api/
├── <x>Api.ts         # 엔드포인트별 함수. 반환은 봉투 벗긴 T
└── <x>Types.ts       # 요청/응답 타입
```

- **HTTP 클라이언트 인스턴스는 하나.** 컴포넌트·훅에서 `fetch`/`axios`를 직접 부르지 않는다.
- API 함수는 `features/<x>/api/`에. URL과 HTTP 메서드는 **여기에만** 나온다. 훅(`frontend-state`)은 함수 이름만 안다.
- API 함수는 **봉투를 벗긴 `T`를 반환**한다. 호출자가 `response.data.data`를 보지 않는다.
- 도구는 `fetch` 래퍼 또는 axios 중 프로젝트에 이미 있는 것. 없으면 의존성 없는 `fetch` 래퍼가 기본.

## 2. 봉투와 타입

`api-design` 5장과 1:1로 맞춘다.

```ts
type ApiResponse<T> = { data: T; meta: { traceId: string } };
type CursorPage<T>  = { data: T[]; meta: { traceId: string; nextCursor: string | null; hasNext: boolean } };
type OffsetPage<T>  = { data: T[]; meta: { traceId: string; page: number; size: number; totalElements: number; totalPages: number } };
type ApiErrorBody   = { error: { code: string; message: string; errors?: { field: string; reason: string; message: string }[] }; meta: { traceId: string } };
```

- 프로젝트가 봉투 없이 가기로 했으면(`api-design` 5장) 그 결정을 따라 이 타입만 바꾼다. 다른 계층은 몰라야 한다.
- 응답 타입은 **서버 명세(`docs/api/`)에서 한 번만** 정의한다. `frontend-architecture` 6장.
- 날짜는 ISO 8601 문자열로 받아 **표시 직전에** 변환한다. 타입에 `Date`를 쓰지 않는다(직렬화·쿼리 키 문제).

## 3. 에러

- 모든 실패는 `ApiError`로 통일한다: `status`, `code`(서버 `ErrorCode`), `message`(사용자용), `errors`(필드 에러), `traceId`.
- 네트워크 실패·타임아웃·파싱 실패도 `ApiError`로 감싼다(`code: 'NETWORK_ERROR'`, `'TIMEOUT'`, `'INVALID_RESPONSE'`). 호출자는 `instanceof ApiError` 하나만 검사한다.
- 분기는 **`code`로**, `message` 문자열 매칭 금지. `message`는 그대로 보여줘도 되는 사용자용 한국어(`api-design`).
- `code` -> 화면 문구/행동 매핑 표를 한곳(`shared/api/errorMessages.ts`)에 둔다. 서버 문구를 덮어쓸 때만 등록, 없으면 서버 `message` 그대로.
- 400/422의 `errors[]`는 폼 필드 에러로 매핑한다(`field` -> 입력창). 상단에 한 줄로 뭉개지 않는다.
- `traceId`는 에러 화면과 "문의하기"에 실어 보낸다. 사용자가 보내주면 `rca-procedure`로 바로 추적된다.
- 5xx와 예상 못 한 에러는 에러 바운더리로, 4xx는 호출한 곳에서(`frontend-state` 4장).

## 4. 인증

- 액세스 토큰은 **메모리**(스토어)에. `localStorage` 금지. 리프레시 토큰은 서버가 `HttpOnly` 쿠키로 준다(`spring-auth` 4장) - 프론트는 만지지 않는다.
- 요청 인터셉터가 `Authorization: Bearer`를 붙인다. API 함수는 토큰을 모른다.
- **401 처리 흐름**: 401 수신 -> 리프레시 요청(1회) -> 성공 시 원 요청 재시도 -> 실패 시 세션 정리 + 로그인 이동. 컴포넌트는 401을 보지 않는다.
- 동시에 여러 요청이 401을 받으면 **리프레시는 한 번만.** 진행 중인 리프레시 Promise를 공유하고 나머지는 기다렸다 재시도한다. 이걸 안 하면 리프레시 회전(`spring-auth`)에 걸려 전부 로그아웃된다.
- 리프레시 요청 자체가 401이면 재시도하지 않는다(무한 루프 방지).
- 403은 리프레시 대상이 아니다. 권한 없음 화면으로.

## 5. 타임아웃·취소·재시도

- 모든 요청에 타임아웃(기본 10초, 업로드·리포트는 별도). `AbortController`로 구현.
- 화면을 떠나거나 검색어가 바뀌면 이전 요청을 **취소**한다. TanStack Query는 `signal`을 넘겨주므로 API 함수가 받아서 `fetch`에 전달한다.
- 재시도는 GET에만, 네트워크 오류·5xx·타임아웃에만, 최대 2회 지수 백오프. POST 재시도는 `Idempotency-Key`가 있을 때만.
- 두 번 실행되면 안 되는 POST(주문, 결제, 송고)는 클라이언트가 UUID로 `Idempotency-Key`를 만들어 보낸다. 같은 폼 제출 재시도에는 **같은 키**를 재사용한다.

## 6. 페이징

- 목록 API는 커서 기본(`api-design` 6장). API 함수는 `cursor?: string`을 받고 `CursorPage<T>`를 반환한다. 무한 스크롤 훅은 `frontend-state` reference.
- 필터·정렬이 바뀌면 커서를 버리고 첫 페이지부터. 커서를 URL에 넣지 않는다(공유해도 의미 없음). 필터만 URL에.
- 오프셋 페이징(관리자 표)은 `page`, `size`를 URL에 두고 `OffsetPage<T>`로.
- `size`는 서버 최대치(100)를 넘기지 않는다.

## 7. 업로드·다운로드

- 업로드는 `FormData` + `Content-Type` 헤더를 **직접 지정하지 않는다**(브라우저가 boundary를 붙인다). JSON 기본 헤더가 인터셉터에 있으면 업로드 요청에서 제거한다.
- 큰 파일은 진행률(`onUploadProgress` 또는 `XMLHttpRequest`)과 취소를 제공한다. 타임아웃은 별도로 길게.
- 다운로드는 서버가 주는 `Content-Disposition` 파일명을 쓴다. 클라이언트가 이름을 지어내지 않는다.
- 업로드 완료 후 후속 API(`POST .../complete`)가 있으면 `Idempotency-Key`를 붙인다.

## 8. 로그와 개발 편의

- 개발 환경에서 요청/응답을 콘솔에 남기되 **토큰과 개인정보는 마스킹**한다. 운영 빌드에서는 제거.
- 요청마다 `X-Request-Id`(UUID)를 보내고 응답 `traceId`와 함께 에러 리포팅에 실는다. 서버 로그와 붙는다(`logging-observability`).
- Mock은 MSW로 API 함수 아래 계층에서. 컴포넌트에서 `if (dev) return fakeData` 하지 않는다.
- 환경별 `baseURL`은 빌드 환경변수(`VITE_API_BASE_URL`)로. 코드에 URL 하드코딩 금지. **시크릿은 프론트 환경변수에 넣지 않는다** - 빌드에 그대로 박힌다.

## 9. 리뷰 체크

- 컴포넌트·훅에서 `fetch`/`axios`를 직접 부르는가
- API 함수가 봉투를 벗겨 `T`를 반환하는가, URL이 API 함수 밖에 나오는가
- 에러가 `ApiError`로 통일됐는가, `message` 문자열로 분기하는가
- 401 처리에 리프레시 단일화(Promise 공유)가 있는가, 리프레시 401에 재시도 방지가 있는가
- 토큰이 `localStorage`에 있는가
- 타임아웃과 `signal` 전달이 있는가
- 중복 실행 위험 POST에 `Idempotency-Key`가 있는가
- 업로드 요청에 JSON `Content-Type`이 붙어 있지 않은가

## 하지 말 것

- 컴포넌트에서 직접 `fetch`, URL 하드코딩
- `response.data.data` 를 호출자가 벗기기
- `error.message === '...'` 분기
- 토큰 `localStorage` 저장, 리프레시 토큰을 JS로 다루기
- 401마다 각자 리프레시 (동시 요청 시 전부 로그아웃됨)
- 타임아웃 없는 요청, 취소 없는 검색 요청
- 멱등성 키 없이 POST 재시도
- 시크릿을 `VITE_*` 환경변수에

## 관련 스킬

`api-design`(봉투, ErrorCode, 커서, 멱등성 키 - 서버 쪽 계약), `spring-auth`(토큰 정책), `frontend-state`(훅에서 API 함수 사용, 401 이후 캐시 정리), `frontend-architecture`(타입 위치), `file-upload-storage`(서버 쪽 업로드 계약 - presigned 흐름), `logging-observability`(traceId), `rca-procedure`(traceId로 추적).

## 더 보기

`reference.md` - `fetch` 래퍼 구현, `ApiError` 클래스, 401 리프레시 단일화 코드, 커서 API 함수 예, 업로드 예, MSW 설정, axios 대응, 참고 링크.
