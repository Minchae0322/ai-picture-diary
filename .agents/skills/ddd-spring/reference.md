# ddd-spring - 참고 자료

`SKILL.md`의 규칙에 대한 이유, 예시 코드, 상세 설명을 담는다. 절 번호는 SKILL.md와 같다.

## 문서의 성격

이 문서는 **판단 기준**이다. 기존 프로젝트를 교과서 DDD 구조로 갈아엎으라는 지침이 아니며, 새 프로젝트든 운영 중인 프로젝트든 같은 기준으로 "지금 이 코드를 어디에 둘 것인가"를 결정하는 데 쓴다.

## 표준 패키지 구조 - 상세

새 프로젝트와 새 모듈은 이 구조를 기본으로 한다. 최상위를 도메인(바운디드 컨텍스트)으로 먼저 나누고, 각 도메인 안에 네 계층을 둔다.

```
com.company.service
├── order/                         # 바운디드 컨텍스트 (도메인 단위)
│   ├── interfaces/                # 표현 계층: Controller, Request/Response DTO
│   │   ├── OrderController
│   │   └── dto/
│   │       ├── OrderRequest       # 오퍼레이션별 static 이너 record
│   │       └── OrderResponse
│   ├── application/               # 응용 계층: 유스케이스, 트랜잭션 경계, Command/Result
│   │   ├── PlaceOrderService      # 또는 OrderFacade (유스케이스 여러 개를 묶을 때)
│   │   ├── OrderQueryService      # 조회 전용 (readOnly)
│   │   ├── command/               # PlaceOrderCommand ...
│   │   └── result/                # OrderResult ... (조회 결과 DTO)
│   ├── domain/                    # 도메인 계층: 엔티티, 값 객체, 도메인 서비스, 리포지토리 인터페이스, 이벤트
│   │   ├── Order                  # 애그리거트 루트
│   │   ├── OrderLine
│   │   ├── Money                  # 값 객체
│   │   ├── OrderStatus
│   │   ├── OrderRepository        # 인터페이스만
│   │   ├── OrderPolicy            # 도메인 서비스 (필요할 때만)
│   │   └── OrderPlacedEvent       # 도메인 이벤트 record
│   └── infrastructure/            # 인프라 계층: JPA/QueryDSL 구현, 외부 API 클라이언트, 메시징
│       ├── OrderJpaRepository     # OrderRepository 구현 (Spring Data 인터페이스 상속)
│       ├── OrderQueryRepository   # QueryDSL 화면용 조회
│       ├── PaymentApiClient
│       └── OrderEventPublisher    # Kafka 등 외부 발행 어댑터
├── member/
│   └── (같은 4계층)
└── common/                        # 공통 예외, 응답 포맷, 유틸(순수 계산만), 설정
```

- `domain`은 상위 계층(`interfaces`, `application`)과 외부 시스템(HTTP 클라이언트, Kafka)을 모른다. 스프링/JPA 애노테이션 자체는 제한하지 않되, 스프링 없이 `new`로 테스트 가능한 상태를 유지한다.
- `infrastructure`가 `domain`의 인터페이스(리포지토리, 외부 연동 포트)를 구현한다(DIP). `application`은 인터페이스만 보고 구현체를 모른다.
- 도메인 간 참조는 `application` 계층에서만 한다. `order.domain`이 `member.domain`을 import하지 않는다. 필요한 값은 ID로 넘기거나 이벤트로 알린다.
- `common`에는 도메인 규칙을 넣지 않는다.

**이름 규칙의 이유**: 표현 계층은 `interfaces`(`presentation`, `api` 대신), 응용 계층은 `application`(`service` 대신)으로 통일한다. 리포지토리는 `domain/OrderRepository extends JpaRepository<Order, Long>`가 기본형이고 `infrastructure`에는 QueryDSL 커스텀 구현을 둔다. 도메인이 Spring Data에 의존하는 대가가 있지만, 포트+어댑터로 나누는 비용이 그보다 큰 경우가 대부분이다. 판단 기준은 4장.

**기존 프로젝트에 적용할 때**

- 이미 `controller/service/repository/domain`처럼 계층 우선으로 되어 있는 프로젝트를 일괄 개명하지 않는다. 파일 수백 개가 움직이고 얻는 것이 없다.
- 새로 추가하는 바운디드 컨텍스트부터 이 구조로 만들고, 기존 코드는 손댈 때 도메인 단위로 옮긴다.
- 개명은 못 해도 의존 방향 규칙(`domain`이 위를 모른다, 리포지토리 인터페이스/구현 분리)은 기존 구조에서도 바로 적용한다.

ArchUnit으로 강제하려면 `harness` 스킬의 규칙 목록을 쓴다(이 문서와 1:1). 없으면 리뷰에서 `domain` 패키지의 import 문을 눈으로 확인한다.

**계층별 애노테이션 - 왜 금지 목록이 아닌가**

애노테이션을 계층별로 금지하지는 않는다. SKILL.md의 표는 "보통 어디에 두는가"의 기본값이고, 더 나은 방법이 있으면 그쪽을 쓴다. 판단 기준은 애노테이션 자체가 아니라 **의존 방향이 깨지는가**다.

- `@Transactional`은 유스케이스 단위 원자성을 지키는 `application`이 기본 위치다. 컨트롤러에 있으면 범위가 HTTP 변환까지 늘어나고, 리포지토리 구현에 있으면 유스케이스가 쪼개진다. 아웃박스 저장처럼 인프라 사정으로 `REQUIRES_NEW`가 필요하면 `infrastructure`에 둬도 된다.
- `domain`에 `@Component`/`@Service`를 붙이는 것도 막지 않는다. 도메인 서비스나 전략 구현체를 빈으로 쓰는 게 편하면 붙인다. 다만 그 클래스가 스프링 없이도 `new`로 테스트 가능한 상태를 유지한다(필드 주입 금지, 생성자 주입만).
- `@TransactionalEventListener`는 이벤트를 받아 다른 유스케이스를 실행하면 `application`, Kafka 등으로 내보내기만 하면 `infrastructure`.
- `domain/OrderRepository extends JpaRepository` 타협을 쓸 때 `@Repository`는 붙이지 않아도 된다. Spring Data가 빈을 자동 생성한다.
- 엔티티에 `@Setter`/`@Data`는 애노테이션 문제가 아니라 "규칙이 엔티티 밖으로 새는" 문제라서 계속 피한다(2번 참고).

**헥사고날(포트/어댑터)로 가야 할 때**

같은 도메인에 외부 연동이 많고 구현체를 자주 갈아끼우는 서비스(캐시/API/DB를 상황에 따라 바꾸는 조회 서비스 등)라면 `infrastructure`를 `adapter/in`, `adapter/out`으로, `application`의 인터페이스를 `port/in`, `port/out`으로 더 쪼갠 헥사고날이 맞을 수 있다. 4계층보다 파일이 늘어나므로 기본값은 아니다.

## 판단 기준 - 상세

### 1. 애그리거트 경계

애그리거트는 **한 트랜잭션에서 한 덩어리로 변경되고, 그 안에서 규칙(불변식)이 항상 지켜져야 하는 객체 묶음**이다. 루트 하나를 통해서만 내부를 변경한다.

경계를 정하는 질문 하나:

> A를 바꿀 때 B도 반드시 같이 바뀌어야 하고, 둘 중 하나만 저장되면 데이터가 잘못된 상태가 되는가?

- 예 -> 같은 애그리거트. 예: 주문 + 주문항목, 기사 + 기사본문 버전 + 첨부 목록, 투표 + 투표항목 + 표.
- 아니오 -> 다른 애그리거트. 예: 주문과 회원, 기사와 부서, 투표와 카테고리. 참조 데이터의 이름이 바뀐다고 상대가 깨지지 않으면 따로다.

규칙의 이유:

- 한 트랜잭션에는 애그리거트 하나만 변경하는 것이 기본. 두 개 이상 걸치면 도메인 이벤트로 나눈다(7번). 정말 같이 바뀌어야 한다면 경계를 다시 본다.
- 애그리거트는 작게. 컬렉션이 수천 건으로 자랄 수 있는 자식은 같은 애그리거트에 넣지 않는다(로딩 비용이 곧 장애다).

**다른 애그리거트 참조 방식**

- 신규 코드 기준: 다른 서비스나 다른 컨텍스트가 소유한 것(사용자, 조직, 외부 시스템 식별자)은 무조건 ID 참조(`Long userId` 또는 `UserId` 값 객체). `@ManyToOne`으로 잡으면 경계가 무너지고 로딩 범위가 번진다.
- 같은 프로젝트 안의 참조 데이터(카테고리, 코드, 상품 마스터 등)는 화면에서 항상 같이 필요하면 `@ManyToOne(fetch = LAZY)` 허용. 단, 변경은 각자 한다.
- 기존 코드의 `@ManyToOne`은 걷어내지 않는다. 이미 fetch join, 응답 DTO 변환, QueryDSL 프로젝션이 그 연관관계에 묶여 있다. 일괄 전환 비용이 얻는 것보다 크다. 새로 만드는 엔티티에만 신규 기준을 적용한다.

### 2. 엔티티가 규칙을 소유한다

- 상태 변경은 의도가 드러나는 메서드로: `order.cancel(reason)`, `article.publish(clock)`, `item.exclude()`.
- 상태 전이와 불변식 검증은 엔티티 안에. `if (entity.getStatus() != DRAFT) throw ...`가 서비스에 있으면 엔티티의 `publish()` 안으로 내린다. 권한 검증도 엔티티가 할 수 있는 것(`validateOwner(userId)`)은 엔티티에.
- 카운터 증감, 음수 방지, 상한 검사 같은 작은 규칙도 엔티티 메서드로. 규칙이 한 곳에 모인다.
- JPA 기본 생성자는 `@NoArgsConstructor(access = PROTECTED)`. 기존 코드가 public이면 새 엔티티부터 적용.
- 생성은 프로젝트 관행(`@Builder` 또는 정적 팩터리)을 따르되, 생성 시 검증할 불변식이 있으면 정적 팩터리(`of`, `create`)를 추가한다. 빌더는 검증을 못 한다.
- 컬렉션은 불변 뷰로 노출(`List.copyOf`, `Collections.unmodifiableList`). 기존 getter를 일괄 변경하지는 않는다.

**엔티티가 받는 파라미터**

- 엔티티는 컨트롤러 요청 DTO를 직접 받지 않는다. `interfaces` 계층의 타입이 도메인으로 들어오면 의존 방향이 깨진다.
- 파라미터가 3~4개면 값으로 받는다: `review.update(rating, comment)`.
- 그보다 많으면 `application/command`의 Command record로 묶는다: `article.updateMeta(ArticleMetaUpdateCommand cmd)`. 요청 DTO에 `toCommand()`를 둔다.

```java
// application/command
public record ArticleMetaUpdateCommand(String headline, Long categoryId,
                                       LocalDateTime scheduledAt, Visibility visibility) {}

// interfaces/dto - Request
public ArticleMetaUpdateCommand toCommand() { ... }

// domain
public void updateMeta(Category category, ArticleMetaUpdateCommand cmd) {
    validateEditable();
    this.headline = Headline.of(cmd.headline());
    ...
}
```

기존 코드에 요청 DTO를 직접 받는 엔티티가 있으면 **건드릴 때 함께 정리**한다. 일괄 리팩터링 대상이 아니다.

### 3. 값 객체 - 조건부 도입

금액, 기간, 이메일, 헤드라인 같은 값을 감싸는 값 객체는 검증을 한 곳에 모으는 좋은 도구지만, 기존 프로젝트에 전면 도입하면 마이그레이션 비용만 크다.

도입 조건(둘 다 만족할 때):

- 같은 검증이 3곳 이상에 복붙되어 있다.
- 그 값이 항상 함께 다니는 필드 묶음이다(시작일+종료일, 금액+통화 등).

그때 `record`(엔티티 밖) 또는 `@Embeddable`(엔티티 필드)로 만들고 생성 시 검증한다. 불변. `equals/hashCode`는 값 기준.
새 프로젝트라면 처음부터 원시 타입 집착(primitive obsession)을 피하는 쪽이 낫다.

### 4. 리포지토리

- 애그리거트 루트 단위로 하나. 자식 엔티티 전용 리포지토리가 이미 있으면 유지하되, 새로 만들 때는 루트 리포지토리로 충분한지 먼저 본다.
- **기본형은 파일 하나다**: `domain/XxxRepository extends JpaRepository<Xxx, Long>`. 호출 사슬은 `Controller -> Service -> Repository` 그대로다.

```java
// domain/ArticleRepository.java - 이게 전부다
public interface ArticleRepository extends JpaRepository<Article, Long> {

    @Query("""
        select a from Article a
         where a.memberId = :memberId
         order by a.publishedAt desc, a.id desc
        """)
    List<Article> findFirstPage(@Param("memberId") Long memberId, Limit limit);
}
```

포트 + 어댑터로 나누는 것은 SKILL.md 4장의 세 조건에 해당할 때만이다. 나눈 모습은 이렇다.

```java
// domain/ArticleRepository.java - 포트. Spring Data 타입이 시그니처에 없다
public interface ArticleRepository {
    Article save(Article article);
    Optional<Article> findById(Long id);
    List<Article> findSliceByMember(Long memberId, ArticleCursor cursor, int sizePlusOne);
}

// infrastructure/ArticleJpaRepository.java - Spring Data
interface ArticleJpaRepository extends JpaRepository<Article, Long> { ... }

// infrastructure/ArticleRepositoryAdapter.java - 어댑터
@Repository
class ArticleRepositoryAdapter implements ArticleRepository {

    private final ArticleJpaRepository jpa;

    @Override
    public List<Article> findSliceByMember(Long memberId, ArticleCursor cursor, int sizePlusOne) {
        Limit limit = Limit.of(sizePlusOne);
        // 이 분기가 어댑터의 존재 이유다. 이게 없으면 나눌 이유도 없다
        return cursor == null
                ? jpa.findFirstPage(memberId, limit)
                : jpa.findAfterCursor(memberId, cursor.publishedAt(), cursor.id(), limit);
    }

    @Override public Article save(Article a) { return jpa.save(a); }          // 위임만
    @Override public Optional<Article> findById(Long id) { return jpa.findById(id); }  // 위임만
}
```

**위 어댑터의 메서드 3개 중 2개는 위임만 한다.** 분기가 있는 `findSliceByMember` 하나 때문에 파일 셋을 유지할 가치가 있는지가 판단 지점이다. 분기를 `default` 메서드나 서비스로 올릴 수 있으면 기본형이 낫다.

```java
// 분기를 default 메서드로 올려 기본형을 유지하는 방법
public interface ArticleRepository extends JpaRepository<Article, Long> {

    List<Article> findFirstPage(Long memberId, Limit limit);
    List<Article> findAfterCursor(Long memberId, LocalDateTime cursorPublishedAt, Long cursorId, Limit limit);

    default List<Article> findSliceByMember(Long memberId, ArticleCursor cursor, int sizePlusOne) {
        Limit limit = Limit.of(sizePlusOne);
        return cursor == null
                ? findFirstPage(memberId, limit)
                : findAfterCursor(memberId, cursor.publishedAt(), cursor.id(), limit);
    }
}
```

대가는 도메인이 Spring Data를 알게 되는 것이다. 대부분의 팀이 받아들이는 거래이고, 받아들였다면 그걸 막는 ArchUnit 규칙을 함께 켜지 않는다(`harness`). 문서와 하네스가 다른 말을 하면 둘 다 안 지켜진다.
- 화면용 복잡 조회는 `infrastructure/XxxQueryRepository`로 분리한다. QueryDSL/네이티브 쿼리는 여기에. 도메인 리포지토리에 화면 사정(페이징 조건, 화면 전용 정렬)을 밀어넣지 않는다.
- 메서드 이름은 도메인 언어로. 파생 쿼리 이름이 길어지면 `findPublished()`처럼 감싼다.

### 5. 서비스는 조율만

- 역할: 애그리거트 로드 -> 도메인 메서드 호출 -> 저장 -> (이벤트 발행). 비즈니스 `if`가 서비스에 있으면 도메인으로 내린다.
- `@Transactional`은 `application`이 기본 위치. 도메인 계층에서 HTTP 클라이언트, Kafka 같은 외부 시스템을 직접 호출하지 않는다.
- 클래스 기본은 `@Transactional(readOnly = true)`, 변경 메서드에만 `@Transactional`.
- 입출력은 DTO. 엔티티를 컨트롤러 응답이나 요청 바디로 내보내지 않는다.
- 서비스 클래스가 수백 줄을 넘으면 새 규칙을 더 넣기 전에 도메인으로 내릴 것이 없는지 먼저 본다. 유스케이스 단위로 클래스를 쪼개는 것도 방법이다.

### 6. DTO 규칙

- 요청/응답 DTO는 `interfaces/dto`에, Command는 `application/command`에, 조회 결과 DTO는 `application/result`에.
- 요청/응답은 도메인별 `XxxRequest` / `XxxResponse` 안에 오퍼레이션별 static 이너 record로 둔다(`OrderRequest.Place`, `OrderResponse.Detail`). request와 response를 한 클래스에 섞지 않는다.
- `record` 또는 불변 클래스 권장.

### 7. 도메인 이벤트

한 트랜잭션에서 두 애그리거트를 바꾸고 싶을 때, 또는 알림/외부 연동이 따라올 때 쓴다.

발행 방식은 프로젝트에 이미 있는 경로를 따른다. 없으면 기본은 스프링 이벤트:

```
service -> ApplicationEventPublisher.publishEvent(domainEvent)
        -> @TransactionalEventListener(phase = AFTER_COMMIT) (+ 필요 시 @Async)
        -> 후속 처리(다른 애그리거트 변경, 알림, Kafka 발행)
```

`AbstractAggregateRoot.registerEvent()`(Spring Data)는 엔티티가 이벤트를 모아뒀다가 `save()` 시 발행하는 방식으로, 프로젝트가 이미 쓰고 있으면 따르고 아니면 굳이 도입하지 않는다.

규칙의 이유:

- 알림, 외부 발행은 반드시 커밋 이후(AFTER_COMMIT). 롤백된 행동에 대한 유령 알림을 구조적으로 막는다. 서비스에서 Kafka 프로듀서를 직접 호출하지 않는다.
- AFTER_COMMIT 리스너에서 DB 작업이 필요하면 `@Transactional(propagation = REQUIRES_NEW)`. 그렇지 않으면 커밋된 트랜잭션에 묻어가서 반영되지 않는다.
- AFTER_COMMIT 구간의 예외는 이미 끝난 커밋을 되돌리지 못한다. 유실을 허용하는 도메인(알림 등)이면 로깅으로 보완하고, 허용 못 하는 도메인(정산 등)이면 아웃박스 패턴을 검토한다.
- 도메인 엔티티가 Kafka, HTTP를 알면 안 된다. 이벤트 객체는 `domain`의 순수 record, 외부 발행 어댑터는 `infrastructure`(`OrderEventPublisher`).

### 8. 조회 분리

- 애그리거트 경계는 **변경**을 위한 것이다. 조회를 제약하지 않는다.
- 목록/피드/검색은 도메인 모델을 거치지 않고 DTO 프로젝션으로 바로 뽑는다(CQRS-lite). N+1은 fetch join 또는 배치 페치로 해소한다(`jpa-query-optimization` 스킬).
- 조회 서비스는 `@Transactional(readOnly = true)`. 변경 서비스와 클래스를 나누면 더 깔끔하다.

### 9. 전략 패턴 + 팩토리 - 3갈래 이상이거나 확장이 예상될 때

타입(enum, 코드값)에 따라 동작이 갈리는 분기가 다음 중 하나에 해당하면 전략 인터페이스 + 팩토리로 뺀다.

- 같은 타입 기준의 `switch`/`if-else` 분기가 3갈래 이상이다.
- 같은 타입 분기가 3곳 이상의 서비스/엔티티에 반복된다(분기 위치가 흩어져 있으면 타입 하나 추가할 때 전부 찾아 고쳐야 한다).
- 지금은 2갈래여도 새 타입 추가가 예정되어 있다(결제 수단, 투표 방식, 판매 유형, 알림 채널, 파일 포맷 등).

반대로 2갈래이고 한 곳에만 있고 늘어날 계획이 없으면 엔티티 안 `switch` 하나로 충분하다. 구현이 하나뿐인 인터페이스는 만들지 않는다.

**위치**: 전략 인터페이스와 순수 로직 구현은 `domain`, 외부 연동(PG사 API 호출 등)이 필요한 구현은 `infrastructure`, 팩토리는 구현체를 모아야 하므로 `application`(또는 `infrastructure`)에 둔다.

**스프링에서의 기준 구현** - 팩토리는 `switch`로 구현체를 고르지 말고, 스프링이 주입해 주는 `List<전략>`을 타입 키로 Map에 담는다. 새 타입을 추가할 때 팩토리를 수정하지 않아도 된다(OCP).

```java
// domain
public interface DiscountPolicy {
    DiscountType supports();                 // 이 전략이 담당하는 타입
    Money apply(Money price, Order order);
}

// domain (순수 계산) 또는 infrastructure (외부 연동 필요 시)
@Component
public class RateDiscountPolicy implements DiscountPolicy {
    public DiscountType supports() { return DiscountType.RATE; }
    public Money apply(Money price, Order order) { ... }
}

// application
@Component
public class DiscountPolicyFactory {
    private final Map<DiscountType, DiscountPolicy> policies;

    public DiscountPolicyFactory(List<DiscountPolicy> policies) {
        this.policies = policies.stream()
            .collect(Collectors.toUnmodifiableMap(DiscountPolicy::supports, Function.identity()));
        // 같은 타입에 구현체가 둘이면 여기서 IllegalStateException - 부팅 시점에 잡힌다
    }

    public DiscountPolicy get(DiscountType type) {
        DiscountPolicy policy = policies.get(type);
        if (policy == null) throw new UnsupportedDiscountTypeException(type);
        return policy;
    }
}

// application 서비스에서
Money finalPrice = discountPolicyFactory.get(order.getDiscountType()).apply(price, order);
```

- 전략 구현체는 `@Component`로 등록하는 것이 기본. 스프링 없이 테스트하고 싶으면 순수 클래스로 두고 `@Configuration`에서 `@Bean`으로 등록해도 된다.
- 전략이 상태를 가지면 안 된다. 싱글톤 빈이므로 요청별 데이터는 파라미터로 받는다.
- 타입 enum과 전략의 1:1 대응을 팩토리 생성자에서 검증하면 "구현체 빠뜨림"이 런타임이 아니라 부팅 시점에 드러난다.

## 코드 작성 지향 - 상세

아래는 "기본으로 이렇게 쓰고, 가독성이 나빠지거나 클린 코드에 위배되면 안 써도 된다"는 지향점이다. 지키느라 코드가 더 어려워지면 그게 위반이다.

### if-else 지양

분기가 필요한 자리에서 먼저 이 순서로 대안을 찾는다.

1. **early return / guard clause** - 예외 조건은 먼저 빠져나가고 본 흐름은 들여쓰기 없이 쓴다. `else`가 대부분 사라진다.
2. **enum에 동작 위임** - 타입별로 값이나 계산이 갈리면 enum 상수에 메서드나 람다를 둔다(`DiscountType.RATE.apply(price)`).
3. **다형성 / 전략 패턴** - 3갈래 이상이거나 확장 예정이면 9번 규칙.
4. **Map 조회** - 단순 값 매핑은 `Map<Key, Value>`로.
5. **switch 표현식** - Java 25 기준 `switch`는 표현식 + 패턴 매칭(타입 패턴, 레코드 패턴, `when` 가드)으로 쓴다. `yield` 없이 화살표(`->`)로, enum/sealed 타입은 `default` 없이 컴파일러가 누락을 잡게 한다.

그래도 남는 `if`는 조건에 이름을 붙인다: `if (order.isCancellable())` 은 되고 `if (order.getStatus() == PAID && order.getPaidAt().plusDays(7).isAfter(now))` 는 엔티티 메서드로 옮긴다.

```java
// 지양
public Money calculate(Order order) {
    if (order.getType() == NORMAL) {
        return base;
    } else if (order.getType() == GROUP) {
        return base.multiply(0.9);
    } else {
        return base.multiply(0.8);
    }
}

// 지향 - enum 위임
public enum OrderType {
    NORMAL(price -> price),
    GROUP(price -> price.multiply(0.9)),
    PROXY(price -> price.multiply(0.8));

    private final UnaryOperator<Money> pricing;
    public Money price(Money base) { return pricing.apply(base); }
}

// 지향 - switch 표현식 (enum이면 default 없이)
Money discounted = switch (order.getType()) {
    case NORMAL -> base;
    case GROUP  -> base.multiply(0.9);
    case PROXY  -> base.multiply(0.8);
};
```

중첩 3단 이상이면 무조건 메서드 추출 또는 위 대안으로 푼다.

### record 적극 사용

- **기본 선택**: Command, Query, Result, Request/Response DTO, 도메인 이벤트, 값 객체(`@Embeddable`이 아닌 경우), 조회 프로젝션, 복합 키 - 전부 `record`.
- 생성 시 검증은 compact constructor에:

```java
public record Period(LocalDateTime start, LocalDateTime end) {
    public Period {
        if (end.isBefore(start)) throw new IllegalArgumentException("종료가 시작보다 앞섭니다");
    }
    public boolean contains(LocalDateTime t) { return !t.isBefore(start) && !t.isAfter(end); }
}
```

- 정적 팩터리(`of`, `from(entity)`)를 record 안에 두면 변환 코드가 한 곳에 모인다.
- **record를 쓰지 않는 곳**: JPA `@Entity`(기본 생성자와 가변 상태가 필요), 상속이 필요한 타입, 필드가 10개를 넘어 생성자 호출이 읽기 어려운 DTO(이때는 `@Builder` 클래스 또는 record + 정적 팩터리).
- `@Embeddable`은 Hibernate 6.2+/7.x에서 record를 지원하므로 값 객체를 record로 써도 된다. 구버전 프로젝트만 확인.
- QueryDSL 프로젝션은 `Projections.constructor(XxxResult.class, ...)`로 record 생성자에 바로 매핑한다. `@QueryProjection`도 record에 붙일 수 있다.

### Stream / Optional 지향

**Stream**

- 컬렉션 변환, 필터, 그룹핑, 집계는 Stream이 기본. `for` + 임시 리스트 + `add`보다 의도가 드러난다.
- 파이프라인은 한 줄에 한 연산, 3~5단계까지. 그 이상이면 중간 결과에 이름을 붙이거나 메서드로 뺀다.
- 람다 안에 분기가 들어가면 메서드 참조로 뺀다: `.filter(Order::isPayable)`.
- Stream을 쓰지 않는 경우: 인덱스가 필요한 순회, 반복 중 외부 상태 변경(side effect), 예외를 던져야 하는 변환(체크 예외 특히), 조기 종료가 복잡한 경우, 성능이 민감한 hot path에서 원시 타입 박싱이 생기는 경우. 이때는 `for`가 더 깔끔하다.
- `Collectors.toList()`보다 Java 16+ `.toList()`(불변). 가변 리스트가 필요할 때만 `Collectors.toCollection(ArrayList::new)`.

**Optional**

- 반환 타입에만 쓴다. "없을 수 있음"을 시그니처로 드러내는 것이 목적이다. 필드, 파라미터, 컬렉션 원소에는 쓰지 않는다.
- 컬렉션은 Optional로 감싸지 않는다. 빈 컬렉션을 반환한다.
- `isPresent()` + `get()` 조합은 `if null`과 같다. `map`, `orElseThrow`, `orElseGet`, `ifPresentOrElse`로 푼다.
- 리포지토리 단건 조회는 `Optional<T>` 반환 후 서비스에서 `orElseThrow(() -> new XxxNotFoundException(id))`. 자주 반복되면 리포지토리 default 메서드 `getById(id)`로 감싼다.
- `orElse(expensive())`는 값이 있어도 `expensive()`가 실행된다. 비용이 있으면 `orElseGet`.

```java
// 지양
Optional<Member> member = memberRepository.findById(id);
if (member.isPresent()) {
    return member.get().getName();
} else {
    throw new MemberNotFoundException(id);
}

// 지향
return memberRepository.findById(id)
    .map(Member::getName)
    .orElseThrow(() -> new MemberNotFoundException(id));
```

### Util 클래스

Util은 **도메인을 모르는 순수 계산**을 모아두는 곳이다. 문자열 정리, 날짜 포맷, 마스킹, 해시, 파일명 정규화, 페이징 계산 같은 것. "어느 도메인에서든 똑같이 동작하고, 프로젝트를 바꿔도 그대로 복사해 갈 수 있는가"가 Util에 둘지 판단하는 기준이다.

**Util에 두면 안 되는 것 (가장 흔한 실수)**

- 도메인 규칙. `OrderUtil.isCancellable(order)`는 `order.isCancellable()`이어야 한다. Util에 특정 엔티티 타입이 파라미터로 들어오면 거의 항상 엔티티 메서드로 옮길 대상이다.
- 여러 도메인을 조합하는 로직. 그건 `application` 서비스 또는 도메인 서비스다.
- 리포지토리, 외부 API 호출. Util이 빈을 주입받기 시작하면 이미 Util이 아니다.
- 설정값 의존. `@Value`가 필요하면 아래 "빈으로 만들기".

**만들기 전에 확인**

1. 이미 있는 라이브러리로 되는가. `org.springframework.util.StringUtils`/`CollectionUtils`/`ObjectUtils`, `java.util.Objects`, `java.time`, Apache Commons Lang3(`StringUtils`, `RandomStringUtils`), Guava. 직접 짜는 `isEmpty`, `join`, `capitalize`는 대부분 이미 있다.
2. 같은 계산이 2곳 이상에서 필요한가. 한 곳이면 그 클래스의 private 메서드로 충분하다.
3. 값 객체로 만드는 게 낫지 않은가. `PhoneUtil.normalize(str)`, `PhoneUtil.mask(str)`, `PhoneUtil.isValid(str)`이 함께 다니면 `PhoneNumber` record 하나가 낫다(3번 값 객체 조건 참고).

**작성 규칙**

```java
public final class MaskingUtils {

    private MaskingUtils() {
        throw new AssertionError("인스턴스 생성 금지");
    }

    private static final int VISIBLE_PREFIX = 3;

    /**
     * 앞 3자리만 남기고 나머지를 *로 가린다. null이나 빈 문자열은 그대로 반환한다.
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() <= VISIBLE_PREFIX) {
            return phone;
        }
        return phone.substring(0, VISIBLE_PREFIX) + "*".repeat(phone.length() - VISIBLE_PREFIX);
    }
}
```

- `final` 클래스 + `private` 생성자 + `static` 메서드. 상태(static 가변 필드) 없음. 스레드 안전이 저절로 보장된다.
- 이름은 **하는 일**로 짓는다. `DateUtils`, `StringUtils`처럼 타입 이름을 붙이면 무엇이든 들어오는 쓰레기통이 된다. `MaskingUtils`, `SlugGenerator`, `PageCalculator`, `FilenameSanitizer`처럼 목적을 이름에 넣고, 클래스 하나가 10개 메서드를 넘으면 쪼갠다.
- 접미사는 프로젝트에서 하나로 통일(`Utils` 또는 `Util`). 이 문서 기준은 `Utils`.
- null 처리 정책을 메서드마다 명시한다(Javadoc 한 줄). "null이면 null 반환"과 "null이면 예외"가 섞이면 호출부에서 반드시 사고가 난다.
- 예외는 던지지 않는 쪽이 기본. Util이 도메인 예외를 알면 안 되고, `IllegalArgumentException` 정도만.
- 순수 함수이므로 반드시 단위 테스트를 쓴다. 경계값(null, 빈 문자열, 최소/최대 길이)이 테스트 대상이다. Util은 프로젝트에서 가장 테스트하기 쉬운 코드라서 테스트가 없으면 핑계가 없다.
- 위치: 프로젝트 전역이면 `common/util`, 특정 바운디드 컨텍스트 안에서만 쓰면 그 컨텍스트의 `domain` 또는 `infrastructure`(성격에 따라). 한 컨텍스트에서만 쓰는 걸 `common`에 올리지 않는다.

**날짜/시간은 예외적으로 주의**

`LocalDateTime.now()`를 Util 안에서 부르면 테스트가 불가능해진다. 현재 시각이 필요한 계산은 `Clock`을 파라미터로 받거나, 아예 Util이 아니라 `Clock`을 주입받는 빈으로 만든다. 포맷/파싱처럼 시각을 만들지 않는 것만 Util에 둔다.

```java
// 지양 - 테스트에서 "지금"을 고정할 수 없음
public static boolean isExpired(LocalDateTime expiresAt) {
    return expiresAt.isBefore(LocalDateTime.now());
}

// 지향 - 기준 시각을 밖에서 받음
public static boolean isExpired(LocalDateTime expiresAt, LocalDateTime now) {
    return expiresAt.isBefore(now);
}
```

**static이 아니라 빈으로 만들어야 할 때**

설정값(`@Value`, `@ConfigurationProperties`)이 필요하거나, 외부 리소스(암호화 키, 시간대 설정, `Clock`)에 의존하거나, 구현을 갈아끼워야 하면(테스트 대역 등) `static` Util이 아니라 `@Component`를 붙인 일반 클래스로 만든다. 이름도 `XxxUtils`가 아니라 역할로 짓는다(`TokenEncoder`, `FileStorage`, `IdGenerator`). static 메서드는 mock이 어렵고 설정을 주입할 수 없다.

```java
@Component
@RequiredArgsConstructor
public class MaskingPolicy {
    private final MaskingProperties properties;   // 마스킹 자릿수를 설정으로 받음

    public String maskPhone(String phone) { ... }
}
```

**Util에서 하지 말 것**

- `CommonUtils`, `Utils`, `Helper` 하나에 전부 넣는 것. 이름이 "공통"이면 이미 실패다.
- Util에 엔티티/DTO 타입을 파라미터로 받는 것. 도메인 메서드나 정적 팩터리(`XxxResponse.from(entity)`)로 옮긴다.
- Util에서 `@Autowired` 정적 필드 주입 트릭을 쓰는 것. 빈으로 만든다.
- 테스트 없는 Util.
- 라이브러리에 이미 있는 것을 다시 짜는 것.

## 새 기능을 추가할 때 순서 - 상세

1. 유비쿼터스 언어 확인: 기획/현업 용어를 그대로 클래스와 메서드 이름에 쓴다.
2. 애그리거트 경계 결정(1번 질문).
3. 엔티티에 행위 메서드부터 작성하고 순수 자바 단위 테스트를 쓴다.
4. `domain/XxxRepository`(루트 단위) -> `application` 서비스(조율만) -> `interfaces` 컨트롤러(DTO 변환) 순으로 얇게 붙인다.
5. 다른 애그리거트나 외부 연동이 필요하면 도메인 이벤트로 뺀다.
6. 화면 조회는 별도 쿼리 리포지토리 + DTO 프로젝션.

## 하지 말 것 - 이유

- 운영 중인 프로젝트의 패키지를 표준 구조로 일괄 개명하는 것. 새 컨텍스트부터 적용하고 기존 코드는 손댈 때 옮긴다.
- 최상위를 `interfaces/application/domain/infrastructure`로 나누고 그 아래에 도메인을 두는 계층 우선 구조. 도메인이 먼저다.
- `order.domain`이 `member.domain`을 직접 import하는 것. 도메인 간 참조는 `application`에서 ID/이벤트로.
- 기존 `@ManyToOne`을 ID 참조로 일괄 전환하는 것. fetch join과 DTO 변환이 전부 깨진다.
- 값 객체 전면 도입. 조건(3번)을 만족하는 곳부터.
- 모든 테이블에 애그리거트/리포지토리/서비스를 기계적으로 만드는 것. 단순 참조 데이터는 CRUD로 둔다.
- 특정 애노테이션을 계층별로 금지 목록으로 관리하는 것. 기준은 의존 방향과 테스트 가능성이지 애노테이션이 아니다.
- "Manager", "Helper", "Util" 이름의 클래스에 도메인 규칙을 넣는 것. 유틸은 순수 계산(파싱, 점수 계산)까지만.
- 인터페이스 + 구현체 + 어댑터로 파일만 늘리는 것.
- 커밋 전에 알림/외부 이벤트를 발행하는 것.

## 왜 하는가

도메인 로직이 엔티티에 있으면 스프링 컨텍스트 없이 순수 자바로 단위 테스트할 수 있다. 상태 전이 규칙, 점수 계산, 자동 전환 조건 같은 핵심 규칙이 `new Entity()` 하고 메서드 호출하는 테스트로 검증된다. 이것이 실질적 이득이고, 패키지 이름은 아니다.

## 참고

- 프로젝트의 `CLAUDE.md` / 컨벤션 문서 - 있으면 이 문서보다 우선
- `jpa-query-optimization` 스킬 - 조회 분리 후 N+1/배치 처리
- `test-writing-guide` 스킬 - 도메인 단위 테스트 작성
- 최범균, *도메인 주도 개발 시작하기* (2022) - 스프링/JPA 기준 실무서
- Vaughn Vernon, *Implementing Domain-Driven Design* (2013) - 애그리거트 설계 규칙
- Spring Framework - `@TransactionalEventListener`: https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html
- Spring Data - Domain Events: https://docs.spring.io/spring-data/jpa/reference/repositories/core-domain-events.html
