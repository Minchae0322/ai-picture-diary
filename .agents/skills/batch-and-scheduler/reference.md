# batch-and-scheduler - 참고

SKILL.md의 절 번호와 같은 순서.

## 1. `@Scheduled` vs Spring Batch

### Spring Batch 6 (Boot 4) 달라진 점

Boot 4 / Batch 6를 쓴다면 예전 예제와 다른 부분이 많다.

- `@EnableBatchProcessing`이 공통 설정만 담당하고, 저장소는 `@EnableJdbcJobRepository` / `@EnableMongoJobRepository`로 분리됐다.
- `JobRepository`가 `JobExplorer`를, `JobOperator`가 `JobLauncher`를 흡수했다. 별도 빈이 필요 없다.
- 기본 인프라가 "resourceless"라 메타데이터를 안 쓰면 H2 같은 인메모리 DB가 필요 없다.
- 멀티스레드 스텝이 병렬 반복에서 **producer-consumer + 바운디드 큐** 모델로 바뀌었다. 로컬 청킹, 원격 스텝을 지원한다.
- `ChunkOrientedTasklet`/`TaskletStep` 대신 `ChunkOrientedStep`. 재시도는 Spring Retry가 아니라 Framework 7 기반.
- 기존 deprecated API가 전부 제거됐고, XML 네임스페이스·JUnit 4 지원·Jackson 2 지원이 deprecated 됐다.

출처: [What's new in Spring Batch 6](https://docs.spring.io/spring-batch/reference/whatsnew.html), [Spring Batch 6.0 Migration Guide](https://github.com/spring-projects/spring-batch/wiki/Spring-Batch-6.0-Migration-Guide). 회사 프로젝트(Boot 2.7)는 Batch 4.3 계열이라 위 내용이 적용되지 않는다. 버전을 먼저 확인하고 예제를 고른다.

### 트리거와 로직 분리

```java
@Component
@RequiredArgsConstructor
class SettlementScheduler {

    private final SettlementBatch settlementBatch;   // 실제 로직

    @Scheduled(cron = "${app.batch.settlement.cron}", zone = "Asia/Seoul")
    @SchedulerLock(name = "settlement", lockAtMostFor = "50m", lockAtLeastFor = "1m")
    void run() {
        settlementBatch.run(LocalDate.now(KST).minusDays(1));   // 파라미터를 넘긴다
    }
}
```

이렇게 두면 운영에서 특정 날짜로 다시 돌릴 때 `settlementBatch.run(date)`를 호출하는 관리 API나 테스트를 붙이기만 하면 된다. 스케줄러 메서드 안에 로직이 있으면 재실행 수단이 없다.

## 2. 프로퍼티 네이밍과 설정

```yaml
app:
  batch:
    settlement:
      enabled: true
      cron: "0 10 2 * * *"        # 매일 02:10 KST
      chunk-size: 1000
    purge-log:
      enabled: true
      cron: "0 30 3 * * *"
      retention-days: 90

spring:
  task:
    scheduling:
      pool:
        size: 5                    # 배치 개수에 맞춘다 (기본 1)
```

```yaml
# application-local.yml, application-dev.yml
app:
  batch:
    settlement:
      enabled: false               # 로컬/개발은 기본 off
```

```java
@Component
@ConditionalOnProperty(prefix = "app.batch.settlement", name = "enabled", havingValue = "true")
class SettlementScheduler { ... }
```

- Spring cron은 **6필드**(초 분 시 일 월 요일)다. 5필드 표준 cron을 그대로 붙여넣으면 의미가 밀린다.
- cron 값에 `-`를 주면 "실행 안 함"으로 해석된다. 스위치를 프로퍼티 하나로 통일하고 싶을 때 쓸 수 있다.
- 실행 시각을 분산하는 예: 02:00에 몰지 말고 02:10, 02:25, 02:40으로 나눈다. 같은 DB를 보는 배치라면 특히.
- 값은 `@ConfigurationProperties` record로 받는다(`config-and-secrets`). `@Value` 흩뿌리기 금지.

## 3. ShedLock

의존성:

```gradle
implementation "net.javacrumbs.shedlock:shedlock-spring"
implementation "net.javacrumbs.shedlock:shedlock-provider-jdbc-template"
```

```java
@Configuration
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "30m")
class SchedulerConfig {

    @Bean
    LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
                JdbcTemplateLockProvider.Configuration.builder()
                        .withJdbcTemplate(new JdbcTemplate(dataSource))
                        .usingDbTime()          // DB 시계 사용 - 인스턴스 간 시계 오차 제거
                        .build());
    }
}
```

`usingDbTime()`을 켜는 것이 중요하다. 인스턴스마다 시계가 조금씩 다르면 락 만료 판정이 흔들린다.

락 테이블은 `templates/shedlock.sql` 참고. 스키마 변경 규칙(`db-schema-and-migration`)에 따라 SQL 파일 + `docs/db/` 문서로 남기고 **실행은 사람이** 한다.

### `lockAtMostFor` 정하기

작업이 최대 얼마나 걸리는지 모르면 정할 수 없다. 실측 최대치의 2~3배로 시작하고, 배치 목록 문서의 "예상 소요 시간"과 함께 관리한다. 너무 길게 잡으면 인스턴스가 죽었을 때 그 시간만큼 아무도 못 돈다는 반대쪽 위험이 있으니 무한정 크게 잡지도 않는다.

### 대안: 실행 이력 선점

```sql
create table tb_batch_run (
    id          bigint      not null,
    job_name    varchar(100) not null,
    run_key     varchar(50)  not null,   -- 보통 실행 대상 일자
    started_at  timestamptz  not null,
    finished_at timestamptz,
    status      varchar(30)  not null,   -- RUNNING, SUCCESS, FAILED
    total_count integer,
    success_count integer,
    fail_count  integer,
    message     varchar(1000),
    constraint pk_batch_run primary key (id),
    constraint ux_batch_run_job_key unique (job_name, run_key)
);
```

INSERT가 unique 제약에 걸리면 다른 인스턴스가 이미 시작한 것이다. 중복도 막고 이력도 남아서, 배치가 많은 프로젝트에서는 ShedLock보다 이쪽이 더 쓸모 있을 때가 많다. 대신 "죽은 RUNNING"을 정리하는 규칙(타임아웃 후 FAILED 처리)이 필요하다.

## 4. 청크 루프

```java
public BatchResult run(LocalDate targetDate) {
    long cursor = 0L;
    int success = 0, failed = 0;
    while (true) {
        List<Long> ids = repository.findTargetIds(targetDate, cursor, chunkSize);
        if (ids.isEmpty()) break;

        BatchResult chunk = chunkProcessor.process(ids);   // @Transactional 별도 빈
        success += chunk.success();
        failed  += chunk.failed();
        cursor = ids.get(ids.size() - 1);

        if (failed > failThreshold) {
            throw new BatchAbortedException("실패 임계치 초과: " + failed);
        }
    }
    return new BatchResult(success, failed);
}
```

- 청크 처리는 **별도 빈**이어야 트랜잭션이 걸린다(자기 호출 함정, `transaction-and-concurrency` 1장).
- 커서는 마지막 처리 ID. `OFFSET`을 쓰면 뒤로 갈수록 느려지고, 처리 중 데이터가 바뀌면 건너뛰거나 중복된다.
- 처리 조건이 처리 후 거짓이 되면(`status = PENDING` -> `DONE`) 커서 없이 "항상 앞에서 N건"으로도 안전하다.

JPA 대량 쓰기:

```yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc.batch_size: 500
        order_inserts: true
        order_updates: true
```

`IDENTITY` 전략은 JDBC batch insert가 동작하지 않는다. 시퀀스 + `allocationSize`를 쓴다(`db-schema-and-migration` 2장).

## 5. 실패 격리

```java
@Transactional
public BatchResult process(List<Long> ids) {
    int success = 0, failed = 0;
    for (Long id : ids) {
        try {
            processOne(id);       // REQUIRES_NEW 또는 별도 트랜잭션
            success++;
        } catch (Exception e) {
            failed++;
            failureRepository.save(BatchFailure.of(jobName, id, e));
            log.atWarn().setMessage("배치 건 실패")
               .addKeyValue("event", "batch.settlement.item.failed")
               .addKeyValue("targetId", id)
               .setCause(e).log();
        }
    }
    return new BatchResult(success, failed);
}
```

주의: 바깥 트랜잭션 안에서 예외가 나면 그 트랜잭션이 rollback-only로 표시될 수 있다. 건별로 독립적으로 커밋해야 한다면 `processOne`을 `REQUIRES_NEW`로 두거나, 청크 트랜잭션 자체를 건 단위로 쪼갠다. "잡았는데 전체가 롤백됐다"는 대부분 이것이다.

실패 이력 테이블:

```sql
create table tb_batch_failure (
    id          bigint       not null,
    job_name    varchar(100) not null,
    target_id   varchar(100) not null,
    run_key     varchar(50),
    reason      varchar(1000),
    retry_count integer      not null default 0,
    resolved_at timestamptz,
    created_at  timestamptz  not null,
    constraint pk_batch_failure primary key (id)
);
create index ix_batch_failure_job_resolved on tb_batch_failure (job_name, resolved_at);
```

재처리 배치는 `resolved_at is null and retry_count < N`을 대상으로 돈다.

## 7. 병렬 처리

### 순서를 지킨다

1. **측정**: 단일 스레드로 전체 소요 시간과 구간별 시간을 잰다. 어디가 느린지 모르면 병렬화는 도박이다.
2. **쿼리/인덱스**: 대상 조회가 느리면 스레드를 늘려도 DB 대기만 늘어난다(`jpa-query-optimization`).
3. **배치 크기**: JDBC batch insert/update, `flush`/`clear`, 불필요한 select 제거.
4. **병렬화**: 위에서 안 되면 그때.

큰 폭의 단축(수십 시간 -> 수 시간)은 보통 3번과 4번의 조합에서 나온다. 다만 실제 수치는 데이터와 환경에 달렸으므로 **측정 전에는 배수를 약속하지 않는다.**

### 겹치지 않는 분할

```java
// ID 범위 분할
List<Range> partitions = Range.split(minId, maxId, workerCount);

// 해시 나머지 분할 - 데이터가 고르게 퍼진다
// where mod(id, :workerCount) = :workerIndex
```

```java
ExecutorService executor = Executors.newFixedThreadPool(workerCount);
List<Future<BatchResult>> futures = partitions.stream()
        .map(p -> executor.submit(() -> worker.run(p)))
        .toList();
```

- `workerCount`는 DB 커넥션 풀 크기 이하로. 워커마다 커넥션을 잡으므로 풀보다 크면 대기만 늘어난다. 온라인 트래픽과 풀을 공유한다면 배치용 여유분을 남긴다.
- 각 워커가 같은 행을 건드리지 않아야 한다. 겹치면 데드락(`transaction-and-concurrency` 5장).
- 워커별 시작/종료/건수를 로그로 남긴다. 특정 파티션만 느리면 데이터 편향이므로 해시 분할로 바꾼다.
- Spring Batch를 쓴다면 파티셔닝 스텝이나 6.0의 로컬 청킹이 같은 일을 해준다. 직접 스레드를 만들기 전에 확인한다.

### 대량 마이그레이션 실전 체크

- 인덱스를 먼저 만들지 말고 적재 후 만든다(적재 중 인덱스 유지 비용이 크다).
- 트리거·감사 로그가 걸려 있으면 잠시 끌 수 있는지 확인한다.
- 중간에 죽었을 때 어디까지 갔는지 알 수 있게 진행 상태를 남긴다.
- 전체 실행 전 1%로 리허설하고 소요 시간을 외삽한다.
- DB 작업은 실행 계획서(`templates/batch-run.md`)를 쓰고 **사람이 실행**한다(`db-schema-and-migration` 0장).

## 8. 로그와 메트릭

```java
log.atInfo().setMessage("배치 시작")
   .addKeyValue("event", "batch.settlement.started")
   .addKeyValue("runKey", targetDate.toString())
   .addKeyValue("totalCount", total)
   .log();

// ... 끝난 뒤
log.atInfo().setMessage("배치 종료")
   .addKeyValue("event", "batch.settlement.finished")
   .addKeyValue("runKey", targetDate.toString())
   .addKeyValue("successCount", success)
   .addKeyValue("failCount", failed)
   .addKeyValue("duration_ms", elapsedMs)
   .log();
```

Micrometer:

```java
Counter.builder("batch.items")
       .tag("job", "settlement").tag("result", "failed")
       .register(registry).increment(failed);

Gauge.builder("batch.last_success_epoch", () -> lastSuccessEpochSeconds)
     .tag("job", "settlement").register(registry);
```

알람은 두 종류를 모두 만든다.

- 실패 알람: `fail_count > 0` 또는 배치 예외 발생.
- **미실행 알람**: `time() - batch_last_success_epoch{job="settlement"} > 예상 주기 x 1.5`. 배치가 아예 안 뜬 사고는 실패 알람에 안 걸린다.

LogQL/PromQL 예시는 `logging-observability`의 쿼리 모음에 함께 둔다.

## 9. 문서

`templates/배치-목록.md`는 프로젝트 `docs/batch/`에 두고 배치를 추가·변경할 때 같은 PR에서 고친다. 배치가 많은 프로젝트에서는 이 목록이 장애 대응의 출발점이다: "어제 정산이 안 됐다"는 문의를 받았을 때 어떤 배치가, 몇 시에, 무엇을 대상으로 도는지 여기서 바로 나와야 한다.

## 참고

- Spring Framework - Task Execution and Scheduling: https://docs.spring.io/spring-framework/reference/integration/scheduling.html
- What's new in Spring Batch 6: https://docs.spring.io/spring-batch/reference/whatsnew.html
- Spring Batch 6.0 Migration Guide: https://github.com/spring-projects/spring-batch/wiki/Spring-Batch-6.0-Migration-Guide
- ShedLock: https://github.com/lukas-krecan/ShedLock
