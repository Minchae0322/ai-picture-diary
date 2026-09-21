---
name: ddd-spring
description: 스프링 프로젝트에서 도메인 로직을 어디에 둘지 판단할 때 자동 적용. "새 기능 만들어", "도메인 설계", "이 로직 어디에 둬", "서비스가 너무 커졌어", "엔티티에 로직", "패키지 구조", "리팩터링" 요청이나 새 엔티티·서비스 클래스가 생기는 순간 트리거. 도메인 우선 4계층 패키지, 애그리거트 경계 판단, 엔티티 책임, 도메인 이벤트, 조회 분리, 전략+팩토리 기준, 코드 작성 지향(if-else 지양/record/Stream/Optional/Util)을 담는다.
---

# DDD 적용 기준 - 스프링/JPA 범용

비즈니스 규칙이 서비스로 새어나가 "거대 서비스 + 빈 엔티티"가 되는 것을 막는 **판단 기준**이다. 기존 프로젝트를 교과서 DDD로 갈아엎으라는 지침이 아니며, "지금 이 코드를 어디에 둘 것인가"를 결정하는 데 쓴다.

## 적용 전에 먼저 확인할 것

1. 프로젝트의 `CLAUDE.md`, 컨벤션 문서, 아키텍처 스킬이 우선. 이 문서는 그 위의 기본값.
2. 기존 패키지 구조 파악. 새 프로젝트/모듈은 아래 표준 구조, 기존은 계층 이름이 달라도 역할이 대응되면 두고 의존 방향 규칙만 적용.
3. 리치 도메인(엔티티에 행위 메서드 있음)이면 유지, anemic이면 새로 손대는 코드부터 점진적으로 옮긴다.

## 표준 패키지 구조 - 도메인 우선 + 4계층

```
com.company.service
├── order/                         # 바운디드 컨텍스트 (도메인 단위)
│   ├── interfaces/                # Controller, dto/ (XxxRequest/XxxResponse, 오퍼레이션별 static 이너 record)
│   ├── application/               # 유스케이스 서비스(PlaceOrderService 또는 OrderFacade), OrderQueryService(readOnly), command/, result/
│   ├── domain/                    # 애그리거트 루트(Order), OrderLine, 값 객체(Money), OrderStatus, OrderRepository(기본형: extends JpaRepository), OrderPolicy(도메인 서비스), OrderPlacedEvent(record)
│   └── infrastructure/            # OrderQueryRepository(QueryDSL 화면 조회), 어댑터(4번 조건 해당 시에만), PaymentApiClient, OrderEventPublisher
├── member/                        # (같은 4계층)
└── common/                        # 공통 예외, 응답 포맷, 유틸(순수 계산만), 설정. 도메인 규칙 금지
```

의존 방향: **`interfaces -> application -> domain <- infrastructure`**.

- `domain`은 상위 계층과 외부 시스템(HTTP 클라이언트, Kafka)을 모른다. 스프링/JPA 애노테이션은 제한하지 않되 `new`로 테스트 가능하게 유지.
- `infrastructure`가 `domain`의 인터페이스를 구현(DIP). `application`은 구현체를 모른다.
- 도메인 간 참조는 `application`에서만. `order.domain`이 `member.domain`을 import하지 않는다. ID 또는 이벤트로.
- 이름: 표현 계층은 `interfaces`, 응용 계층은 `application`으로 통일. `domain/OrderRepository extends JpaRepository`가 **기본형**이고(4번), `infrastructure`에는 QueryDSL 커스텀 구현과 어댑터가 필요할 때만 둔다.
- 기존 계층 우선 프로젝트는 일괄 개명하지 않는다. 새 바운디드 컨텍스트부터 적용, 기존은 손댈 때 도메인 단위로. 의존 방향 규칙은 기존 구조에서도 바로 적용.
- ArchUnit 강제는 `harness` 스킬 규칙 목록(이 문서와 1:1). 없으면 리뷰에서 `domain` import 문 확인.
- 외부 연동이 많고 구현체를 자주 갈아끼우면 헥사고날(`adapter/in|out`, `port/in|out`)도 가능. 기본값은 아니다.

**계층별 애노테이션 - 기본 위치** (금지 목록이 아니다. 기준은 **의존 방향이 깨지는가**)

| 계층 | 보통 여기에 두는 것 |
|---|---|
| `interfaces` | `@RestController`, `@RequestMapping` 계열, `@Valid`, `@RequestBody`, `@PathVariable`, `@RestControllerAdvice`, `@ExceptionHandler`, DTO의 Bean Validation(`@NotBlank`, `@Size` 등) |
| `application` | `@Service`, `@Transactional`, `@TransactionalEventListener`, `@Async` |
| `domain` | JPA 매핑(`@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@Column`, `@Enumerated`, `@Embeddable`, `@Embedded`, 연관관계, `@Version`), Lombok `@Getter`, `@NoArgsConstructor(access = PROTECTED)`, `@Builder` |
| `infrastructure` | `@Repository`, `@Component`, `@Configuration`, `@Bean`, `@Query`, `@Modifying`, `@EntityGraph`, `@Lock`, QueryDSL, `RestClient`/`@FeignClient` 설정, `@KafkaListener` |

- `@Transactional` 기본 위치는 `application`. 아웃박스 등 인프라 사정으로 `REQUIRES_NEW`가 필요하면 `infrastructure`도 가능.
- `domain`에 `@Component`/`@Service` 허용. 단 생성자 주입만(필드 주입 금지), `new`로 테스트 가능하게.
- `@TransactionalEventListener`: 다른 유스케이스 실행이면 `application`, 외부로 내보내기만 하면 `infrastructure`.
- `JpaRepository`를 상속하면 `@Repository`가 불필요하다. 엔티티 `@Setter`/`@Data`는 계속 금지(2번).

## 판단 기준

### 1. 애그리거트 경계
- 정의: 한 트랜잭션에서 한 덩어리로 변경되고 불변식이 항상 지켜지는 객체 묶음. 루트를 통해서만 변경.
- 질문: "A를 바꿀 때 B도 반드시 같이 바뀌어야 하고, 하나만 저장되면 잘못된 상태가 되는가?" 예 -> 같은 애그리거트, 아니오 -> 다른 애그리거트.
- `root.getChildren().add(x)` 대신 `root.addChild(x)`. 한 트랜잭션에 애그리거트 하나만 변경, 둘 이상이면 도메인 이벤트(7번). 수천 건으로 자라는 자식은 같은 애그리거트에 넣지 않는다.
- 참조: 다른 서비스/컨텍스트 소유(사용자, 조직, 외부 식별자)는 **무조건 ID 참조**. 같은 프로젝트 참조 데이터는 `@ManyToOne(fetch = LAZY)` 허용, 변경은 각자. **기존 `@ManyToOne`은 걷어내지 않는다.**

### 2. 엔티티가 규칙을 소유한다
- `@Setter`, `@Data` 금지. 상태 변경은 의도가 드러나는 메서드(`order.cancel(reason)`, `article.publish(clock)`).
- 상태 전이, 불변식, 엔티티가 할 수 있는 권한 검증(`validateOwner(userId)`), 카운터/음수/상한 같은 작은 규칙도 엔티티 안에.
- 기본 생성자 `@NoArgsConstructor(access = PROTECTED)`. 생성 시 검증 불변식이 있으면 정적 팩터리(`of`, `create`) 추가(빌더는 검증 못 함). 컬렉션은 불변 뷰로 노출.
- 엔티티는 **요청 DTO를 직접 받지 않는다.** 파라미터 3~4개는 값으로, 그 이상은 `application/command` Command record(`toCommand()`). 기존 위반은 건드릴 때 정리.

### 3. 값 객체 - 조건부 도입
- 조건(둘 다): 같은 검증이 **3곳 이상** 복붙 + 항상 함께 다니는 필드 묶음. 그때 `record` 또는 `@Embeddable`, 생성 시 검증, 불변, 값 기준 `equals/hashCode`. 새 프로젝트는 처음부터 primitive obsession 회피.

### 4. 리포지토리

**기본형은 파일 하나다.** `domain`에 `interface XxxRepository extends JpaRepository<Xxx, Long>` 하나를 두고 끝낸다. 호출 사슬은 익숙한 대로 `Controller -> Service -> Repository`다.

```
domain/ArticleRepository.java        interface ArticleRepository extends JpaRepository<Article, Long>
```

**포트(도메인 인터페이스) + 어댑터(infrastructure 구현)로 나누는 것은 예외다.** 아래 중 하나에 해당할 때만 나눈다.

| 나눠도 되는 경우 | 이유 |
|---|---|
| 구현에 **분기나 조립 로직**이 있다 (커서 유무로 쿼리 선택, 여러 저장소 합성) | 인터페이스가 그 로직을 감춰서 의미를 갖는다 |
| 저장 기술을 **실제로 바꿀 계획**이 있다 (JPA -> MyBatis, RDB -> 문서 DB) | 교체 지점이 명확해진다 |
| 도메인을 Spring Data **없이 단위 테스트**해야 하는 강한 요구가 있다 | 대역을 만들기 쉬워진다 |

셋 다 아닌데 나누면 **위임만 하는 어댑터**가 생긴다. `return jpa.findById(id);` 같은 메서드만 늘어나고, 쿼리 하나 추가할 때마다 파일 세 개를 고쳐야 한다. 이건 "하지 말 것"의 "인터페이스+구현체+어댑터로 파일만 늘리기"에 해당한다.

- 한 프로젝트 안에서 **섞어 써도 된다.** 분기 로직이 있는 리포지토리만 나누고 나머지는 기본형으로 둔다. 일관성보다 각 리포지토리가 실제로 뭘 하는지가 기준이다.
- 애그리거트 루트 단위로 하나.
- **화면용 복잡 조회는 `infrastructure/XxxQueryRepository`로 분리.** 메서드 이름은 도메인 언어(`findPublished()`).
- 기본형을 쓰면 도메인이 Spring Data를 알게 된다. 그걸 막는 ArchUnit 규칙을 함께 켜지 않는다(`harness`).

### 5. 서비스는 조율만
- 로드 -> 도메인 메서드 -> 저장 -> (이벤트). 비즈니스 `if`는 도메인으로. 도메인 계층에서 외부 시스템 직접 호출 금지.
- 클래스 기본 `@Transactional(readOnly = true)`, 변경 메서드에만 `@Transactional`. 입출력은 DTO. 수백 줄 넘으면 도메인으로 내릴 것부터 찾고 유스케이스 단위로 쪼갠다.

### 6. DTO 규칙
- 요청/응답은 `interfaces/dto`, Command는 `application/command`, 조회 결과는 `application/result`.
- 도메인별 `XxxRequest`/`XxxResponse` 안에 오퍼레이션별 static 이너 record(`OrderRequest.Place`). request/response를 한 클래스에 섞지 않는다. `record` 권장.

### 7. 도메인 이벤트
- 두 애그리거트 변경 또는 알림/외부 연동이 따라올 때. 기본은 스프링 이벤트: `publishEvent` -> `@TransactionalEventListener(phase = AFTER_COMMIT)`(+`@Async`). `AbstractAggregateRoot`는 이미 쓰는 프로젝트만.
- **알림, 외부 발행은 반드시 AFTER_COMMIT.** 서비스에서 Kafka 프로듀서 직접 호출 금지.
- AFTER_COMMIT 리스너의 DB 작업은 `REQUIRES_NEW`. 예외는 커밋을 되돌리지 못한다: 유실 허용이면 로깅, 불허(정산)면 아웃박스.
- 이벤트 객체는 `domain`의 순수 record, 발행 어댑터는 `infrastructure`.

### 8. 조회 분리
- 애그리거트 경계는 변경용. 목록/피드/검색은 DTO 프로젝션으로 바로(CQRS-lite). N+1은 `jpa-query-optimization` 스킬. 조회 서비스는 `readOnly = true`, 클래스 분리 권장.

### 9. 전략 패턴 + 팩토리
- 조건(하나라도): 같은 타입 분기가 **3갈래 이상** / **3곳 이상** 반복 / **새 타입 추가 예정**. 2갈래·한 곳·확장 없음이면 `switch` 하나로. 구현 하나뿐인 인터페이스 금지.
- 위치: 인터페이스와 순수 구현은 `domain`, 외부 연동 구현은 `infrastructure`, 팩토리는 `application`(또는 `infrastructure`).
- 팩토리는 `switch` 대신 주입된 `List<전략>`을 `supports()` 키로 Map에 담고 생성자에서 1:1 대응 검증(OCP, 부팅 시점 검출). 전략은 상태 없음, `@Component` 기본.

## 코드 작성 지향 (금지가 아니라 기본값. 지키느라 더 어려워지면 그게 위반)

- **if-else 지양**, 순서: 1) early return/guard 2) enum에 동작 위임 3) 다형성/전략(9번) 4) Map 조회 5) switch 표현식(Java 25: 화살표, 패턴 매칭, enum/sealed는 `default` 없이). 남는 `if`는 조건에 이름(`order.isCancellable()`). 중첩 3단 이상은 무조건 추출.
- **record 적극 사용**: Command/Query/Result/DTO/이벤트/값 객체(비 `@Embeddable`)/프로젝션/복합 키. 검증은 compact constructor, 정적 팩터리(`of`, `from`)는 record 안. 제외: `@Entity`, 상속 필요, 필드 10개 초과 DTO. `@Embeddable` record는 Hibernate 6.2+/7.x. QueryDSL은 `Projections.constructor`.
- **Stream**: 변환/필터/그룹핑/집계 기본, 한 줄 한 연산 3~5단계, 분기 람다는 메서드 참조. 제외: 인덱스 순회, side effect, 체크 예외, 복잡한 조기 종료, hot path 박싱. `.toList()`(Java 16+) 우선.
- **Optional**: 반환 타입에만. 컬렉션은 빈 컬렉션. `isPresent()+get()` 금지, `map/orElseThrow/orElseGet/ifPresentOrElse`. 단건 조회는 `Optional` -> `orElseThrow(() -> new XxxNotFoundException(id))`. 비용 있으면 `orElseGet`.
- **Util**: 도메인을 모르는 순수 계산만(문자열 정리, 날짜 포맷, 마스킹, 해시, 페이징 계산). 금지: 도메인 규칙, 도메인 조합, 리포지토리/외부 API, 설정값 의존. 만들기 전: 기존 라이브러리 확인, 2곳 이상 사용, 값 객체가 낫지 않은지.
  - `final` + `private` 생성자 + `static`, 상태 없음. 이름은 하는 일로(`MaskingUtils`, `SlugGenerator`), 10개 메서드 넘으면 쪼갠다. 접미사 `Utils` 통일. null 정책 Javadoc 명시. 예외는 `IllegalArgumentException` 정도. **단위 테스트 필수.** 위치: 전역이면 `common/util`, 컨텍스트 전용이면 그 컨텍스트 안.
  - `LocalDateTime.now()`를 Util 안에서 부르지 않는다. 기준 시각/`Clock`을 밖에서 받는다.
  - 설정값·외부 리소스·교체 필요면 static 대신 `@Component` 빈, 이름은 역할로(`TokenEncoder`, `IdGenerator`).
  - Util 금지: `CommonUtils`/`Helper` 쓰레기통, 엔티티/DTO 파라미터, `@Autowired` static 주입, 테스트 없음, 라이브러리 재구현.

## 새 기능을 추가할 때 순서

1. 유비쿼터스 언어 확인 2. 애그리거트 경계 결정 3. 엔티티 행위 메서드 + 순수 자바 단위 테스트 4. `domain/XxxRepository` -> `application`(조율만) -> `interfaces`(DTO 변환) 순으로 얇게 5. 다른 애그리거트/외부 연동은 도메인 이벤트 6. 화면 조회는 별도 쿼리 리포지토리 + DTO 프로젝션.

## 하지 말 것

- 운영 프로젝트 패키지 일괄 개명. 계층 우선 최상위 구조(도메인이 먼저). `order.domain` -> `member.domain` 직접 import.
- 기존 `@ManyToOne` 일괄 ID 전환. 값 객체 전면 도입. 모든 테이블에 애그리거트/리포지토리/서비스 기계 생성(단순 참조 데이터는 CRUD).
- 엔티티 `@Setter`/`@Data`. 엔티티가 요청 DTO를 직접 받는 것. 도메인 계층에서 외부 API/Kafka 직접 호출.
- 애노테이션을 계층별 금지 목록으로 관리. "Manager/Helper/Util"에 도메인 규칙. **위임만 하는 리포지토리 어댑터**(4번의 세 조건에 해당하지 않는데 포트를 나누는 것). 커밋 전 알림/외부 이벤트 발행.

## 관련 스킬

`transaction-and-concurrency`(트랜잭션 경계 확정과 동시성 제어), `jpa-query-optimization`(조회 분리 후 N+1/배치), `test-writing-guide`(도메인 단위 테스트), `harness`(ArchUnit). 프로젝트 `CLAUDE.md`/컨벤션 문서가 있으면 이 문서보다 우선.

## 더 보기
- 이유, 예시 코드, 상세 표, 참고 링크: `reference.md` (판단이 안 서거나 처음 적용할 때만 읽는다)
