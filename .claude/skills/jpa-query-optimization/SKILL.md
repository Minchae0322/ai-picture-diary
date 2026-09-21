---
name: jpa-query-optimization
description: 조회가 느리거나 쿼리가 많이 나갈 때 자동 적용. "쿼리 느려", "N+1", "실행계획", "EXPLAIN", "페치 조인", "DTO 프로젝션", "벌크 업데이트", "인덱스를 안 탄다", "페이징이 느려" 요청이나 느린 조회를 고칠 때 트리거. 측정 -> 원인 분류 -> 최소 변경 -> 재측정 절차와 원인별 처리법. 인덱스를 새로 만들거나 바꾸는 DDL은 db-schema-and-migration, 대량 처리의 배치 구조는 batch-and-scheduler.
---

# JPA / 쿼리 최적화 절차

## 목적

느린 조회, N+1, 대량 처리 병목을 **측정 -> 원인 특정 -> 최소 변경 -> 재측정** 순서로 해결한다.
감이 아니라 실제 발생 SQL과 실행계획을 근거로 고친다.

## 언제 적용

API/특정 화면이 느리다는 이슈, 로그에 같은 형태의 SELECT 반복, 배치/마이그레이션이 예상보다 오래 걸림, 슬로우 쿼리 알림.

## 절차

### 1단계. 재현하고 측정한다
- 어떤 요청/작업이 느린지 특정하고 파라미터(기간, 페이지 크기, 사용자)를 기록한다.
- 실행되는 SQL 개수와 시간을 확인한다.
  - 개발: `spring.jpa.show-sql`보다 `logging.level.org.hibernate.SQL=DEBUG` + `org.hibernate.orm.jdbc.bind=TRACE`(Hibernate 6). 파라미터까지 보인다.
  - 통계: `spring.jpa.properties.hibernate.generate_statistics=true`로 세션당 쿼리 수, 2차 캐시 히트.
  - 운영: APM/트레이스(Tempo 등)에서 DB span 개수와 합계 시간.
- 기준값을 적는다. "쿼리 N개, 총 X ms". 없으면 개선을 증명할 수 없다.

### 2단계. 원인을 분류한다

| 증상 | 유력 원인 |
|---|---|
| 같은 형태의 SELECT가 행 수만큼 반복 | N+1 (지연 로딩 컬렉션/연관 엔티티 순회) |
| 쿼리 1~2개인데 각 쿼리가 느림 | 인덱스 부재, 잘못된 조인, 함수 적용된 WHERE, 대량 정렬 |
| 조회 결과가 크지 않은데 느림 | 불필요한 컬럼/연관 로딩, 카테시안 곱(컬렉션 fetch join 중첩) |
| 저장/수정이 느림 | 배치 미적용, IDENTITY 전략, 더티체킹 대상 과다, 인덱스 과다 |
| 페이지가 뒤로 갈수록 느림 | OFFSET 페이징 |
| 메모리 급증 | 대량 엔티티를 영속성 컨텍스트에 그대로 적재 |

### 3단계. 원인별 처리 (상세와 예시는 `reference.md`)

**N+1**
- 단건 연관(`@ManyToOne`): `join fetch` 또는 `@EntityGraph`.
- 컬렉션 연관: `join fetch`는 컬렉션 하나까지만, 페이징과 함께 쓰는 조합은 금지(`HHH90003004`). 기본 선택지는 `@BatchSize(size = 100)` 또는 전역 `spring.jpa.properties.hibernate.default_batch_fetch_size=100`. 화면용 조회는 DTO 프로젝션(JPQL `select new`, QueryDSL `Projections`).
- 먼저 전역 `default_batch_fetch_size`를 켜고 다시 측정한다.

**느린 단일 쿼리**
- `EXPLAIN (ANALYZE, BUFFERS)`(PostgreSQL) / `EXPLAIN` + `db2expln`(DB2). Seq Scan/테이블 스캔, 예상 행 수와 실제 행 수의 큰 차이, Sort 노드를 찾는다.
- WHERE 절 컬럼에 함수(`DATE(created_at)`, `UPPER(name)`) 금지. 범위 조건이나 함수 기반 인덱스로.
- 복합 인덱스는 **등호 조건 컬럼 -> 범위 조건 컬럼 -> 정렬 컬럼** 순서.
- `LIKE '%keyword%'`는 B-tree 인덱스를 못 쓴다. 검색 엔진(Elasticsearch)이 정석, PostgreSQL이면 `pg_trgm` GIN 인덱스.
- 인덱스 추가 전에 테이블의 쓰기 빈도를 확인한다.

**대량 저장/수정**
- `spring.jpa.properties.hibernate.jdbc.batch_size=50~1000`, `order_inserts=true`, `order_updates=true`.
- `IDENTITY`는 배치 insert 불가. `SEQUENCE` + `allocationSize`(PostgreSQL/DB2 모두 시퀀스 지원).
- 일정 건수마다 `flush()` + `clear()`.
- 조건 일괄 갱신은 `@Modifying` JPQL UPDATE 또는 네이티브 UPDATE로 한 번에, `clearAutomatically = true`.
- 수백만 건이면 JPA 대신 `JdbcTemplate.batchUpdate` 또는 DB 벌크 로드(`COPY`, `LOAD`).
- 멀티스레드는 스레드마다 별도 트랜잭션/EntityManager, 정렬 키(ID 범위)로 파티션.

**페이징**
- 무한 스크롤/피드는 커서(keyset) 페이징: `WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT ?`.
- 전체 개수가 필요 없으면 `Page<T>` 대신 `Slice<T>`. count 쿼리에 불필요한 join이 있으면 `countQuery` 지정.

**조회 전용 최적화**
- `@Transactional(readOnly = true)`. 화면 전용 조회는 DTO 프로젝션.
- 그래도 부족하면 읽기 전용 복제 DB 라우팅, 그 다음이 캐시(무효화 전략 필수).

### 4단계. 재측정하고 기록한다
- 1단계와 같은 조건으로 다시 측정. "쿼리 N -> M개, X -> Y ms".
- 변경과 이유를 커밋 메시지/PR에. 인덱스 추가는 DDL과 실행계획 전후 첨부.
- 운영 반영 후 슬로우 쿼리 로그와 트레이스에서 실제 개선 확인.

## 하지 말 것

- 측정 없이 fetch join을 여기저기 붙이는 것. 카테시안 곱으로 오히려 느려질 수 있다.
- `FetchType.EAGER`로 N+1을 "해결"하는 것. 모든 조회에 비용을 전가한다.
- 운영 DB에 `EXPLAIN ANALYZE`를 함부로 실행하는 것. UPDATE/DELETE에는 절대 금지.
- 캐시를 첫 번째 해법으로 고르는 것.
- Hibernate 버전을 확인하지 않고 설정 키를 말하는 것. 5.x(Boot 2.7)와 6.x/7.x(Boot 3/4)는 로깅 카테고리, 방언 설정 등이 다르다.

## 관련 스킬

`db-schema-and-migration`(인덱스를 실제로 추가·변경하는 DDL과 실행 절차. **AI는 DB에 접속하지 않는다**), `batch-and-scheduler`(대량 처리의 청크·트랜잭션 구조), `transaction-and-concurrency`(락과 트랜잭션 크기), `ddd-spring`(조회 분리), `rag-pipeline`(벡터 검색 쿼리), `rca-procedure`(느려진 원인 추적), `logging-observability`(슬로우 쿼리 로그와 트레이스).

## 더 보기
- 이유, 예시 코드, 상세 표, 참고 링크: `reference.md` (판단이 안 서거나 처음 적용할 때만 읽는다)
