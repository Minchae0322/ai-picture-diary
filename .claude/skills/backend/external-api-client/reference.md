# external-api-client - 참고

SKILL.md의 절 번호와 같은 순서.

## 0. 클라이언트 선택

### 현재 상태 (2026-09 확인)

| 클라이언트 | 상태 | 용도 |
|---|---|---|
| `RestTemplate` | Framework 7.0에서 deprecation 예고, 7.1 `@Deprecated`, 8.0 제거 예정 | 신규 금지, 기존은 점진 교체 |
| `RestClient` | 동기/블로킹 권장 기본값 (6.1+) | 대부분의 서버-투-서버 호출 |
| `WebClient` | 유지, deprecated 아님 | 리액티브 스택, 스트리밍, 대량 팬아웃 |
| `@HttpExchange` HTTP 서비스 클라이언트 | Framework 7 / Boot 4에서 그룹 등록·프로퍼티 설정 강화 | 권장 형태. 내부 어댑터로 RestClient 또는 WebClient 사용 |

출처: [The state of HTTP clients in Spring](https://spring.io/blog/2025/09/30/the-state-of-http-clients-in-spring/), [HTTP Service Client Enhancements](https://spring.io/blog/2025/09/23/http-service-client-enhancements/)

### 선언형 클라이언트

```java
// infrastructure/payment/PgClient.java
@HttpExchange(url = "/v1/payments", accept = "application/json")
public interface PgClient {

    @PostExchange
    PgApproveResponse approve(@RequestBody PgApproveRequest request,
                              @RequestHeader("Idempotency-Key") String idempotencyKey);

    @GetExchange("/{paymentKey}")
    PgPaymentResponse get(@PathVariable String paymentKey);
}
```

Boot 4 그룹 등록:

```java
@Configuration
@ImportHttpServices(group = "pg", types = PgClient.class)
class PgClientConfig {

    @Bean
    HttpServiceGroupConfigurer pgConfigurer(PgProperties properties) {
        return groups -> groups.filterByName("pg")
                .forEachClient((group, builder) ->
                        builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.secretKey()));
    }
}
```

```yaml
spring:
  http:
    client:
      service:
        connect-timeout: 2s          # 그룹 공통 기본값
        read-timeout: 5s
        group:
          pg:
            base-url: ${PG_BASE_URL}
            read-timeout: 10s        # 결제는 더 길게
          notification:
            base-url: ${NOTI_BASE_URL}
            read-timeout: 2s
```

버전에 따라 프로퍼티 키와 `@ImportHttpServices` 속성이 다를 수 있으니 적용 전 해당 Boot 버전의 레퍼런스를 확인한다(확실하지 않으면 `spring-boot` 문서의 "HTTP Service Clients" 절).

### Boot 3.x / 회사 레거시(2.7)에서는

```java
@Bean
PgClient pgClient(RestClient.Builder builder, PgProperties properties) {
    RestClient restClient = builder
            .baseUrl(properties.baseUrl())
            .requestFactory(clientHttpRequestFactory(Duration.ofSeconds(2), Duration.ofSeconds(10)))
            .build();
    return HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(restClient))
            .build()
            .createClient(PgClient.class);
}
```

Boot 2.7에는 `RestClient`가 없다(6.1부터). 그 환경에서는 `RestTemplate` + `HttpComponentsClientHttpRequestFactory`를 쓰되 타임아웃 규칙(1장)은 동일하게 적용하고, 업그레이드 시 교체 대상으로 표시한다.

### 가상 스레드

Java 21+에서 `spring.threads.virtual.enabled=true`면 블로킹 호출의 스레드 비용이 크게 낮아진다. "동시 호출이 많다"는 이유만으로 WebFlux 전환을 제안하지 않는다. 전환은 스택 전체를 바꾸는 결정이고, 중간에 `block()`이 하나라도 들어가면 이점이 사라진다.

## 1. 타임아웃과 커넥션 풀

```java
ClientHttpRequestFactory clientHttpRequestFactory(Duration connect, Duration read) {
    ClientHttpRequestFactorySettings settings = ClientHttpRequestFactorySettings.defaults()
            .withConnectTimeout(connect)
            .withReadTimeout(read);
    return ClientHttpRequestFactoryBuilder.httpComponents().build(settings);
}
```

Apache HttpClient 5 풀 설정 예:

```java
PoolingHttpClientConnectionManager manager = PoolingHttpClientConnectionManagerBuilder.create()
        .setMaxConnTotal(50)          // 시스템별로 분리
        .setMaxConnPerRoute(50)
        .setDefaultConnectionConfig(ConnectionConfig.custom()
                .setConnectTimeout(Timeout.ofSeconds(2))
                .setSocketTimeout(Timeout.ofSeconds(10))
                .setValidateAfterInactivity(TimeValue.ofSeconds(5))
                .build())
        .build();
```

- 풀에서 커넥션을 못 얻고 기다리는 시간(`connectionRequestTimeout`)도 반드시 설정한다. 여기가 비어 있으면 장애 때 요청이 무한히 쌓인다.
- 예산 계산 예: 내 API 타임아웃 30초, 외부 읽기 10초, 재시도 2회 -> 최악 20초 + 백오프. 세 번째 재시도를 넣으면 예산을 넘는다.
- 값은 실측 후 조정한다. 측정 전 수치는 전부 "잠정"이다.

## 2. 재시도

Spring Retry 조합:

```java
@Retryable(
    retryFor = { ResourceAccessException.class, HttpServerErrorException.class },
    noRetryFor = { HttpClientErrorException.BadRequest.class },
    maxAttempts = 3,
    backoff = @Backoff(delay = 200, multiplier = 2, maxDelay = 2000, random = true))
public PgApproveResponse approve(PgApproveRequest request, String idempotencyKey) {
    return pgClient.approve(request, idempotencyKey);
}

@Recover
PgApproveResponse recover(RuntimeException e, PgApproveRequest request, String idempotencyKey) {
    throw new PaymentUnavailableException(e);   // 우리 예외로 변환
}
```

- 429의 `Retry-After`(초 또는 HTTP-date)를 존중한다. 무시하고 백오프만 쓰면 차단당한다.
- POST 재시도는 상대가 멱등성 키를 지원할 때만. 지원하지 않으면 재시도 대신 "상태 조회 후 판단"으로 바꾼다.
- 재시도 횟수는 로그 필드(`retry_count`)로 남긴다. 대시보드에서 상대 불안정을 조기에 본다.

## 3. Resilience4j 조합

```yaml
resilience4j:
  circuitbreaker:
    instances:
      pg:
        sliding-window-type: COUNT_BASED
        sliding-window-size: 50
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10s
        permitted-number-of-calls-in-half-open-state: 5
        record-exceptions:
          - org.springframework.web.client.HttpServerErrorException
          - java.io.IOException
```

```java
@CircuitBreaker(name = "pg", fallbackMethod = "approveFallback")
public PgApproveResponse approve(...) { ... }

PgApproveResponse approveFallback(PgApproveRequest request, String key, Throwable t) {
    throw new PaymentUnavailableException(t);   // 또는 대체 응답
}
```

- 애노테이션 순서 주의: 보통 서킷 브레이커가 바깥, 재시도가 안쪽(또는 반대)이며 의도에 따라 다르다. "서킷이 열렸을 때 재시도가 계속 도는" 조합이 되지 않게 확인한다.
- `record-exceptions`에 4xx를 넣지 않는다. 내 요청이 잘못된 것으로 서킷을 열면 안 된다.
- 임계값(50%, 10초)은 출발점일 뿐이다. 실제 실패율 분포를 보고 조정한다.

### 선택 의존 격리

```java
try {
    notificationClient.send(message);
} catch (Exception e) {
    log.atWarn().setMessage("알림 발송 실패")
       .addKeyValue("event", "external.notification.send.failed")
       .addKeyValue("orderId", orderId)
       .setCause(e).log();
    // 주 흐름은 계속
}
```

이 형태를 쓸 때는 "실패해도 되는 호출"임을 주석이나 메서드 이름으로 명시한다. 아무 데나 붙이면 실패가 조용히 사라진다.

## 5. 에러 매핑

```java
class PgErrorHandler implements ResponseErrorHandler {

    @Override
    public boolean hasError(ClientHttpResponse response) throws IOException {
        return response.getStatusCode().isError();
    }

    @Override
    public void handleError(URI url, HttpMethod method, ClientHttpResponse response) throws IOException {
        String body = StreamUtils.copyToString(response.getBody(), StandardCharsets.UTF_8);
        String snippet = body.length() > 500 ? body.substring(0, 500) : body;
        if (response.getStatusCode().is4xxClientError()) {
            throw new PgRequestException(response.getStatusCode(), snippet);
        }
        throw new PgServerException(response.getStatusCode(), snippet);
    }
}
```

- 4xx와 5xx를 다른 예외로 나눈다. 재시도 여부와 로그 레벨이 다르다.
- 본문은 앞부분만. 개인정보가 섞일 수 있으므로 필요 시 마스킹한다.
- 이 예외들을 전역 예외 핸들러에서 우리 `ErrorCode`로 바꾼다(`api-design`).

Jackson 관대 설정:

```yaml
spring:
  jackson:
    deserialization:
      fail-on-unknown-properties: false
```

필수 필드는 record 생성자에서 검증한다. "관대하게 파싱"과 "필수 값 누락을 눈감기"는 다르다.

## 8. WireMock 테스트

```java
@SpringBootTest
@AutoConfigureWireMock(ports = 0)
class PgClientTest {

    @Autowired PgClient pgClient;

    @Test
    void 승인_성공() {
        stubFor(post(urlPathEqualTo("/v1/payments"))
                .willReturn(okJson(read("fixtures/pg/approve-200.json"))));

        PgApproveResponse response = pgClient.approve(request, "key-1");

        assertThat(response.status()).isEqualTo("DONE");
    }

    @Test
    void 서버오류는_PgServerException() {
        stubFor(post(urlPathEqualTo("/v1/payments")).willReturn(serverError()));

        assertThatThrownBy(() -> pgClient.approve(request, "key-1"))
                .isInstanceOf(PgServerException.class);
    }

    @Test
    void 읽기_타임아웃() {
        stubFor(post(urlPathEqualTo("/v1/payments"))
                .willReturn(okJson("{}").withFixedDelay(15_000)));

        assertThatThrownBy(() -> pgClient.approve(request, "key-1"))
                .isInstanceOf(ResourceAccessException.class);
    }
}
```

- 픽스처(`approve-200.json`)는 상대 문서의 예시 응답을 그대로 저장한다. 스펙 변경 감지의 기준점이 된다.
- 타임아웃 테스트는 실제 대기 시간이 있으므로 테스트용 타임아웃을 짧게 오버라이드한다.
- `MockRestServiceServer`는 `RestClient`/`RestTemplate` 단위 테스트에 더 가볍다. 커넥션 계층까지 검증하려면 WireMock.

## 9. LLM 등 유료 API

```java
@ConfigurationProperties("app.llm")
@Validated
public record LlmProperties(
        @NotBlank String baseUrl,
        @NotBlank String apiKey,
        @Positive int maxOutputTokens,
        @Positive int maxCallsPerRequest,
        @NotNull Duration readTimeout) {}
```

- 한 사용자 요청이 만들 수 있는 최대 호출 수를 상수로 막는다(에이전트/루프 구조에서 특히).
- 로그 필드: `event=external.llm.call`, `model`, `input_tokens`, `output_tokens`, `duration_ms`, `finish_reason`.
- 프롬프트 원문을 그대로 로그에 남기지 않는다. 길이와 해시, 또는 앞부분만.
- 스트리밍 응답은 읽기 타임아웃 개념이 다르다(첫 바이트까지 vs 전체). 별도 클라이언트 빈 + 별도 타임아웃.

## 10. 로그 예시

```java
long start = System.nanoTime();
try {
    PgApproveResponse response = pgClient.approve(request, key);
    log.atInfo().setMessage("PG 승인")
       .addKeyValue("event", "external.pg.approve")
       .addKeyValue("target", "pg")
       .addKeyValue("path", "/v1/payments")
       .addKeyValue("status", 200)
       .addKeyValue("duration_ms", elapsedMs(start))
       .addKeyValue("orderId", request.orderId())
       .log();
    return response;
} catch (PgServerException e) {
    log.atError().setMessage("PG 승인 실패")
       .addKeyValue("event", "external.pg.approve.failed")
       .addKeyValue("target", "pg")
       .addKeyValue("status", e.status().value())
       .addKeyValue("duration_ms", elapsedMs(start))
       .setCause(e).log();
    throw e;
}
```

반복되면 인터셉터(`ClientHttpRequestInterceptor` 또는 `HttpServiceGroupConfigurer`)로 한 번에 처리한다. 필드 이름은 `logging-observability`와 맞춘다.

## 참고

- The state of HTTP clients in Spring: https://spring.io/blog/2025/09/30/the-state-of-http-clients-in-spring/
- HTTP Service Client Enhancements: https://spring.io/blog/2025/09/23/http-service-client-enhancements/
- Spring Framework - REST Clients: https://docs.spring.io/spring-framework/reference/integration/rest-clients.html
- Resilience4j: https://resilience4j.readme.io/docs/getting-started
- WireMock: https://wiremock.org/docs/
