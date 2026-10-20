---
name: logging-observability
description: 백엔드 코드에 로그를 넣거나 로그 설정(logback, 레벨, 포맷)을 바꾸거나 Grafana(Loki/Tempo/Mimir)에서 추적 가능하게 만들 때. "로그 찍어", "어디에 로그", "log.info 형식", "traceId", "MDC", "Loki에서 검색 안 됨", "메트릭 추가" 요청이나 코드에 `log.` 호출이 들어가는 순간 적용. 무엇을 어느 레벨로 어떤 형식으로 남기고, 트레이스/메트릭과 어떻게 연결하며, 무엇은 절대 남기지 않는지 정한다.
---

# 로깅과 관측성 (logging-observability)

## 목적

로그는 **기계**(Loki 파싱·집계·알림)와 **사람**(장애 때 timeline을 읽는 개발자)을 동시에 만족해야 한다. (1) 무엇을 남기고 안 남기는지, (2) 한 줄의 모양, (3) traceId로 로그-트레이스-메트릭을 잇는 설정, (4) Grafana에서 실제로 찾아지는 형태를 정한다. `rca-procedure`가 읽는 쪽, 이 스킬은 그때 필요한 것이 이미 남아 있게 만드는 쪽.
기본 스택: Spring Boot 4.x + SLF4J/Logback, Micrometer Tracing + OpenTelemetry(`spring-boot-starter-opentelemetry`), Grafana Loki/Tempo/Mimir 또는 Prometheus, 수집은 Alloy. Boot 3.x도 동일하고 스타터 이름만 다르다(`micrometer-tracing-bridge-otel`).

## 언제 적용

`log.xxx(...)` 추가, `logback-spring.xml`/`logging.level.*`/포맷 변경, 새 서비스를 Grafana 스택에 붙일 때, "Loki에서 못 찾겠다"/"트레이스와 로그가 안 이어진다", 로그 기반 알림 규칙, 장애 후 "이 로그가 있었으면"이 나왔을 때(`rca-procedure` 재발 방지의 탐지 항목).

## 이 스킬 폴더의 파일

| 파일 | 용도 | 복사 위치 |
|---|---|---|
| `templates/logback-spring.xml` | local은 사람용 패턴, 그 외 JSON. 마스킹 데코레이터 포함 | `src/main/resources/logback-spring.xml` |
| `templates/RequestLogFilter.java` | 요청 종료 1줄 로그 (`http.request.done`) | `common/logging/` |
| `templates/AppLog.java` | `event` 강제 구조화 로그 헬퍼 | `common/logging/` |
| `templates/loki-queries.md` | 자주 쓰는 LogQL, Grafana 데이터소스 연결 체크 | `docs/ops/` |

## 1. 원칙 다섯 개

1. **구조화된 로그.** 운영은 JSON 한 줄, 사람용 포맷은 로컬 프로파일만.
2. **모든 줄에 traceId.** traceId 하나로 요청의 로그를 전부 모으고 Tempo 트레이스를 열 수 있어야 한다.
3. **이벤트 이름 + 키=값.** 문장에 값을 섞지 않는다(`"주문 123 생성됨"` 대신 `event=order.created orderId=123`).
4. **예외는 한 번만, 경계에서.** 잡아서 로그 찍고 다시 던지지 않는다. 최상위(`@RestControllerAdvice`, 컨슈머 에러 핸들러, 스케줄러 래퍼)에서 스택과 함께 한 번.
5. **개인정보와 시크릿은 절대.** 마스킹을 거치지 않은 사용자 입력을 로그에 넣지 않는다.

## 2. 레벨

| 레벨 | 의미 | 운영 기본 | 예 |
|---|---|---|---|
| `ERROR` | **사람이 봐야 하는** 실패. 알림 대상 | 켬 | DB 연결 실패, 결제 응답 파싱 실패, 아웃박스 발행 3회 실패 |
| `WARN` | 처리는 됐지만 정상이 아님 | 켬 | 재시도 후 성공, 느린 쿼리, 폴백, 폐기 예정 API 호출, 400 |
| `INFO` | 비즈니스 이벤트와 경계 | 켬 | 요청 종료 1줄, 상태 전이, 외부 호출 결과, 배치 시작/종료와 건수 |
| `DEBUG` | 개발자가 원인 찾을 때만 | 끔 (패키지 단위로 켬) | 조건 평가, 캐시 히트/미스, 쿼리 파라미터 |
| `TRACE` | 거의 안 씀 | 끔 | 루프 안 반복 값 |

- 판단 질문: **"새벽 3시에 찍히면 누가 깨어나야 하는가?"** 깨어나야 하면 ERROR, 아침에 봐야 하면 WARN, 흐름 재구성용이면 INFO, 아니면 DEBUG.
- 4xx는 WARN(클라이언트 잘못). 단 401/403 급증은 `spring-auth` 시크릿 드리프트 신호라 `event=auth.rejected reason=...`을 남긴다. ERROR가 하루 100건 넘으면 알림이 무의미.
- 루프 안 INFO 금지: 시작/끝 + 건수만, 개별 실패만 WARN. 요청 종료 1줄(`event=http.request.done status=200 durationMs=42`)은 필수.

## 3. 한 줄의 모양

- 고정 필드(인코더 자동): `ts`, `level`, `logger`, `thread`, `traceId`, `spanId`, `service`, `env`, `message`, 예외 시 `exception`. 가변 필드는 **구조화 인자**로만.
- `event`는 **항상**. `<도메인>.<동작>` 소문자 점 표기, 과거형(`order.placed`, `payment.approve_failed`, `http.request.done`, `batch.finished`, `outbox.publish_failed`). 메시지 문구가 바뀌어도 `event`는 안 바뀐다.
- 식별자는 **ID만**(`memberId`, `orderId`). 시간은 `durationMs` 정수, 단위를 이름에.
- 코드: **SLF4J fluent + `addKeyValue`** 기준(`log.atInfo().addKeyValue("event", "order.placed")...log("order placed")`). logstash `StructuredArguments`도 가능, 프로젝트에서 하나로. 반복 조합은 헬퍼(`AppLog.event(...).with(...).info(...)`). **헬퍼를 둔 프로젝트에서는 인라인 체인을 쓰지 않는다** - 둘이 섞이면 event 필드가 빠진 로그가 생긴다. `String.format`/`+` 연결 금지.
- 로컬은 `local` 프로파일만 사람용 패턴(traceId 앞 8자리, 로거 축약, 키=값 뒤에). 같은 구조화 인자에서 두 포맷이 나오므로 코드는 하나.

## 4. traceId - 로그, 트레이스, 메트릭을 잇는 실

- Boot 4: `spring-boot-starter-opentelemetry` + `micrometer-registry-otlp`(또는 `-prometheus`). `management.tracing.sampling.probability`(개발 1.0, 운영 0.1~0.3), `management.opentelemetry.resource-attributes`(`service.name`, `deployment.environment`), `management.otlp.tracing.endpoint`/`metrics.export.url`, `logging.include-application-name: false`.
- Micrometer Tracing이 `traceId`/`spanId`를 MDC에 자동으로 넣는다. MDC를 직접 만지는 건 사용자 식별자 추가만.

| 끊기는 곳 | 해결 |
|---|---|
| `@Async`, 직접 만든 `ExecutorService` | `ContextPropagatingTaskDecorator`(Boot 3.2+/4) 또는 `spring.threads.virtual.enabled=true` + `ContextSnapshotFactory`. 직접 만든 풀은 `ContextExecutorService.wrap()` |
| `CompletableFuture.supplyAsync` | 위 executor를 넘긴다. 기본 ForkJoinPool은 전파 안 됨 |
| Kafka 컨슈머 | `spring-kafka` `observation-enabled: true`로 헤더 복원. 직접 컨슈머는 `traceparent` 읽어 `Tracer`로 span 시작 |
| `@Scheduled` | `@Observed` 또는 `Observation.start()`로 배치마다 새 트레이스 + `event=batch.started jobName=...` |
| WebClient/RestClient | Boot 빌더(`RestClient.Builder` 주입)만 자동 전파. `new RestClient` 직접 생성은 안 됨 |
| 리액티브 (WebFlux) | `Hooks.enableAutomaticContextPropagation()` |

- 전파 확인: 요청 하나의 traceId로 컨트롤러 -> 서비스 -> 비동기 리스너 -> 외부 호출이 전부 같은지 Loki에서 본다. 사용자 식별자 MDC: `MDC.put("memberId", ...)`는 `try/finally`로 `MDC.remove`. 없으면 리뷰 `[BLOCKER]`(`spring-code-review`).
- Grafana: Loki Derived fields `traceId` -> Tempo, Tempo Trace to logs(`service.name` -> `service` 라벨, ±1분), Trace to metrics(RED). 응답 헤더/`meta.traceId`(`api-design`)로 사용자가 문의 시 넘기게 한다.

## 5. 무엇을 남기는가 (위치별)

| 위치 | 남길 것 | 레벨 | 비고 |
|---|---|---|---|
| HTTP 요청 종료 (필터 1개) | `event=http.request.done method path status durationMs memberId` | INFO | 시작 로그 생략. 헬스체크 제외 |
| 비즈니스 상태 전이 (application) | `event=<domain>.<action>` + 대상 ID + 전이 전/후 상태 | INFO | `deliverable-write` 액션 이름 = event 이름 |
| 도메인 규칙 거부 (422/409) | `event=<domain>.<action>_rejected reason=<ErrorCode>` | WARN | 급증하면 UI 문제 |
| 외부 호출 (API, 결제, AI) | `event=<system>.call.done operation status durationMs` / 실패 `_failed` + 응답 코드 | INFO / WARN(재시도) / ERROR(최종) | 바디 금지. 필요하면 DEBUG + 마스킹 |
| DB 느린 쿼리 | `event=db.slow_query durationMs` | WARN | Hibernate `LOG_QUERIES_SLOWER_THAN_MS` 또는 p6spy. SQL 전문은 DEBUG |
| 메시지 발행/소비 | `kafka.published topic key` / `kafka.consumed topic partition offset durationMs` | INFO | 페이로드 X. 실패 `_failed` + 재시도 횟수 + DLQ 여부 |
| 배치/스케줄러 | `batch.started jobName`, `batch.finished jobName processed failed durationMs` | INFO | 개별 실패만 WARN |
| 인증 | `auth.login_succeeded memberId provider`, `auth.login_failed reason`(아이디 X), `auth.token_rejected reason`(만료/서명/누락) | INFO / WARN | `spring-auth` 관측성 절 |
| 기동 | `app.started profile version gitSha` 1줄 | INFO | 설정값 덤프 금지 (`config-and-secrets`) |
| 예외 최종 처리 (`@RestControllerAdvice`) | 5xx `event=http.request.failed` + 스택 / 4xx 스택 없이 | ERROR / WARN | 여기 한 곳에서만 스택 |

**남기지 않는 것**: 메서드 진입/탈출, getter 값, 정상 분기 통과, 성공한 개별 항목(루프), 요청/응답 바디 전문, SQL 파라미터 값(DEBUG도 마스킹), 스택 트레이스 두 번.

## 6. 절대 남기지 않는 것과 마스킹

- 비밀번호, 토큰(JWT/refresh/API 키), 카드/계좌번호, 주민등록번호, OTP. 이메일/전화/이름 전문(ID로, 정말 필요하면 마스킹 `h***@example.com`). 사용자 생성 콘텐츠 본문(길이나 ID만). 요청 헤더 전체 덤프. 예외 메시지 속 JDBC URL, 외부 API 에러 바디(상태 코드 + 에러 코드만).
- 인코더 마스킹 패턴(템플릿 `MaskingJsonGeneratorDecorator`)은 최후 방어선. 코드에서 안 넣는 게 규칙.

## 7. Loki가 잘 먹는 형태

- **라벨은 적게, 카디널리티 낮게**: `service`, `env`, `level` 정도. `traceId`/`memberId`/`orderId`는 JSON 필드로 두고 `| json | orderId="12345"`.
- 한 이벤트 = 한 줄(멀티라인은 스택만). `event` 값은 enum처럼 고정(공백, 한국어, 동적 값 금지). 숫자는 숫자로(`durationMs: 87`). 자주 쓸 쿼리는 `templates/loki-queries.md`. 알림은 로그보다 **메트릭**(`http.server.requests` 5xx 비율, p99, 큐 lag). 로그 알림은 `event=outbox.publish_failed`처럼 메트릭 없는 비즈니스 실패만.

## 8. 메트릭 (로그로 세지 않는다)

- 요청 수/지연/오류율은 `http.server.requests` 자동 수집. 비즈니스 카운터는 `MeterRegistry`(`Counter.builder("order.placed").tag("channel", ch)`), ID 태그 금지. 처리 시간은 `@Timed`/`Timer.Sample`(로그 `durationMs`는 개별 추적, 히스토그램은 집계, 둘 다).
- 배치는 `batch.processed`, `batch.failed` 카운터 + `batch.last_success_epoch` 게이지. RED 대시보드를 서비스마다 같은 레이아웃으로.

## 9. 샘플링과 양

- 트레이스: 개발/스테이징 100%, 운영 10~30% 시작. **에러 트레이스는 항상 남기는** 테일 샘플링(Alloy/Collector `tail_sampling`) 필수.
- 로그는 샘플링하지 않는다. 운영 DEBUG는 `logging.level.<패키지>`로 패키지 단위·시간 제한(Actuator `/loggers`로 켜고 되돌리기). 헬스체크/정적 자원/OPTIONS는 요청 로그 제외.
- 한 줄 1KB 초과는 잘못 들어간 것. 인코더 `maxLength`. 보존 Loki 운영 30일, 감사는 별도 스토리지. 컨테이너는 stdout만.

## 10. 리뷰 체크 (`spring-code-review`가 본다)

- [ ] 새 비즈니스 상태 전이에 `event=<domain>.<action>` INFO 로그가 있다
- [ ] 값이 메시지 문자열에 끼워져 있지 않고 구조화 인자다
- [ ] 예외를 잡아서 로그하고 다시 던지는 곳이 없다 (한 번만, 경계에서)
- [ ] 루프 안에 INFO 이상이 없다
- [ ] 4xx가 ERROR가 아니다
- [ ] 개인정보/토큰/바디가 로그에 없다 (`[BLOCKER]`)
- [ ] `MDC.put`에 `finally` `remove`가 있다 (`[BLOCKER]`)
- [ ] 새 스레드풀/비동기 경계에 컨텍스트 전파가 있다
- [ ] 외부 호출에 durationMs와 실패 시 상태 코드가 남는다
- [ ] 새 배치/스케줄러에 시작/종료/건수 로그와 last_success 메트릭이 있다

## 하지 말 것

- `System.out.println`. `log.info("주문 " + id + " 생성")`. 계층마다 `catch { log.error; throw }`. `log.error(e.getMessage())`(예외 객체를 마지막 인자로). `log.debug("..." + expensive())`(fluent 또는 `isDebugEnabled`).
- `traceId`/`memberId`를 Loki 라벨로. 운영 전체 `DEBUG`. 바디를 "잠깐" 남기기. 로그 개수로 메트릭 대신. 스레드 이름으로 요청 구분(traceId가 그 역할). 헤드 샘플링만 켜고 "에러 트레이스가 없다".

## 관련 스킬

`rca-procedure`(이 로그를 읽는 절차), `api-design`(`meta.traceId`), `spring-auth`(인증 실패 reason, MDC), `config-and-secrets`(설정값 마스킹), `harness`(로그 출력은 `tail`로 잘라 hook에), `llm-integration`(모델·프롬프트 버전·토큰 수 필드), `notification`(연락처 마스킹), `deploy-pipeline`(배포 후 관찰 지표).

## 더 보기
- 이유, 예시 코드, 상세 표, 참고 링크: `reference.md` (판단이 안 서거나 처음 적용할 때만 읽는다)
