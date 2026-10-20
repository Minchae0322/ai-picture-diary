# spring-code-review - 참고 자료

`SKILL.md`의 체크리스트 각 항목에 대한 이유, 예시 코드, 리뷰 코멘트 예, 참고 링크를 담는다. SKILL.md와 함께 읽는다.

## 체크리스트 - 이유

### 트랜잭션

- 같은 클래스 내부 호출(self-invocation)은 프록시를 타지 않아 트랜잭션이 적용되지 않는다.
- `@Transactional(readOnly = true)`를 붙이면 Hibernate 플러시 모드가 MANUAL로 바뀌어 더티체킹 비용이 줄고, 일부 DB/드라이버는 읽기 최적화를 한다.
- 체크 예외(checked exception)는 기본 롤백 대상이 아니다. 기본 롤백 대상은 `RuntimeException`과 `Error`다.
- 트랜잭션 안에서 외부 API 호출, 메일 발송, 파일 I/O를 하면 커넥션 점유 시간이 늘고, 외부 실패가 DB 롤백과 얽힌다.
- OSIV(`spring.jpa.open-in-view`)가 켜져 있으면 컨트롤러까지 영속성 컨텍스트가 살아있어 문제가 숨겨질 수 있으니 설정을 확인한다.

### 영속성 / JPA

- 엔티티를 컨트롤러 응답으로 직접 반환하면 순환 참조, 지연 로딩 예외, 불필요한 필드 노출 위험이 있다.
- Lombok `@Data`는 양방향 연관관계에서 `toString`/`hashCode` 무한 루프를 만든다.
- 더티체킹으로 충분한데 `save()`를 부르는 것은 해롭지는 않지만 의도를 흐린다.

### 예외 처리

- Spring Boot 3은 `ProblemDetail`(RFC 9457)을 지원하므로 응답 형식을 통일할 수 있다.
- 비즈니스 예외는 4xx, 예상 못한 예외는 5xx + 알림 대상.

### API / 컨트롤러

- 컨트롤러 안에서 `if (x == null)` 수동 검증은 대개 검증 애노테이션으로 대체 가능.
- 페이징 없는 목록 조회 API는 데이터가 커지면 그대로 장애 원인이 된다.

### 빈 / 설정

- 생성자 주입으로 바꾸면 불변성과 테스트 용이성이 생긴다. Lombok `@RequiredArgsConstructor` + `final` 필드.
- 순환 참조는 Boot 2.6+에서 기본으로 금지되므로 `allow-circular-references`를 켜서 우회한 흔적이 있으면 BLOCKER 수준으로 본다.
- 설정값/시크릿이 포함된 변경은 `config-and-secrets` 스킬 기준으로 본다.
- `RestTemplate`/`WebClient`/`RestClient`의 타임아웃 기본값은 무제한인 경우가 많다. Boot 4는 `@HttpExchange` 인터페이스 + `HttpServiceClient` 자동 설정을 지원하므로 새 클라이언트는 그쪽을 우선한다.

### 동시성 / 상태

- `@Async` 메서드가 같은 클래스에서 호출되면 트랜잭션과 같은 프록시 문제가 생긴다.

### 로깅

- 요청 추적용 식별자(traceId, MDC)가 없으면 RCA 때 추적이 매우 어렵다.
- 값이 메시지 문자열에 끼워져 있지 않고 구조화 인자(`addKeyValue`)여야 한다.
- 예외를 잡아 로그하고 다시 던지면 스택이 중복된다.

### 코드 스타일

- `if-else` 사슬이나 3단 이상 중첩은 early return, enum 위임, switch 표현식, 전략 패턴으로 풀 수 있으면 제안한다. 단, 바꿔서 더 읽기 어려워지면 지적하지 않는다.
- DTO/Command/이벤트/값 객체가 클래스로 되어 있으면 이유가 있는지 본다.
- Stream 파이프라인이 5단계를 넘거나 람다 안에 분기가 있으면 메서드 추출을 제안한다.

### 테스트

- 작성 기준은 `test-writing-guide` 스킬.

## 예시

나쁜 예 - 트랜잭션이 적용되지 않는 내부 호출

```java
@Service
public class OrderService {
    public void placeOrder(OrderRequest req) {
        saveOrder(req);          // 같은 클래스 내부 호출 - 프록시를 타지 않음
    }

    @Transactional
    public void saveOrder(OrderRequest req) { ... }
}
```

리뷰 코멘트 예:

> `[BLOCKER]` `placeOrder` -> `saveOrder`는 self-invocation이라 `@Transactional`이 무시됩니다(Spring AOP 프록시 특성). `placeOrder`에 `@Transactional`을 올리거나, 트랜잭션이 필요한 로직을 별도 빈으로 분리해 주세요.

좋은 예 - 생성자 주입 + 읽기 전용 트랜잭션 + DTO 반환

```java
@Service
@RequiredArgsConstructor
public class ArticleQueryService {
    private final ArticleRepository articleRepository;

    @Transactional(readOnly = true)
    public Page<ArticleSummary> search(ArticleSearchCond cond, Pageable pageable) {
        return articleRepository.search(cond, pageable).map(ArticleSummary::from);
    }
}
```

## 참고

- Spring Framework - Transaction Management: https://docs.spring.io/spring-framework/reference/data-access/transaction.html
- Spring Framework - Understanding AOP Proxies (self-invocation): https://docs.spring.io/spring-framework/reference/core/aop/proxying.html
- Spring Boot - Error Handling / ProblemDetail: https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html
- Hibernate ORM User Guide: https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html
