---
name: api-design
description: REST API 엔드포인트를 새로 만들거나 기존 API를 리뷰·문서화할 때. URL/메서드/상태 코드 규칙, 공통 응답과 에러 코드 체계, 목록 조회(무한 스크롤은 커서 페이징, 관리 화면은 오프셋), 정렬/필터 파라미터, 버저닝, 멱등성 키, 프론트 전달용 API 명세 형식을 정한다. "API 설계", "엔드포인트 추가", "응답 포맷", "에러 코드", "페이징", "커서", "API 명세" 요청에 사용. spring-code-review와 deliverable-write가 참조한다.
---

# REST API 설계 (api-design)

## 목적

**한 프로젝트 안의 모든 API가 같은 모양**이 되도록 URL, 상태 코드, 응답 봉투, 에러 코드, 목록 조회 파라미터를 하나로 정한다. 새 엔드포인트는 이 문서를 보고 만들고, 리뷰는 이 문서 기준으로 본다. 기본 스택: Spring Boot 4.x (`spring-boot-starter-webmvc`). 형식은 프레임워크와 무관하다.

## 언제 적용

컨트롤러 엔드포인트 추가/변경, 응답 DTO·에러 응답·예외 핸들러 작성, 목록/검색/무한 스크롤 API, 프론트/외부 전달 API 명세(`deliverable-structure`의 `api/` 문서), API 리뷰에서 "왜 이렇게 했지"가 나올 때.

## 1. URL과 메서드

- **복수 명사, kebab-case, 소문자**: `/api/articles`, `/api/deletion-requests`. 동사 금지.
- 계층은 소유 관계일 때만 2단계까지(`/api/articles/{articleId}/comments`). 3단계 이상은 하위 리소스를 최상위로.
- 식별자는 경로, 필터/옵션은 쿼리. 접두사 `/api`로 정적 자원·`/actuator`와 구분.
- 도메인 패키지명과 리소스명을 맞춘다(`app/articleDeletionRequest` -> `/api/article-deletion-requests`). `deliverable-sync` 인덱스 매칭이 쓴다.

| 메서드 | 용도 | 멱등 | 요청 바디 | 성공 코드 |
|---|---|---|---|---|
| `GET` | 조회 | O | 없음 | 200 |
| `POST` | 생성, 또는 리소스로 표현 안 되는 액션 | X | O | 201 (생성) / 200 (액션) |
| `PUT` | 전체 교체 | O | O | 200 |
| `PATCH` | 부분 수정 | 조건부 | O | 200 |
| `DELETE` | 삭제 | O | 없음 | 204 |

- 부분 수정은 `PATCH`(`PUT`은 빠진 필드가 null로 덮임).
- **상태 변경 액션**(승인, 취소, 송고, 잠금)은 `POST /api/articles/{id}/publish` - 리소스 뒤에 동사 하나. `PATCH`로 `status` 직접 변경 금지. 전이 규칙은 엔티티 메서드(`ddd-spring`), 액션 이름 = `deliverable-write` 액션 목록.
- 토글은 액션 두 개(`POST .../confirm`, `POST .../unconfirm` 또는 `DELETE .../confirmation`). 조회 파라미터가 URL 길이를 넘거나 민감하면 `POST /api/articles/search`(예외는 `search` 하나만).
- 파일 업로드는 `POST /api/files`(multipart) -> 파일 ID -> 본 요청에 ID. 본 요청에 multipart를 섞지 않는다.

## 2. 상태 코드

| 코드 | 언제 | 바디 |
|---|---|---|
| 200 | 조회, 수정, 액션 성공 | 응답 봉투 |
| 201 | 생성 성공 | 생성된 리소스(최소 `id`) + `Location` 헤더 |
| 204 | 삭제 성공, 바디 없는 성공 | 없음 |
| 400 | 요청 형식 오류: 파싱 실패, 필수 누락, 타입 불일치, 검증 실패 | 에러 봉투 + `errors[]` |
| 401 | 인증 없음/만료 | 에러 봉투 |
| 403 | 인증됐지만 권한 없음 | 에러 봉투 |
| 404 | 리소스 없음. **남의 리소스도 404** | 에러 봉투 |
| 409 | 상태 충돌: 이미 확인된 요청, 중복 생성, 낙관적 락 실패 | 에러 봉투 |
| 422 | 형식은 맞지만 비즈니스 규칙 위반: 재고 부족, 마감 지남, 상태 전이 불가 | 에러 봉투 |
| 429 | 요청 제한 | `Retry-After` 헤더 |
| 500 | 처리되지 않은 서버 오류 | 에러 봉투 (내부 정보 없이, `traceId`만) |

- **400(프론트 버그)과 422(사용자에게 보여줄 메시지)를 나눈다.** 409는 재조회 후 재시도 가능, 422는 재시도해도 안 됨. 비즈니스 오류를 200 + `success: false`로 내리지 않는다. 500에 스택 트레이스/SQL/클래스명 금지.

## 3. 응답 봉투 (전 엔드포인트 동일)

- 성공: `{ "data": ..., "meta": { "traceId": "..." } }`. 단건은 `data` 객체, 목록은 배열 + `meta`에 페이징. `meta.traceId`는 항상(`rca-procedure`). 204는 봉투 없음. 봉투 없는 방식도 가능하나 **한 프로젝트 안에서 하나만**. 이 문서 기준은 봉투.
- 실패: `{ "error": { "code", "message", "errors": [ { "field", "reason", "message" } ] }, "meta": { "traceId" } }`. `code`는 기계용 대문자 스네이크, `message`는 사용자용 한국어. `errors[]`는 400 검증 실패에만.
- `ProblemDetail`(RFC 9457)을 써도 된다. `code`/`traceId`를 확장 필드로, 성공 봉투와 키 이름 겹치지 않게. 프로젝트 시작 시 둘 중 하나로 정하고 섞지 않는다.
- **에러 코드 체계**: `ErrorCode` enum이 `<도메인>_<사유>` 이름 + 상태 코드 + 기본 메시지를 소유(공통은 `COMMON_` 접두사). 예외 -> 코드 매핑은 `@RestControllerAdvice` 한 곳. 도메인 예외는 `throw new BusinessException(ErrorCode.XXX)`, 동적 메시지는 `withMessage(...)`. 문서의 에러 표는 이 enum에서 생성/대조. 코드는 삭제하지 않고 `@Deprecated`.

## 4. 목록 조회

| | 커서 (keyset) | 오프셋 |
|---|---|---|
| 용도 | **무한 스크롤, 피드, 타임라인, 알림 목록** (기본) | 관리 화면 표, "전체 N건 중 M페이지" |
| 파라미터 | `cursor`, `size` | `page`, `size` |
| 응답 meta | `nextCursor`, `hasNext` | `page`, `size`, `totalElements`, `totalPages` |

- **앱 사용자 화면은 커서, 관리자 화면은 오프셋.** 둘 다 필요하면 한 엔드포인트에서 파라미터로 구분(`cursor` vs `page`). 성능 배경은 `jpa-query-optimization` 페이징 절.
- 커서: **불투명 문자열**(정렬 키 값 Base64). 내용 = **정렬 컬럼 값 + 유일 키**(`(createdAt, id)`). 쿼리는 `WHERE (created_at, id) < (:c, :id) ORDER BY ... LIMIT :size + 1`, **size+1 조회**로 `hasNext` 판정, count 쿼리 없음. `(created_at, id)` 복합 인덱스 필수. `hasNext=false`면 `nextCursor=null`. 필터/정렬 바뀌면 첫 페이지부터. `size` 기본 20, 최대 100(넘으면 100으로 잘라 준다). 잘못된 커서는 400 `COMMON_INVALID_CURSOR`.
- 오프셋: `page`는 0부터(`Pageable`과 일치). `meta`에 `page`, `size`, `totalElements`, `totalPages`. count가 무거우면 `Slice`로 바꾸고 문서에 명시. `size` 최대 100, 오프셋 10,000 초과는 커서 유도 또는 400.
- 정렬: `sort=createdAt,desc`, 여러 개는 반복. **허용 컬럼 화이트리스트**, 그 외 400.
- 필터: 필드명 그대로(`status=PUBLISHED`, `from`/`to` - 기본 `from` 포함, `to` 불포함). 다중 값은 쉼표 또는 반복(프로젝트에서 하나로). 검색어 `q=`. 필터 파라미터는 record(`ArticleSearchCond`)로, `@RequestParam` 나열 금지.

## 5. 요청/응답 필드 규칙

- JSON 키 **camelCase**. 날짜/시간은 **ISO 8601 + 시간대**(`2026-09-08T19:50:00+09:00`), 서버는 `OffsetDateTime`/`Instant`. `LocalDateTime`을 API 경계에 두지 않는다(`rca-procedure` 단골). 날짜만은 `2026-09-08`.
- ID는 문자열이 안전(JS 2^53). snowflake/UUID는 반드시 문자열. enum은 문자열 상수, 숫자 코드 금지. 금액은 정수 또는 문자열 decimal, 부동소수 금지.
- 목록은 없어도 `[]`. 선택 필드는 `null`(크기 문제면 프로젝트 차원 `NON_NULL`). 부울 필드는 `isXxx` 대신 `xxx`(`published`).
- 응답 DTO는 엔티티가 아니다(`ddd-spring`). `XxxResponse.from(entity)`, 화면에 필요한 것만. 요청 DTO에 서버 결정 값(`id`, `createdAt`, `createdBy`)이 오면 400.

## 6. 버저닝

- **URL 접두사 `/api/v1/`**. 헤더 버저닝 지양. 버전 상승은 **호환 깨지는 변경**(필드 삭제/이름 변경, 타입 변경, 상태 코드 의미 변경, 필수 파라미터 추가)만. **필드 추가는 버전을 올리지 않는다**(프론트는 모르는 필드 무시).
- v2를 만들면 v1은 최소 한 배포 주기 유지, 폐기 예정일 문서화, `Deprecation`/`Sunset` 헤더. 엔드포인트 하나 때문에 전체 v2 금지. Boot 4 `@GetMapping(version = "1")`을 쓰면 URL 접두사와 둘 중 하나로 통일.

## 7. 멱등성

- `GET`/`PUT`/`DELETE`는 멱등. `DELETE` 두 번째는 **204**(예외적으로 404면 문서에 명시).
- 두 번 실행되면 안 되는 `POST`(주문/결제, 송고/출고, 알림 발송, 업로드 완료)는 `Idempotency-Key` 헤더(UUID). 서버는 `(userId, key)`로 24시간 저장, 같은 키면 **처음 응답 그대로**, 처리 중 재요청은 409. 단순 CRUD 생성은 unique 제약(409).
- 액션 엔드포인트는 상태 검사로 자연 멱등. 이미 처리됨 -> 200 또는 409를 **프로젝트에서 하나로**. 이 문서 기준은 409.
- 모바일 등 재시도 클라이언트는 타임아웃 후 같은 키로 재요청하도록 프론트 규칙에 명시.

## 8. 그 외 규칙

- 인증 `Authorization: Bearer <token>`, 쿼리스트링 토큰 금지(`spring-auth`). CORS 허용 도메인은 설정값(`config-and-secrets`), `*` 금지. `/actuator/health`만 공개, 나머지 `/actuator/**`는 인증.
- 바디 최대 1MB(파일 제외), 목록 `size` 최대 100, 초과 413/400. 응답 압축 켬. 변경 적은 조회는 `Cache-Control: max-age` + `ETag`, 나머지 `no-store`. Rate limit은 로그인/검색/외부 API 호출에, 초과 429 + `Retry-After`.
- 소프트 삭제면 조회는 삭제 제외 기본, `includeDeleted=true`는 관리자만. 대량 작업 `POST .../bulk-publish`, 부분 성공은 200 + `succeeded[]`/`failed[]`, 전부 실패만 4xx. 비동기는 202 + `jobId`, `GET /api/jobs/{jobId}`, `retryAfterSeconds` 힌트.

## 9. API 명세 형식 (프론트/외부 전달용)

`deliverable-structure`의 `api/YYYY-MM-DD-<기능>-API-명세.md`, 템플릿 `templates/api-명세.md`. 명세에 반드시: 1) 공통 절(base URL, 인증, 응답 봉투, `ErrorCode` 에러 표, 페이징 규칙, 날짜 형식) 2) 엔드포인트마다 메서드+경로, 권한, 요청 표, 응답 표, 에러 코드, **실제 JSON 예시 + curl** 3) 변경 이력 4) springdoc-openapi 생성을 우선, 어긋나면 코드가 맞다.

## 10. 컨트롤러 작성 체크 (리뷰 기준)

`spring-code-review`의 API 절이 이 목록을 본다.

- [ ] URL이 복수 명사 kebab-case이고 동사가 없다 (액션 엔드포인트 제외)
- [ ] 메서드와 상태 코드가 1~2장 표와 맞다. 생성은 201 + `Location`
- [ ] 응답이 공통 봉투를 쓴다. 엔티티를 직접 반환하지 않는다
- [ ] 예외가 `ErrorCode`로 매핑되고 `@RestControllerAdvice` 한 곳에서 변환된다
- [ ] 400과 422가 구분된다
- [ ] 목록 API에 페이징이 있고, 무한 스크롤은 커서, `size` 상한이 있다
- [ ] 정렬 컬럼이 화이트리스트다
- [ ] 날짜가 오프셋 포함 ISO 8601이다
- [ ] 요청 DTO에 `@Valid`, 서버 결정 필드를 받지 않는다
- [ ] 중복 실행이 위험한 POST에 `Idempotency-Key` 또는 unique 제약이 있다
- [ ] 필터 파라미터가 record로 묶여 있다
- [ ] 새/변경 엔드포인트가 API 명세(또는 OpenAPI)에 반영됐다

## 하지 말 것

- 비즈니스 실패를 200 + `success: false`로. 엔드포인트마다 다른 응답 모양. `PUT`으로 부분 수정. `PATCH` 바디 `status`로 상태 변경(액션 엔드포인트로).
- 커서에 유일 키 누락. 커서 페이징에 count 쿼리. 무한 스크롤에 오프셋. 정렬 파라미터 검증 없이 ORDER BY.
- `LocalDateTime`을 API 경계에. 큰 정수 ID를 JS에(snowflake/UUID는 문자열).
- 필드 추가로 v2 생성. 반대로 필드 이름 변경에 버전 유지. 500에 스택 트레이스. 남의 리소스에 403(404로).

## 관련 스킬

`transaction-and-concurrency`(멱등성 키를 받는 쪽의 동시성 처리), `external-api-client`(우리가 남의 API를 부를 때), `ddd-spring`(액션 엔드포인트와 상태 전이 메서드, DTO 위치), `jpa-query-optimization`(커서 쿼리·인덱스), `spring-auth`(인증 헤더, 401/403), `config-and-secrets`(CORS), `deliverable-structure`/`deliverable-write`(`api/` 명세와 액션 문서), `frontend-api-client`(이 계약을 클라이언트에서 받는 쪽), `file-upload-storage`(업로드 API와 멱등성 키), `notification`(알림 설정·알림함 API).

## 더 보기
- 이유, 예시 코드, 상세 표, 참고 링크: `reference.md` (판단이 안 서거나 처음 적용할 때만 읽는다)
