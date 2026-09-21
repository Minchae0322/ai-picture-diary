---
name: spring-code-review
description: 스프링 코드를 리뷰하거나 리뷰 코멘트를 쓸 때 자동 적용. "리뷰해줘", "PR 봐줘", "이 코드 어때", "코드 점검", "문제 없나" 요청에 트리거. 트랜잭션/JPA/예외/API/빈/동시성/로깅/테스트/스타일 체크리스트와 BLOCKER~NIT 심각도 기준. 각 영역의 상세 기준은 해당 스킬(transaction-and-concurrency, api-design, db-schema-and-migration 등)에 있고 여기는 리뷰 순서와 심각도 판단을 담는다.
---

# 스프링 코드 리뷰 기준

## 목적

스프링 부트 백엔드 코드를 일관된 기준으로 리뷰하고, 코멘트를 "심각도 + 이유 + 대안" 형태로 남긴다.
우선순위는 항상 **동작 정확성 > 데이터 정합성 > 보안 > 성능 > 구조 > 스타일**.

## 언제 적용

PR/MR 리뷰 요청, 특정 클래스/패키지를 "봐달라"고 할 때, 내 코드를 커밋 전에 스스로 점검할 때.

## 절차

1. 변경 범위 파악: 어떤 계층(Controller / Service / Repository / Domain / Config)이 바뀌었는지, 스키마 변경이 있는지.
2. 체크리스트를 계층별로 훑고 심각도를 붙인다.
   - `[BLOCKER]` 머지 불가 - 버그, 데이터 손상, 보안 취약점, 트랜잭션 오류
   - `[MAJOR]` 머지 전 수정 권장 - 성능 문제, 예외 처리 누락, 테스트 부재
   - `[MINOR]` 후속 처리 가능 - 네이밍, 중복, 가독성
   - `[NIT]` 취향 - 강제하지 않음
3. 코멘트마다 "왜 문제인지"와 "어떻게 고칠지"를 한 줄씩. 근거가 되는 스프링/하이버네이트 동작은 버전 명시.
4. 요약: BLOCKER 개수, 전체 판단(approve / request changes), 잘한 점 1~2개.

## 체크리스트

### 트랜잭션

상세 기준과 경계 확정 질문표는 `transaction-and-concurrency`. 외부 호출은 `external-api-client`, LLM 호출은 `llm-integration`, 발송은 `notification`(셋 다 트랜잭션 밖).

- `@Transactional` 메서드가 `public`이고 프록시를 통해 호출되는가. self-invocation은 트랜잭션 미적용 `[BLOCKER]`.
- 조회 전용 메서드에 `@Transactional(readOnly = true)`가 있는가.
- 체크 예외를 던지며 롤백을 기대하는가. 기본 롤백은 `RuntimeException`/`Error`. 필요하면 `rollbackFor`.
- 트랜잭션 안에서 외부 API 호출, 메일 발송, 파일 I/O를 하는가. `@TransactionalEventListener(AFTER_COMMIT)`나 별도 서비스로 분리.
- 트랜잭션 경계가 서비스 계층에 있는가. 컨트롤러 `@Transactional`은 설계 신호. OSIV(`spring.jpa.open-in-view`) 설정 확인.

### 영속성 / JPA (스키마 변경은 `db-schema-and-migration` 스킬 7장 체크리스트)
- 기본 fetch가 EAGER인 곳(`@ManyToOne`, `@OneToOne` 기본 EAGER)이 있는가. `LAZY` + fetch join/`@EntityGraph`.
- 반복문 안 컬렉션 접근으로 N+1이 생기는가. 진단은 `jpa-query-optimization` 스킬.
- 엔티티를 컨트롤러 응답으로 직접 반환하는가. DTO로 변환.
- `equals/hashCode`를 ID 기반으로 했는가, 엔티티에 Lombok `@Data`가 있는가. 엔티티는 `@Getter` + 명시적 생성자만.
- `saveAll`/대량 처리에서 `hibernate.jdbc.batch_size`와 ID 전략(IDENTITY는 배치 insert 불가)을 고려했는가.
- 더티체킹으로 충분한데 `save()`를 불필요하게 호출하는가.

### 예외 처리
- `catch (Exception e)` 후 로그만 남기고 삼키는가. 다시 던지거나 무시 이유를 주석으로.
- 다시 던질 때 cause를 유지하는가. `new CustomException(msg, e)`.
- 컨트롤러마다 try-catch 반복인가. `@RestControllerAdvice` + `@ExceptionHandler`, Boot 3은 `ProblemDetail`(RFC 9457).
- 비즈니스 예외(4xx)와 시스템 예외(5xx + 알림)가 구분되는가.

### API / 컨트롤러 (기준: `api-design` 스킬 10장 체크리스트)
- 요청 DTO에 `@Valid`와 검증 애노테이션이 있는가. 수동 `if (x == null)` 검증은 대체.
- HTTP 메서드와 상태 코드가 의미에 맞는가(생성 201, 삭제 204, 조회 실패 404).
- 페이징 없는 목록 API가 있는가. 무한 스크롤에 오프셋 페이징이면 `[MAJOR]`.
- 공통 봉투/ErrorCode 체계를 따르는가. 엔드포인트마다 다르면 `[MAJOR]`. 비즈니스 실패를 200으로 내리면 `[BLOCKER]`.
- 민감 정보(비밀번호, 토큰, 개인정보)가 응답/로그에 노출되는가.

### 빈 / 설정
- 필드 주입(`@Autowired` 필드)이 있는가. 생성자 주입(`@RequiredArgsConstructor` + `final`).
- 순환 참조가 있는가. Boot 2.6+ 기본 금지, `allow-circular-references` 우회 흔적은 BLOCKER 수준.
- 하드코딩 URL/키/타임아웃이 있는가. `@ConfigurationProperties`로. 시크릿이 yml 값이거나 `${VAR:default}` 기본값이면 `[BLOCKER]`, `.env.example` 미갱신 `[MAJOR]`(`config-and-secrets` 스킬).
- `RestTemplate`/`WebClient`/`RestClient` 타임아웃이 있는가. Boot 4 새 클라이언트는 `@HttpExchange` + `HttpServiceClient` 우선.

### 동시성 / 상태
- 싱글톤 빈에 요청별 상태 필드가 있는가. 대표적인 BLOCKER.
- 재고 차감, 잔액 변경 등 경쟁 갱신에 락 전략(`@Lock`, `@Version`, DB 원자적 UPDATE)이 있는가.
- `@Async` 메서드가 같은 클래스에서 호출되는가(프록시 문제).

### 로깅 (기준: `logging-observability` 스킬 10장 체크리스트)
- 로그 레벨이 적절한가(정상 흐름 `ERROR`, 장애 `INFO` 금지).
- 문자열 연결 대신 파라미터 바인딩(`log.debug("id={}", id)`)인가.
- traceId/MDC가 로그에 남는가. `MDC.put`에 `finally remove`가 없으면 `[BLOCKER]`.
- 값이 구조화 인자(`addKeyValue`)인가. `event` 필드가 있는가. 개인정보/토큰/바디가 로그에 있으면 `[BLOCKER]`.
- 로그 후 다시 던지기(스택 중복), 루프 안 INFO가 있는가.

### 코드 스타일 (MINOR, 기준은 `ddd-spring` 스킬의 "코드 작성 지향")
- `if-else` 사슬, 3단 이상 중첩. early return, enum 위임, switch 표현식, 전략 패턴. 더 읽기 어려워지면 지적하지 않는다.
- DTO/Command/이벤트/값 객체가 `record`인가.
- `for` + 임시 리스트가 Stream으로 명확해지는가. 반대로 Stream 5단계 초과/람다 안 분기면 메서드 추출.
- `Optional.isPresent()` + `get()`, 필드/파라미터 Optional, `Optional<List>`가 있는가.

### 테스트
- 변경 로직에 대응하는 테스트가 있는가. 없으면 `[MAJOR]`. 기준은 `test-writing-guide` 스킬.
- 숫자/길이 제한, 날짜 비교, 페이징, 상태 전이에 **경계값 테스트**(0, 최대, 최대+1, 빈 값, null, 경계 시각 정확히/1초 전후)가 있는가. 정상만 있으면 `[MAJOR]`.
- 테스트가 실제 DB 순서나 시간에 의존하는가.

## 하지 말 것

- 스타일 지적만 잔뜩 남기고 트랜잭션/정합성 문제를 놓치는 리뷰. 우선순위 순서를 지킨다.
- "이렇게 하면 안 됩니다"만 쓰고 대안이 없는 코멘트.
- 근거 없이 "성능이 나쁠 것 같다". 측정 안 했으면 "확인 필요".
- 개인 취향(줄바꿈, 괄호 위치)을 MAJOR로 올리는 것.

## 관련 스킬

이 스킬은 **리뷰 순서와 심각도 판단**만 담는다. 각 항목의 상세 기준은 해당 스킬에 있고, 리뷰 중 판단이 안 서면 그쪽을 편다.

`ddd-spring`(계층·책임·코드 지향), `transaction-and-concurrency`(트랜잭션 경계, 락), `jpa-query-optimization`(N+1, 쿼리), `db-schema-and-migration`(스키마·인덱스), `api-design`(응답·상태 코드), `spring-auth`(인가), `config-and-secrets`(하드코딩된 값), `logging-observability`(로그 위치와 금지 항목), `test-writing-guide`(테스트 유무와 경계값), `external-api-client`/`llm-integration`/`notification`(각 호출이 트랜잭션 밖인지), `harness`(기계가 잡을 수 있는 항목은 리뷰가 아니라 하네스로 옮긴다).

## 더 보기
- 이유, 예시 코드, 상세 표, 참고 링크: `reference.md` (판단이 안 서거나 처음 적용할 때만 읽는다)
