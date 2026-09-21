# transaction-and-concurrency - 참고

SKILL.md의 절 번호와 같은 순서. 판단이 안 서거나 처음 적용할 때 읽는다.

## 0. 경계를 왜 묻는가

같은 코드 모양이라도 정답이 다르기 때문이다. "주문 생성 + 재고 차감 + 포인트 적립"을 예로 들면:

- 커머스: 재고 차감이 실패하면 주문도 없어야 한다 -> 한 트랜잭션. 포인트 적립은 나중에 실패해도 보정 가능 -> 커밋 후.
- 예약 서비스: 좌석 선점만 즉시 확정하고 결제는 이후 단계 -> 선점만 한 트랜잭션, 나머지는 별도.
- 사내 시스템: 세 개가 각각 다른 팀 소유라 하나로 묶을 수 없다 -> 이벤트 + 보정.

기술적으로는 셋 다 가능하고, 무엇이 맞는지는 "실패했을 때 무엇을 되돌려야 하는가"라는 업무 답에 달려 있다. AI가 이걸 추측하면 조용히 틀린다. 그래서 질문표가 먼저다.

질문표를 그대로 던지지 말고, 코드에서 읽어낸 후보를 제시하고 확인받는 형태가 낫다.

> "결제 저장 + 주문 상태 변경까지를 한 트랜잭션으로 보고, 알림 발송은 커밋 후로 빼려고 합니다. 결제는 성공했는데 상태 변경이 실패하면 결제도 취소되어야 하나요? 아니면 결제는 남기고 재처리하나요?"

## 1. 경계 기본값

### readOnly가 하는 일

`readOnly = true`는 (1) Hibernate flush 모드를 `MANUAL`로 바꿔 더티 체킹과 스냅샷 보관을 생략하고, (2) JDBC 커넥션에 읽기 전용 힌트를 준다. 조회 화면이 많은 서비스에서 메모리와 CPU를 눈에 띄게 줄인다. 다만 **읽기 전용 트랜잭션 안에서 저장하면 조용히 반영되지 않는** 함정이 있어, 변경 메서드에 재선언을 빠뜨리지 않아야 한다.

```java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;

    public ArticleDetail get(Long id) { ... }          // 읽기 전용

    @Transactional                                       // 변경만 재선언
    public Long publish(Long id) { ... }
}
```

### 내부 호출 함정

```java
// 나쁜 예: publish()에 트랜잭션이 걸리지 않는다
public void publishAll(List<Long> ids) {
    ids.forEach(this::publish);   // 프록시를 거치지 않는 자기 호출
}

@Transactional
public void publish(Long id) { ... }
```

해결은 자기 주입(`@Lazy ArticleService self`)이 아니라 **클래스 분리**다. `publishAll`은 오케스트레이션, `publish`는 별도 컴포넌트로 옮긴다. 자기 주입은 동작하지만 "왜 이렇게 생겼는지"가 코드에 남지 않아 다음 사람이 다시 깨뜨린다.

### 롤백 규칙

```java
@Transactional(rollbackFor = Exception.class)   // 체크 예외도 롤백해야 할 때만 명시
```

`@Transactional` 안에서 예외를 잡고 정상 반환하면 롤백은 일어나지 않는다. 단, 이미 예외로 트랜잭션이 rollback-only로 표시된 뒤라면 커밋 시점에 `UnexpectedRollbackException`이 난다. "잡았는데 롤백됐다"는 대부분 이 경우다.

## 2. 격리 수준과 이상 현상

| 격리 수준 | Dirty Read | Non-repeatable Read | Phantom Read | 비고 |
|---|---|---|---|---|
| READ_UNCOMMITTED | 발생 | 발생 | 발생 | 쓰지 않는다 |
| READ_COMMITTED | 없음 | 발생 | 발생 | PostgreSQL/DB2/Oracle 기본. 실무 기본값 |
| REPEATABLE_READ | 없음 | 없음 | 발생(PostgreSQL은 스냅샷으로 대부분 차단) | MySQL InnoDB 기본 |
| SERIALIZABLE | 없음 | 없음 | 없음 | PostgreSQL은 SSI로 구현, 충돌 시 `40001` 실패 |

- PostgreSQL의 `REPEATABLE_READ`/`SERIALIZABLE`은 락이 아니라 스냅샷 + 충돌 감지다. 그래서 **실패를 재시도로 흡수하는 코드가 필수**다.
- Lost Update(갱신 손실)는 위 표에 없다. `READ_COMMITTED`에서 두 트랜잭션이 같은 행을 읽고 각자 계산해 쓰면 하나가 사라진다. 격리 수준으로는 안 막히고 3장의 수단으로 막는다.

## 3. 수단별 코드

### 원자적 UPDATE

```java
public interface StockRepository extends JpaRepository<Stock, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update Stock s
           set s.quantity = s.quantity - :qty
         where s.id = :id
           and s.quantity >= :qty
        """)
    int decrease(@Param("id") Long id, @Param("qty") int qty);
}
```

```java
int updated = stockRepository.decrease(id, qty);
if (updated == 0) {
    throw new OutOfStockException(id, qty);
}
```

- `clearAutomatically = true`가 없으면 영속성 컨텍스트의 옛 엔티티가 그대로 남아 이후 조회가 옛 값을 준다.
- DB에 `ck_stock_quantity_nonnegative CHECK (quantity >= 0)`를 함께 건다. 코드가 뚫려도 DB가 막는다(`db-schema-and-migration`).
- 도메인 표현력이 약해지는 것이 대가다. "왜 이 UPDATE가 재고 정책인지"를 리포지토리 메서드 이름과 서비스 한 줄로 남긴다.

### 낙관적 락

```java
@Entity
@Table(name = "tb_article")
public class Article {
    @Version
    private int version;   // BaseEntity에 이미 있음
}
```

- 커밋 시 `UPDATE ... WHERE id = ? AND version = ?`가 나가고 영향 행이 0이면 `ObjectOptimisticLockingFailureException`.
- 화면에서는 "다른 사용자가 먼저 수정했습니다"(409)로 바꿔 보여준다.
- 재시도로 흡수할지, 사용자에게 알릴지는 업무 질문(질문표 4).
- `@Version` 컬럼을 나중에 추가하려면 기존 행의 기본값을 0으로 채워야 한다.

### 비관적 락

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
@Query("select s from Seat s where s.id = :id")
Optional<Seat> findByIdForUpdate(@Param("id") Long id);
```

- 타임아웃 단위는 밀리초. PostgreSQL은 `-2`(=`NOWAIT`)나 statement 단위 `lock_timeout`도 쓸 수 있다.
- 락을 잡은 트랜잭션은 짧아야 한다. 락 획득 -> 검증 -> 저장 -> 커밋까지가 수십 ms 안에 끝나는 모양이 아니면 설계를 다시 본다.
- `PESSIMISTIC_READ`는 공유 락. 실무에서 쓸 일이 드물다.

### unique 제약으로 중복 막기

```java
try {
    applicationRepository.saveAndFlush(new Application(memberId, eventId));
} catch (DataIntegrityViolationException e) {
    throw new AlreadyAppliedException(eventId);   // 409 또는 기존 결과 반환
}
```

`saveAndFlush`로 예외 시점을 트랜잭션 커밋이 아니라 이 지점으로 당긴다. 그래야 잡을 수 있다.

## 4. 경쟁 조건 패턴 - 상태 전이

```java
@Modifying(clearAutomatically = true)
@Query("""
    update Order o
       set o.status = :next
     where o.id = :id
       and o.status = :expected
    """)
int transition(@Param("id") Long id,
               @Param("expected") OrderStatus expected,
               @Param("next") OrderStatus next);
```

영향 행 0 = "이미 다른 요청이 전이시켰다". 재시도할 대상이 아니라 대부분 정상 종료(멱등)로 처리한다. 어느 쪽인지는 질문 3.

## 5. 데드락

PostgreSQL 로그 예:

```
ERROR:  deadlock detected
DETAIL:  Process 123 waits for ShareLock on transaction 456; blocked by process 789.
         Process 789 waits for ShareLock on transaction 455; blocked by process 123.
HINT:  See server log for query details.
```

두 프로세스가 서로 반대 순서로 잠갔다는 뜻이다. 확인할 것은 "두 코드 경로가 같은 두 행을 어떤 순서로 건드리는가" 하나다.

```java
// 순서 통일
ids.stream().sorted().forEach(id -> repository.findByIdForUpdate(id));
```

배치와 온라인이 같은 테이블을 건드리면 배치 쪽 청크 순서도 같은 기준(`id` 오름차순)으로 맞춘다.

락 대기 현황 조회 SQL은 `rca-procedure`에 있다. **AI는 실행하지 않고 SQL만 넘긴다**(`db-schema-and-migration` 0장).

## 6. 커밋 후 처리

```java
@Transactional
public Long place(OrderCommand command) {
    Order order = orderRepository.save(Order.place(command));
    events.publishEvent(new OrderPlaced(order.getId()));   // 아직 발행 안 됨
    return order.getId();
}

@Component
class OrderPlacedHandler {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    void on(OrderPlaced event) {
        notificationClient.send(event.orderId());   // 커밋 후 외부 호출
    }
}
```

- `AFTER_COMMIT` 안에서 DB에 쓰려면 `@Transactional(propagation = REQUIRES_NEW)`를 함께 붙인다. 안 붙이면 트랜잭션 없이 실행된다.
- 여기서 예외가 나도 원 트랜잭션은 이미 커밋됐다. 실패해도 되는 일만 둔다. 실패하면 안 되면 "할 일 테이블(outbox) + 재처리 배치"로 만든다.

### Outbox 최소형

같은 트랜잭션에서 `tb_outbox_message`에 INSERT하고, 별도 스케줄러가 미발송 행을 읽어 외부로 보낸 뒤 `sent_at`을 채운다. 중복 발송 가능성을 전제로 수신 측 멱등성을 요구한다(at-least-once).

## 7. 청크 처리

```java
// 나쁜 예: 30만 건을 한 트랜잭션에
@Transactional
public void expireAll() { ... }
```

```java
// 좋은 예: 청크마다 커밋, 재실행 안전
public void expireAll() {
    Long cursor = 0L;
    while (true) {
        List<Long> ids = repository.findExpirableIds(cursor, 1000);
        if (ids.isEmpty()) break;
        chunkService.expire(ids);          // @Transactional 별도 빈
        cursor = ids.get(ids.size() - 1);
    }
}
```

- 중단됐다 다시 돌려도 안전해야 한다. 처리 조건(`status = ACTIVE and expired_at < now()`)이 처리 후 거짓이 되면 자연히 멱등이다.
- 청크 크기는 락 시간과 메모리의 균형. 1,000건 근처에서 시작해 측정 후 조정한다(추정치이므로 측정 전에는 수치를 단정하지 않는다).

## 8. 재시도

```java
@Retryable(
    retryFor = { OptimisticLockingFailureException.class, CannotAcquireLockException.class },
    maxAttempts = 3,
    backoff = @Backoff(delay = 50, multiplier = 2, random = true))
public void publish(Long id) {
    publishService.publish(id);   // 이 안에 @Transactional
}
```

- 재시도 메서드에 `@Transactional`을 같이 붙이지 않는다. 붙이면 같은(이미 롤백된) 트랜잭션 안에서 다시 시도하게 된다. **재시도가 바깥, 트랜잭션이 안.**
- Spring Retry는 별도 의존성(`spring-retry`)과 `@EnableRetry`가 필요하다.
- `@Recover`로 최종 실패 처리를 명시한다. 없으면 마지막 예외가 그대로 올라간다.
- 외부 API 재시도 정책은 `external-api-client`에 따로 있다(백오프 상한, 서킷 브레이커).

## 9. 분산 락

Redis 분산 락(Redisson `RLock` 등)을 쓰기 전에 확인:

- DB 행 하나를 지키는 문제라면 **쓰지 않는다.** 3장 위쪽 수단으로 충분하다.
- 락 TTL이 작업 시간보다 짧으면 두 인스턴스가 동시에 실행된다. TTL 연장(watchdog) 여부를 확인한다.
- 락을 잡은 인스턴스가 죽으면 TTL 만료까지 아무도 못 들어간다. 그 시간이 허용되는지 확인한다.
- 락은 **정확성을 보장하지 않는다**(Redlock 논쟁). 정확성이 필요하면 DB 제약이 최종 방어선이어야 한다.
- 적합한 용도: 스케줄러 중복 실행 방지, 외부 자원(파일, 외부 API 쿼터) 직렬화. 이 경우도 실행 이력 테이블 unique가 더 단순한 답일 때가 많다.

## 참고

- Spring Framework - Transaction Management: https://docs.spring.io/spring-framework/reference/data-access/transaction.html
- Spring Data JPA - Locking: https://docs.spring.io/spring-data/jpa/reference/jpa/locking.html
- Spring Retry: https://github.com/spring-projects/spring-retry
- PostgreSQL - Transaction Isolation: https://www.postgresql.org/docs/current/transaction-iso.html
- PostgreSQL - Explicit Locking: https://www.postgresql.org/docs/current/explicit-locking.html
