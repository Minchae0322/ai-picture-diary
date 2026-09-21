# logging-observability - 참고 자료

`SKILL.md`의 규칙에 대한 이유, 예시 코드/설정, 상세 설명을 담는다. 절 번호는 SKILL.md와 같다.

## 목적 - 왜

로그는 두 독자를 동시에 만족해야 한다. 기계(Loki가 파싱해서 필터·집계·알림)와 사람(장애 때 timeline을 읽는 개발자). 이 스킬은 (1) 무엇을 남기고 무엇을 안 남기는지, (2) 한 줄의 모양, (3) traceId로 로그-트레이스-메트릭이 한 클릭으로 이어지게 하는 설정, (4) Grafana에서 실제로 찾아지는 형태를 정한다. `rca-procedure`가 장애 때 이 로그를 읽는 쪽이고, 이 스킬은 그때 필요한 것이 이미 남아 있게 만드는 쪽이다.

기본 스택: Spring Boot 4.x + SLF4J/Logback, Micrometer Tracing + OpenTelemetry(`spring-boot-starter-opentelemetry`), Grafana Loki(로그) / Tempo(트레이스) / Mimir 또는 Prometheus(메트릭), 수집은 Alloy. Boot 3.x도 동일하고 스타터 이름만 다르다(`micrometer-tracing-bridge-otel`).

## 언제 적용 - 상세

- 서비스/컨트롤러/리스너에 `log.xxx(...)`를 추가할 때
- `logback-spring.xml`, `logging.level.*`, 로그 포맷을 바꿀 때
- 새 서비스를 Grafana 스택에 붙일 때
- "로그는 있는데 Loki에서 못 찾겠다", "트레이스와 로그가 안 이어진다"
- 알림(alert) 규칙을 로그 기반으로 만들 때
- 장애 후 "이 로그가 있었으면 바로 알았을 텐데"가 나왔을 때 (`rca-procedure` 재발 방지의 탐지 항목)

## 1. 원칙 다섯 개 - 이유

1. **구조화된 로그.** 운영은 JSON 한 줄. 사람이 읽는 포맷은 로컬 프로파일에서만. Loki는 JSON 필드를 그대로 쿼리한다.
2. **모든 줄에 traceId.** 요청 하나가 남긴 로그를 traceId 하나로 전부 모을 수 있어야 하고, 그 traceId로 Tempo의 트레이스를 열 수 있어야 한다. 이게 없으면 나머지는 의미가 반 이하다.
3. **이벤트 이름 + 키=값.** 메시지는 "무슨 일이 일어났는가"를 고정된 이벤트 이름으로, 상세는 필드로. 문장형 메시지에 값을 섞어 넣지 않는다.
4. **예외는 한 번만, 경계에서.** 잡아서 로그 찍고 다시 던지지 않는다. 최상위(`@RestControllerAdvice`, 컨슈머 에러 핸들러, 스케줄러 래퍼)에서 한 번 스택 트레이스와 함께.
5. **개인정보와 시크릿은 절대.** 비밀번호, 토큰, 카드번호, 주민번호, 이메일 전문, 본문 내용. 마스킹 유틸을 거치지 않은 사용자 입력을 그대로 로그에 넣지 않는다.

## 2. 레벨 - 상세

| 레벨 | 의미 | 운영 기본 | 예 |
|---|---|---|---|
| `ERROR` | 사람이 봐야 하는 실패. 알림 대상. 요청이 실패했거나 데이터가 어긋났거나 외부 시스템이 죽었다 | 켬 | DB 연결 실패, 결제 승인 응답 파싱 실패, 아웃박스 발행 3회 실패 |
| `WARN` | 처리는 됐지만 정상이 아님. 쌓이면 봐야 함 | 켬 | 재시도 후 성공, 느린 쿼리(임계 초과), 폴백 사용, 폐기 예정 API 호출, 잘못된 입력으로 400 |
| `INFO` | 비즈니스 이벤트와 경계. 흐름을 재구성할 수 있는 최소 단위 | 켬 | 요청 시작/종료(1줄), 주문 생성/취소, 상태 전이, 외부 호출 결과, 배치 시작/종료와 건수 |
| `DEBUG` | 개발자가 원인 찾을 때만. 분기 판단 근거, 파라미터 | 끔 (특정 패키지만 켤 수 있게) | 조건 평가 결과, 캐시 히트/미스, 쿼리 파라미터 |
| `TRACE` | 거의 안 씀 | 끔 | 루프 안 반복 값 |

레벨을 정하는 질문: "이 로그가 운영에서 새벽 3시에 찍히면 누가 깨어나야 하는가?" 깨어나야 하면 ERROR, 아침에 봐야 하면 WARN, 아무도 안 봐도 되지만 나중에 흐름 재구성에 필요하면 INFO, 그것도 아니면 DEBUG.

흔한 실수:

- 정상 흐름을 ERROR로(`"사용자 없음"`은 사용자가 잘못 입력한 것이면 WARN 이하). ERROR가 하루 100건 넘게 찍히면 알림이 무의미해진다.
- 4xx를 ERROR로. 클라이언트 잘못은 WARN. 단, 401/403이 갑자기 급증하는 건 `spring-auth`의 시크릿 드리프트 신호라 WARN에도 `event=auth.rejected reason=...`을 남긴다.
- 루프 안 INFO. 1,000건 처리하면 1,000줄. 시작/끝 + 건수만, 개별 실패만 WARN.
- 성공했는데 아무 로그가 없음. 요청 종료 1줄(`event=http.request.done status=200 durationMs=42`)은 필수. 이게 없으면 "느려졌다"를 로그로 증명할 수 없다.

## 3. 한 줄의 모양 - 예시

### 운영 (JSON, Loki용)

```json
{
  "ts": "2026-09-09T10:15:32.123+09:00",
  "level": "INFO",
  "logger": "c.e.order.application.PlaceOrderService",
  "thread": "http-nio-8080-exec-3",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "service": "order-api",
  "env": "prod",
  "event": "order.placed",
  "message": "order placed",
  "orderId": 12345,
  "memberId": 987,
  "itemCount": 3,
  "durationMs": 87
}
```

- 고정 필드(인코더가 자동): `ts`, `level`, `logger`, `thread`, `traceId`, `spanId`, `service`, `env`, `message`, 예외 시 `exception` (클래스 + 메시지 + 스택).
- 가변 필드: 코드에서 구조화 인자로 넘긴 것. 메시지 문자열에 끼워 넣지 않는다.
- `event`는 항상 넣는다. `<도메인>.<동작>` 소문자 점 표기, 과거형: `order.placed`, `order.cancel_rejected`, `payment.approve_failed`, `http.request.done`, `batch.finished`, `outbox.publish_failed`. Loki에서 `| event="order.placed"`로 정확히 찍힌다. 메시지 문구가 바뀌어도 `event`는 안 바뀐다.
- 사용자/리소스 식별자는 ID만: `memberId`, `orderId`, `articleId`. 이름, 이메일, 제목은 넣지 않는다.
- 시간은 `durationMs` 정수. 단위를 이름에.

### 코드에서 쓰는 방법

SLF4J 2.x fluent API 또는 logstash-logback-encoder의 `StructuredArguments`. 프로젝트에서 하나로 통일. 이 문서 기준은 SLF4J fluent + `addKeyValue` (의존성 없이 되고, Boot 4 기본 Logback JSON 포맷과 logstash 인코더 둘 다 필드로 뽑아준다).

```java
private static final Logger log = LoggerFactory.getLogger(PlaceOrderService.class);

log.atInfo()
   .addKeyValue("event", "order.placed")
   .addKeyValue("orderId", order.getId())
   .addKeyValue("memberId", memberId)
   .addKeyValue("itemCount", order.getLines().size())
   .addKeyValue("durationMs", elapsed.toMillis())
   .log("order placed");
```

반복되는 조합은 작은 헬퍼로 감싼다(`AppLog.event("order.placed").with("orderId", id).info("order placed")`). `String.format`이나 `+` 연결로 메시지를 만드는 순간 필드가 사라진다.

### 로컬 (사람용)

```
10:15:32.123  INFO [4bf92f35,00f067aa] c.e.order.PlaceOrderService : order placed  event=order.placed orderId=12345 memberId=987 itemCount=3 durationMs=87
```

`local` 프로파일만 이 패턴. traceId 앞 8자리, 로거 축약, 키=값은 뒤에. 색상은 IDE 콘솔에서. 운영과 같은 구조화 인자에서 두 포맷이 나오므로 코드는 하나다.

## 4. traceId - 설정과 전파 상세

### 설정 (Boot 4)

```groovy
implementation 'org.springframework.boot:spring-boot-starter-opentelemetry'   // Micrometer Tracing + OTel 브리지 + OTLP 익스포터
implementation 'io.micrometer:micrometer-registry-otlp'                       // 또는 -prometheus
```

```yaml
management:
  tracing:
    sampling:
      probability: 1.0            # 개발/스테이징 1.0, 운영은 0.1~0.3 (9장 샘플링 절)
  opentelemetry:
    resource-attributes:
      service.name: order-api
      deployment.environment: ${SPRING_PROFILES_ACTIVE}
  otlp:
    tracing.endpoint: ${OTLP_ENDPOINT}/v1/traces
    metrics.export.url: ${OTLP_ENDPOINT}/v1/metrics
logging:
  include-application-name: false  # service 필드로 대신
```

Micrometer Tracing이 `traceId`/`spanId`를 MDC에 자동으로 넣는다. 코드에서 MDC를 직접 만질 일은 사용자 식별자 추가할 때만.

### 전파가 끊기는 곳 (여기서 traceId가 사라진다)

| 끊기는 곳 | 해결 |
|---|---|
| `@Async`, 직접 만든 `ExecutorService` | `ContextPropagatingTaskDecorator`(Boot 3.2+/4) 또는 `spring.threads.virtual.enabled=true` + `ContextSnapshotFactory`. 직접 만든 스레드풀은 `ContextExecutorService.wrap()` |
| `CompletableFuture.supplyAsync` | 위 executor를 넘긴다. 기본 ForkJoinPool은 전파 안 됨 |
| Kafka 컨슈머 | `spring-kafka`는 관측 켜면(`observation-enabled: true`) 헤더에서 복원. 직접 만든 컨슈머는 헤더 `traceparent` 읽어 `Tracer`로 span 시작 |
| `@Scheduled` | 트레이스가 없는 상태로 시작. `@Observed` 또는 `Observation.start()`로 배치마다 새 트레이스 생성 + `event=batch.started jobName=...` |
| WebClient/RestClient | Boot의 빌더(`RestClient.Builder` 주입)로 만들면 자동 전파. `new RestClient` 직접 생성은 안 됨 |
| 리액티브 (WebFlux) | `Hooks.enableAutomaticContextPropagation()` |

전파 확인 테스트: 요청 하나 보내고 그 traceId로 Loki 검색해서 컨트롤러 -> 서비스 -> 비동기 리스너 -> 외부 호출까지 전부 같은 traceId인지 본다. 하나라도 다르면 위 표.

### 사용자 식별자 MDC

```java
// JwtFilter 안 (spring-auth 스킬)
MDC.put("memberId", String.valueOf(principal.id()));
try {
    chain.doFilter(request, response);
} finally {
    MDC.remove("memberId");     // 스레드 풀 재사용으로 남의 요청에 붙는 사고 방지
}
```

`try/finally` 없는 `MDC.put`은 리뷰에서 `[BLOCKER]`(`spring-code-review`).

### Grafana에서 잇기

- Loki 데이터소스 > Derived fields: `traceId` 필드를 Tempo 데이터소스로 링크. 로그 한 줄에서 트레이스 열기.
- Tempo 데이터소스 > Trace to logs: `service.name` -> Loki 라벨 `service` 매핑, 시간 범위 ±1분. 스팬에서 그 시간 로그 열기.
- Tempo > Trace to metrics: `service` 라벨로 RED 대시보드 링크.
- 응답 헤더에 `traceId`를 내려(`api-design`의 `meta.traceId`) 프론트/사용자가 문의할 때 넘기게 한다. 이 값으로 Loki 검색 한 번이면 요청 전체가 나온다.

## 5. 무엇을 남기는가 - 표의 비고 상세

- HTTP 요청 종료: 시작 로그는 생략(종료에 duration이 있으면 충분). 헬스체크 경로 제외.
- 비즈니스 상태 전이: `deliverable-write` 액션과 1:1. 문서의 액션 이름 = event 이름으로 맞춘다.
- 도메인 규칙 거부(422/409): 사용자가 시도한 것. 급증하면 UI 문제.
- 외부 호출: 요청/응답 바디는 남기지 않는다. 필요하면 DEBUG + 마스킹.
- DB 느린 쿼리: Hibernate `LOG_SLOW_QUERY` 임계 설정(`hibernate.session.events.log.LOG_QUERIES_SLOWER_THAN_MS`) 또는 p6spy. SQL 전문은 DEBUG.
- 메시지 발행/소비: 페이로드 X. 실패는 `_failed` + 재시도 횟수 + DLQ 여부.
- 배치/스케줄러: 개별 항목 실패만 WARN. 루프 안 INFO 금지.
- 인증: `spring-auth` 관측성 절. reason 구분이 401 급증 원인 분류의 핵심.
- 기동: 설정값 덤프 금지 (`config-and-secrets`).
- 예외 최종 처리: 여기 한 곳에서만 스택. 중간 계층은 잡지 않거나 잡으면 컨텍스트 붙여 다시 던진다.

남기지 않는 것: 메서드 진입/탈출("xxx 시작", "xxx 끝"), getter 값, 정상 분기 통과("if 조건 만족"), 성공한 개별 항목(루프), 요청/응답 바디 전문, SQL 파라미터 값(DEBUG도 마스킹), 스택 트레이스 두 번.

## 6. 절대 남기지 않는 것과 마스킹 - 상세

- 비밀번호, 토큰(JWT 전문, refresh, API 키), 카드/계좌번호, 주민등록번호, 인증 코드(OTP)
- 이메일/전화/이름 전문. 필요하면 ID로, 정말 필요하면 마스킹(`h***@example.com`, `010-****-1234`)
- 사용자 생성 콘텐츠 본문(게시글, 기사 본문, 댓글). 길이나 ID만
- 요청 헤더 전체 덤프(`Authorization`, `Cookie` 포함)
- 예외 메시지에 실려 오는 것: JDBC URL(비밀번호 포함 가능), 외부 API 에러 바디(토큰 에코 가능). 외부 응답은 상태 코드 + 에러 코드만

Logback 레벨의 마스킹 패턴(정규식으로 카드번호/JWT 형태를 `****`로)을 인코더에 한 번 걸어 두면 실수 한 번은 막아 준다. 템플릿의 `MaskingJsonGeneratorDecorator` 설정 참고. 단, 이건 최후 방어선이고 코드에서 안 넣는 게 규칙이다.

## 7. Loki가 잘 먹는 형태 - 이유와 쿼리

- 라벨(label)은 적게, 카디널리티 낮게. 라벨은 `service`, `env`, `level` 정도. `traceId`, `memberId`, `orderId`를 라벨로 만들면 스트림이 폭발해 Loki가 느려지고 비용이 튄다. 이런 값은 JSON 필드로 두고 `| json | orderId="12345"`로 필터한다.
- 한 이벤트 = 한 줄. 멀티라인은 스택 트레이스만(인코더가 `exception` 필드 하나로 넣으므로 JSON에서는 문제없음).
- `event` 필드 값은 enum처럼 고정. 공백, 한국어, 동적 값 금지. 대시보드/알림이 이 값으로 집계한다.
- 숫자는 숫자로(`durationMs: 87`, 문자열 `"87"` 아님). LogQL `| durationMs > 1000`이 동작한다.
- 자주 쓸 쿼리 (템플릿 `loki-queries.md`):
  - 요청 하나 전체: `{service="order-api"} | json | traceId="4bf9..."`
  - 5xx 급증: `sum by (service) (rate({env="prod"} | json | event="http.request.failed" [5m]))`
  - 느린 요청: `{service="order-api"} | json | event="http.request.done" | durationMs > 2000`
  - 이벤트 집계: `sum by (event) (count_over_time({service="order-api"} | json | level="WARN" [1h]))`
  - 401 원인 분류: `sum by (reason) (count_over_time({env="prod"} | json | event="auth.token_rejected" [15m]))`
- 알림은 로그보다 메트릭으로. `http.server.requests` 5xx 비율, 지연 p99, 큐 lag가 1차. 로그 기반 알림은 `event=outbox.publish_failed`처럼 메트릭이 없는 비즈니스 실패에만.

## 8. 메트릭 - 상세

- 요청 수/지연/오류율은 Micrometer가 `http.server.requests`로 자동 수집. 로그를 count해서 만들지 않는다.
- 비즈니스 카운터는 `MeterRegistry`로: `Counter.builder("order.placed").tag("channel", ch).register(registry).increment()`. 태그 카디널리티 주의(ID 태그 금지).
- 처리 시간은 `@Timed` 또는 `Timer.Sample`. 로그의 `durationMs`는 개별 요청 추적용, 메트릭의 히스토그램은 집계용. 둘 다 남긴다.
- 배치는 `batch.processed`, `batch.failed` 카운터 + 마지막 성공 시각 게이지(`batch.last_success_epoch`). "배치가 안 돌았다"는 로그가 없어서 로그로는 못 잡는다.
- RED(Rate, Errors, Duration) 대시보드 하나를 서비스마다 같은 레이아웃으로. 트레이스에서 "Trace to metrics"로 여기로 온다.

## 9. 샘플링과 양 - 상세

- 트레이스 샘플링: 개발/스테이징 100%, 운영은 10~30%로 시작. 에러가 난 트레이스는 항상 남기는 테일 샘플링(Alloy/Collector의 `tail_sampling` 프로세서)을 켠다. 헤드 샘플링만 쓰면 장애 때 정확히 그 요청의 트레이스가 없다.
- 로그는 샘플링하지 않는다. 대신 레벨과 위치(5장)로 양을 통제한다. 운영에서 DEBUG를 켜야 하면 `logging.level.<패키지>=DEBUG`를 패키지 단위로, 시간 제한을 두고(Actuator `/loggers`로 런타임 변경 후 되돌리기).
- 헬스체크(`/actuator/health`), 정적 자원, OPTIONS는 요청 로그에서 제외.
- 로그 한 줄이 1KB를 넘으면 무언가 잘못 들어간 것이다(바디, 컬렉션 toString). 인코더에 필드 길이 제한(`maxLength`)을 건다.
- 보존 기간: Loki 운영 30일, 감사 목적이면 별도 스토리지. 로컬 파일 로그는 컨테이너에서는 stdout만.

## 하지 말 것 - 이유

- `System.out.println`. 포맷도 레벨도 traceId도 없다.
- `log.info("주문 " + id + " 생성")`. 값이 문자열에 묻혀 검색이 안 된다.
- `catch (Exception e) { log.error("실패", e); throw e; }`를 계층마다. 스택이 세 번 찍힌다.
- `log.error(e.getMessage())`. 스택 없는 ERROR는 원인을 못 찾는다. 예외 객체를 마지막 인자로.
- `log.debug("..." + expensive())`. 레벨이 꺼져 있어도 문자열이 만들어진다. fluent API나 `isDebugEnabled`.
- `traceId`, `memberId`를 Loki 라벨로.
- 운영 전체에 `DEBUG`.
- 요청/응답 바디를 "디버깅용으로 잠깐" 남기는 것. 잠깐이 영원이 된다.
- 로그 개수로 메트릭을 대신하는 것.
- `Thread.currentThread().getName()`으로 요청을 구분하려는 것. traceId가 그 역할이다.
- 헤드 샘플링만 켜고 "에러 트레이스가 없다"고 하는 것.

## 참고

- `rca-procedure` 스킬 - 이 로그를 읽는 절차. 증거 수집 절의 "traceId, 최초 오류" 항목이 여기서 나온다
- `api-design` 스킬 - 응답 `meta.traceId`
- `spring-auth` 스킬 - 인증 실패 로그 접두사/reason 구분, MDC userId
- `config-and-secrets` 스킬 - 설정값 마스킹, 기동 시 덤프 금지
- `harness` 스킬 - 로그 출력은 `tail`로 잘라 hook에 넘기기
- Spring Boot - Logging (구조화 로깅, `logging.structured.format`): https://docs.spring.io/spring-boot/reference/features/logging.html
- Spring Boot - Tracing (Micrometer Tracing, OTLP, 컨텍스트 전파): https://docs.spring.io/spring-boot/reference/actuator/tracing.html
- Micrometer - Context Propagation: https://docs.micrometer.io/context-propagation/reference/
- SLF4J 2 fluent API: https://www.slf4j.org/manual.html#fluent
- logstash-logback-encoder: https://github.com/logfellow/logstash-logback-encoder
- Grafana Loki - Labels best practices (카디널리티): https://grafana.com/docs/loki/latest/get-started/labels/bp-labels/
- Grafana - Derived fields (Loki -> Tempo): https://grafana.com/docs/grafana/latest/datasources/loki/configure-loki-data-source/#derived-fields
- OpenTelemetry - Tail sampling processor: https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/tailsamplingprocessor
