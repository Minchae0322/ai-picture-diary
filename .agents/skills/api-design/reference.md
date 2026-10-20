# api-design - 참고 자료

`SKILL.md`의 규칙에 대한 이유, 예시 JSON/코드, 상세 표를 담는다. 절 번호는 SKILL.md와 같다.

## 목적 - 왜

엔드포인트마다 응답 모양이 다르면 프론트가 매번 새로 파싱하고, 에러 처리를 엔드포인트마다 따로 짜고, 문서가 코드와 어긋난다. 이 스킬은 한 프로젝트 안의 모든 API가 같은 모양이 되도록 URL, 상태 코드, 응답 봉투, 에러 코드, 목록 조회 파라미터를 하나로 정한다.

## 언제 적용 - 상세

- 컨트롤러에 엔드포인트를 추가하거나 바꿀 때
- 응답 DTO, 에러 응답, 예외 핸들러를 만들 때
- 목록/검색/무한 스크롤 API를 만들 때
- 프론트나 외부에 전달할 API 명세를 쓸 때 (`deliverable-structure`의 `api/` 문서)
- API 리뷰에서 "이건 왜 이렇게 했지"가 나올 때

## 1. URL과 메서드 - 이유

- 동사 금지의 예: `/getArticle`, `/createUser`.
- 계층 3단계 이상이면 하위 리소스를 최상위로 올린다: `/api/comments/{id}`.
- 식별자는 경로에, 필터/옵션은 쿼리에: `/api/articles/{id}`, `/api/articles?status=PUBLISHED`.
- 접두사 `/api`를 붙여 정적 자원, 헬스체크(`/actuator`)와 구분한다.
- 부분 수정에 `PUT`을 쓰면 빠진 필드가 null로 덮이는 사고가 난다.
- 상태 변경 액션을 `PATCH`로 `status`를 직접 바꾸게 하지 않는 이유: 상태 전이 규칙이 엔티티 메서드(`ddd-spring`)에 있어야 하고, 액션 이름이 곧 `deliverable-write`의 액션 목록이 된다.
- 토글(확인/취소)을 `{confirm: true|false}` 한 엔드포인트로 두면 문서화와 권한 분리가 어렵다. `POST .../confirm`, `POST .../unconfirm` 또는 `DELETE .../confirmation`으로 나눈다.
- 파일 업로드는 `POST /api/files` (multipart) -> 파일 ID 반환 -> 본 요청에 ID 포함. 본 요청에 multipart를 섞지 않는다.

## 2. 상태 코드 - 이유

- 404: 남의 리소스도 404로 내려 존재 여부를 노출하지 않는다.
- **400과 422를 나눈다.** 400은 "요청이 잘못 만들어짐"(프론트 버그), 422는 "요청은 맞는데 지금은 안 됨"(사용자에게 보여줄 메시지). 프론트가 이 둘을 다르게 처리한다.
- 409는 "다시 조회하고 재시도하면 될 수 있음", 422는 "재시도해도 안 됨". 낙관적 락 실패는 409.
- 비즈니스 오류를 200으로 감싸서 `success: false`로 내리지 않는다. HTTP 클라이언트, 프록시, 모니터링이 전부 성공으로 센다.
- 500에 스택 트레이스, SQL, 클래스명을 싣지 않는다. `traceId`만.

## 3. 응답 봉투 - 예시

### 성공

```json
{
  "data": { "id": 123, "title": "..." },
  "meta": { "traceId": "a1b2c3" }
}
```

- 단건은 `data`가 객체, 목록은 `data`가 배열 + `meta`에 페이징 정보(4장).
- `meta.traceId`는 항상. 장애 문의 때 프론트가 이 값을 넘기면 로그를 바로 찾는다(`rca-procedure`).
- 204는 봉투 없음.
- 봉투 없이 `data`만 내리는 방식도 가능하지만, 한 프로젝트 안에서 하나만 쓴다. 이 문서 기준은 봉투.

### 실패

```json
{
  "error": {
    "code": "ARTICLE_NOT_PUBLISHABLE",
    "message": "송고 상태의 기사만 출고할 수 있습니다.",
    "errors": [
      { "field": "title", "reason": "NOT_BLANK", "message": "제목은 필수입니다." }
    ]
  },
  "meta": { "traceId": "a1b2c3" }
}
```

- `code`는 **기계용** 상수(대문자 스네이크), `message`는 **사용자용** 한국어. 프론트는 `code`로 분기하고 `message`는 그대로 띄운다.
- `errors[]`는 400 검증 실패에만. 필드별 사유.
- 스프링의 `ProblemDetail`(RFC 9457)을 그대로 써도 된다. 그 경우 `type`/`title`/`status`/`detail`/`instance`에 `code`와 `traceId`를 확장 필드로 넣고, 성공 봉투와 키 이름이 겹치지 않게 한다. 프로젝트 시작 시 둘 중 하나로 정하고 섞지 않는다.

### 에러 코드 체계

```java
public enum ErrorCode {
    // 공통 (COMMON_)
    COMMON_INVALID_REQUEST(400, "요청 형식이 올바르지 않습니다."),
    COMMON_UNAUTHORIZED(401, "인증이 필요합니다."),
    COMMON_FORBIDDEN(403, "권한이 없습니다."),
    COMMON_NOT_FOUND(404, "대상을 찾을 수 없습니다."),
    COMMON_CONFLICT(409, "요청이 현재 상태와 충돌합니다."),
    COMMON_INTERNAL(500, "일시적인 오류가 발생했습니다."),

    // 도메인별 (<도메인>_<사유>)
    ARTICLE_NOT_FOUND(404, "기사를 찾을 수 없습니다."),
    ARTICLE_NOT_PUBLISHABLE(422, "송고 상태의 기사만 출고할 수 있습니다."),
    ARTICLE_LOCKED_BY_OTHER(409, "다른 사용자가 편집 중입니다."),
    DELETION_REQUEST_ALREADY_CONFIRMED(409, "이미 확인된 요청입니다.");

    private final int status;
    private final String defaultMessage;
}
```

- 코드 이름 = `<도메인>_<사유>`. 상태 코드와 기본 메시지를 enum이 소유한다. 예외 -> 코드 매핑이 한 곳(`@RestControllerAdvice`)에 모인다.
- 도메인 예외는 `ErrorCode`를 들고 던진다: `throw new BusinessException(ErrorCode.ARTICLE_NOT_PUBLISHABLE)`. 메시지에 동적 값이 필요하면 `withMessage(...)`.
- 새 코드 추가는 enum에 한 줄. 문서(`api/` 명세)의 에러 표는 이 enum에서 생성하거나 대조한다.
- 코드는 삭제하지 않고 `@Deprecated`로 남긴다. 프론트가 분기하고 있을 수 있다.

## 4. 목록 조회 - 상세

### 두 가지 페이징 비교

| | 커서 (keyset) | 오프셋 |
|---|---|---|
| 용도 | 무한 스크롤, 피드, 타임라인, 알림 목록 (기본) | 관리 화면 표, "전체 N건 중 M페이지" 표시가 필요할 때 |
| 파라미터 | `cursor`, `size` | `page`, `size` |
| 응답 meta | `nextCursor`, `hasNext` | `page`, `size`, `totalElements`, `totalPages` |
| 장점 | 뒤로 갈수록 느려지지 않음. 삽입/삭제 중에도 중복/누락 없음 | 임의 페이지 점프, 전체 개수 |
| 단점 | 임의 페이지 점프 불가, 전체 개수 없음 | OFFSET 커지면 느림. 삽입 중 중복/누락 |

앱 사용자 화면은 커서, 관리자 화면은 오프셋. 둘 다 필요하면 엔드포인트를 나누지 말고 파라미터로 구분한다(`cursor`가 오면 커서, `page`가 오면 오프셋). 성능 배경은 `jpa-query-optimization` 페이징 절.

### 커서 페이징 예시와 이유

```
GET /api/articles?size=20                        # 첫 페이지
GET /api/articles?size=20&cursor=eyJpZCI6MTIzfQ  # 다음 페이지
```

```json
{
  "data": [ ... 20건 ... ],
  "meta": {
    "size": 20,
    "hasNext": true,
    "nextCursor": "eyJpZCI6MTIzLCJjcmVhdGVkQXQiOiIyMDI2LTA5LTA4VDEwOjAwOjAwIn0",
    "traceId": "a1b2c3"
  }
}
```

- 커서는 불투명 문자열이다. 정렬 키 값들을 Base64로 인코딩한 것이고, 프론트는 해석하지 않고 그대로 돌려준다. 내부 구조를 바꿔도 프론트가 안 깨진다.
- 커서 내용 = 정렬 기준 컬럼 값 + 유일 키. `createdAt DESC`로 정렬하면 커서는 `(createdAt, id)`. `createdAt`만 넣으면 같은 시각의 행이 중복/누락된다.
- 쿼리는 `WHERE (created_at, id) < (:cursorCreatedAt, :cursorId) ORDER BY created_at DESC, id DESC LIMIT :size + 1`. size+1개를 조회해서 한 개가 더 오면 `hasNext = true`, 마지막 한 개는 버린다. count 쿼리를 날리지 않는다.
- `(created_at, id)` 복합 인덱스가 정렬 방향과 같게 있어야 한다. 없으면 커서를 써도 느리다.
- `hasNext = false`면 `nextCursor`는 `null`. 프론트는 `hasNext`만 보고 멈춘다.
- 필터나 정렬이 바뀌면 커서를 버리고 첫 페이지부터. 커서에 정렬 조건을 같이 넣어 검증하면 잘못된 조합을 400으로 잡을 수 있다.
- `size` 기본 20, 최대 100. 넘으면 400이 아니라 100으로 잘라 준다(프론트 실수로 목록이 통째로 죽는 것보다 낫다).
- 잘못된 커서(디코딩 실패)는 400 `COMMON_INVALID_CURSOR`.

```java
public record CursorPage<T>(List<T> data, CursorMeta meta) {
    public static <T> CursorPage<T> of(List<T> fetched, int size, Function<T, String> cursorOf) {
        boolean hasNext = fetched.size() > size;
        List<T> data = hasNext ? fetched.subList(0, size) : fetched;
        String next = hasNext ? cursorOf.apply(data.getLast()) : null;
        return new CursorPage<>(data, new CursorMeta(size, hasNext, next));
    }
}
```

### 오프셋 페이징 예시와 이유

```
GET /api/admin/users?page=0&size=20&sort=createdAt,desc
```

- `page`는 0부터. 스프링 `Pageable` 기본과 맞춘다. 프론트에 1부터로 보여주는 건 프론트 몫.
- `meta`: `page`, `size`, `totalElements`, `totalPages`. count 쿼리가 무거우면 `Slice`로 바꾸고 `totalElements`를 빼되, 문서에 명시.
- `size` 최대 100. 오프셋이 10,000을 넘는 요청은 커서로 유도하거나 400.

### 정렬과 필터 - 상세

- 정렬: `sort=createdAt,desc` 형식. 여러 개는 반복 `sort=status,asc&sort=createdAt,desc`. 허용 컬럼을 화이트리스트로 두고 그 외는 400. 사용자 입력을 그대로 ORDER BY에 넣지 않는다.
- 필터: 쿼리 파라미터에 필드명 그대로. `status=PUBLISHED`, `authorId=42`, `from=2026-09-01&to=2026-09-08`. 범위는 `from`/`to`(포함/불포함을 문서에 명시. 기본은 `from` 포함, `to` 불포함).
- 다중 값: `status=PUBLISHED,DRAFT` (쉼표) 또는 반복 파라미터. 프로젝트에서 하나로.
- 검색어: `q=`. 필드 지정 검색은 `title=`, `body=`처럼 필드명.
- 필터 파라미터는 컨트롤러에서 record로 받는다(`ArticleSearchCond`). `@RequestParam` 다섯 개 나열 금지.

## 5. 요청/응답 필드 규칙 - 이유

- JSON 키는 camelCase. DB 컬럼 snake_case와의 변환은 매퍼가 한다.
- 날짜/시간은 ISO 8601 + 시간대: `2026-09-08T19:50:00+09:00`. 서버는 `OffsetDateTime` 또는 `Instant`로 받고, 응답도 오프셋을 붙여 낸다. 타임존 없는 `LocalDateTime`을 API 경계에 두지 않는다(KST/UTC 혼동이 `rca-procedure`의 단골 원인).
- 날짜만: `2026-09-08`. 기간은 `from`/`to`.
- ID는 문자열이 안전하다(JS `Number`는 2^53 넘으면 깨짐). `Long`을 그대로 내려도 되지만 snowflake/UUID면 반드시 문자열.
- enum은 문자열 상수로 (`"PUBLISHED"`). 숫자 코드 금지. 프론트 표시명은 프론트가 매핑하거나, 필요하면 `statusName`을 같이 내린다.
- 금액은 정수(원 단위) 또는 문자열 decimal. 부동소수 금지.
- null과 빈 배열을 구분한다. 목록은 없어도 `[]`. 선택 필드는 `null`을 내리되, 응답 크기가 문제면 프로젝트 차원에서 `NON_NULL` 직렬화로 통일.
- 응답 DTO는 엔티티가 아니다(`ddd-spring`). `XxxResponse.from(entity)` 정적 팩터리로 변환. 엔티티 필드를 전부 노출하지 말고 화면에 필요한 것만.
- 요청 DTO에는 서버가 정하는 값(`id`, `createdAt`, `createdBy`)을 받지 않는다. 받아도 무시하지 말고 400.
- 부울 필드는 `isXxx` 대신 `xxx`(`published`, `deleted`). Jackson이 `isPublished()` getter를 `published`로 직렬화해 이름이 어긋나는 사고를 피한다.

## 6. 버저닝 - 이유

- URL 접두사 `/api/v1/`로 시작한다. 헤더 버저닝은 브라우저/프록시/로그에서 보이지 않아 디버깅이 어렵다.
- 버전을 올리는 조건은 호환 깨지는 변경뿐: 필드 삭제/이름 변경, 타입 변경, 상태 코드 의미 변경, 필수 파라미터 추가. 필드 추가는 버전을 올리지 않는다 (프론트는 모르는 필드를 무시해야 한다. 프론트 규칙에도 넣는다).
- v2를 만들면 v1은 최소 한 배포 주기 이상 유지하고, 문서에 폐기 예정일을 적는다. `Deprecation`/`Sunset` 헤더로 알린다.
- 엔드포인트 하나 때문에 전체 v2를 만들지 않는다. 호환 안 깨지게 새 엔드포인트를 추가하는 쪽을 먼저 본다.
- Boot 4의 `@GetMapping(version = "1")` API 버저닝 기능을 쓰면 컨트롤러 안에서 버전을 나눌 수 있다. 쓸 거면 URL 접두사와 둘 중 하나로 통일.

## 7. 멱등성 - 이유

- `GET`/`PUT`/`DELETE`는 설계상 멱등이어야 한다. `DELETE`를 두 번 부르면 두 번째는 404가 아니라 204(이미 없는 것을 지우는 건 성공). 예외적으로 404를 내려야 하면 문서에 명시.
- `POST` 생성/결제/전송처럼 두 번 실행되면 안 되는 것은 클라이언트가 `Idempotency-Key` 헤더(UUID)를 보낸다. 서버는 `(userId, key)`로 결과를 24시간 저장하고, 같은 키가 오면 처음 응답을 그대로 돌려준다. 처리 중 같은 키가 또 오면 409.
- 적용 대상: 주문/결제, 송고/출고, 알림 발송, 파일 업로드 완료 처리. 단순 CRUD 생성에는 굳이 넣지 않되, unique 제약으로 중복 생성은 막는다(409).
- 액션 엔드포인트(`/confirm`)는 상태 검사로 자연 멱등이 되게 만든다. 이미 확인됨 -> 409가 아니라 200으로 현재 상태를 돌려줄지, 409로 알릴지 프로젝트에서 하나로 정하고 문서에 적는다. 이 문서 기준은 409(사용자에게 "이미 처리됨"을 알려야 하는 경우가 많다).
- 재시도하는 클라이언트(모바일)는 네트워크 타임아웃 후 같은 키로 재요청하도록 프론트 규칙에 명시한다.

## 8. 그 외 규칙 - 상세

- **인증**: `Authorization: Bearer <token>`. 쿼리스트링 토큰 금지 (`spring-auth`).
- **CORS**: 허용 도메인 목록을 설정값으로 (`config-and-secrets`). `*` 금지.
- **요청 크기**: 바디 최대 1MB(파일 제외), 목록 `size` 최대 100. 초과는 413/400.
- **응답 압축**: 켠다(`server.compression.enabled`).
- **캐시**: 변경 적은 조회(코드 테이블, 설정)는 `Cache-Control: max-age`와 `ETag`. 나머지는 `no-store`.
- **헬스체크**: `/actuator/health`만 공개. `/actuator/**` 나머지는 인증.
- **Rate limit**: 로그인, 검색, 외부 API 호출 엔드포인트에. 초과 시 429 + `Retry-After`.
- **삭제**: 소프트 삭제가 기본이면 조회 API는 삭제된 것을 기본으로 제외하고, `includeDeleted=true`는 관리자만.
- **대량 작업**: `POST /api/articles/bulk-publish` 바디에 ID 목록. 부분 성공은 200 + `data.succeeded[]`/`data.failed[]`. 전부 실패해야 4xx.
- **비동기 작업**: 즉시 202 + `data.jobId`, 상태는 `GET /api/jobs/{jobId}`. 폴링 간격을 응답에 힌트(`retryAfterSeconds`).

## 9. API 명세 형식 - 상세

`deliverable-structure`의 `api/YYYY-MM-DD-<기능>-API-명세.md`. 템플릿은 그 스킬의 `templates/api-명세.md`. 이 스킬이 정하는 것은 명세에 반드시 있어야 하는 것:

1. 공통 절: base URL, 인증 방식, 응답 봉투(3장 복사), 에러 코드 표(`ErrorCode` enum에서), 페이징 규칙(4장 요약), 날짜 형식
2. 엔드포인트마다: 메서드 + 경로, 권한, 요청(경로/쿼리/바디 표: 필드, 타입, 필수, 제약, 설명), 응답(성공 코드와 바디 표), 발생 가능한 에러 코드와 상황, 실제 요청/응답 JSON 예시 (curl 한 줄 포함)
3. 변경 이력: 필드 추가/폐기 일자
4. 명세는 코드에서 생성하는 것을 우선한다. springdoc-openapi로 OpenAPI를 뽑고, 명세 문서는 그 위에 "왜, 어떤 순서로"를 얹는다. 손으로 쓴 표가 코드와 어긋나면 코드가 맞다.

## 하지 말 것 - 전체 목록

- 비즈니스 실패를 200 + `success: false`로 내리는 것.
- 엔드포인트마다 다른 응답 모양.
- `PUT`으로 부분 수정.
- `PATCH /articles/{id}` 바디에 `status`를 넣어 상태를 바꾸게 하는 것. 액션 엔드포인트로.
- 커서에 정렬 키만 넣고 유일 키를 빼는 것.
- 커서 페이징에 count 쿼리를 붙이는 것.
- 무한 스크롤에 오프셋 페이징.
- 정렬 파라미터를 검증 없이 ORDER BY에 넣는 것.
- `LocalDateTime`을 API 경계에 두는 것.
- ID를 큰 정수로 JS에 내리는 것 (snowflake/UUID면 문자열).
- 필드 하나 추가했다고 v2를 만드는 것. 반대로 필드 이름을 바꾸면서 버전을 안 올리는 것.
- 500 응답에 스택 트레이스.
- 남의 리소스에 403을 내려 존재를 알려주는 것 (404로).

## 참고

- `ddd-spring` 스킬 - 액션 엔드포인트와 엔티티 상태 전이 메서드의 대응, DTO 위치
- `jpa-query-optimization` 스킬 - 커서 페이징 쿼리와 인덱스
- `spring-auth` 스킬 - 인증 헤더, 401/403
- `config-and-secrets` 스킬 - CORS 허용 목록
- `deliverable-structure` / `deliverable-write` 스킬 - `api/` 명세 위치와 액션 문서
- Spring - Error Responses (ProblemDetail, RFC 9457): https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html
- Spring Boot 4 - API Versioning: https://docs.spring.io/spring-framework/reference/web/webmvc-versioning.html
- Microsoft REST API Guidelines: https://github.com/microsoft/api-guidelines/blob/vNext/Guidelines.md
- Zalando RESTful API Guidelines: https://opensource.zalando.com/restful-api-guidelines/
- Use The Index, Luke - Keyset pagination: https://use-the-index-luke.com/no-offset
- IETF - The Idempotency-Key HTTP Header Field (draft): https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/
