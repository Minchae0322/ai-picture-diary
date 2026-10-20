# jpa-query-optimization - 참고 자료

`SKILL.md`의 절차에 대한 이유, 원인별 처리 상세, 예시 코드, 참고 링크를 담는다. SKILL.md와 함께 읽는다.

## 목적 - 이유

감으로 fetch join을 붙이거나 캐시를 넣는 것이 아니라, 실제 발생 SQL과 실행계획을 근거로 고친다.

## 3단계. 원인별 처리 - 상세

**N+1**

- 컬렉션 연관이면 선택지 중 하나:
  - `join fetch` - 컬렉션 하나까지만. 두 개 이상이면 `MultipleBagFetchException`(List 기준) 또는 카테시안 곱. 페이징과 함께 쓰면 Hibernate가 메모리에서 페이징하며 경고를 남긴다(`HHH90003004`). 이 조합은 금지.
  - `@BatchSize(size = 100)` 또는 전역 `spring.jpa.properties.hibernate.default_batch_fetch_size=100` - IN 절로 묶어 로딩. 페이징과 호환되고 부작용이 적어 기본 선택지로 권장.
  - DTO 프로젝션(JPQL `select new`, QueryDSL `Projections`) - 화면용 조회는 이쪽이 가장 깔끔하다.
- 대부분의 N+1은 전역 `default_batch_fetch_size`에서 해결된다.

**느린 단일 쿼리**

- WHERE 절 컬럼에 함수가 걸려 있으면 인덱스를 못 탄다.
- `LIKE '%keyword%'`는 B-tree 인덱스를 못 쓴다. 검색은 Elasticsearch 등 검색 엔진으로 넘기는 것이 정석.
- 인덱스는 쓰기 비용이다. 그래서 추가 전에 쓰기 빈도를 확인한다.

**대량 저장/수정**

- 일정 건수마다 `flush()` + `clear()`로 영속성 컨텍스트를 비우지 않으면 더티체킹 대상이 누적되어 시간이 선형 이상으로 늘고 메모리가 터진다.
- 조건 일괄 갱신을 엔티티를 불러 수정하지 않고 UPDATE 한 번에 처리할 때, 영속성 컨텍스트와 DB가 어긋나므로 `clearAutomatically = true`.
- 진짜 대량(수백만 건)에서 JPA는 이 작업의 도구가 아니다.
- 멀티스레드로 나눌 때 정렬 키(ID 범위)로 파티션을 나누는 이유는 락 경합을 피하기 위해서다.

**페이징**

- `OFFSET`이 커질수록 앞 행을 전부 읽고 버린다.
- `Page<T>`는 count 쿼리를 추가로 날린다.

**조회 전용 최적화**

- `@Transactional(readOnly = true)` - 플러시 생략, 스냅샷 비교 비용 절감.
- DTO 프로젝션은 필요한 컬럼만 SELECT되고 영속성 컨텍스트 관리 비용이 없다.
- 캐시는 무효화 전략이 없으면 버그 원인이 된다.

## 예시

나쁜 예 - 컬렉션 fetch join + 페이징

```java
@Query("select a from Article a join fetch a.tags where a.status = :status")
Page<Article> findWithTags(@Param("status") Status status, Pageable pageable);
// 전체 결과를 메모리에 올려 페이징함. 데이터 커지면 OOM.
```

좋은 예 - 배치 페치 + 페이징

```yaml
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 100
```

```java
@EntityGraph(attributePaths = "author")   // 단건 연관은 그래프로
Page<Article> findByStatus(Status status, Pageable pageable);
// a.tags 는 접근 시점에 IN (...) 100건씩 로딩됨
```

좋은 예 - 대량 처리 청크

```java
@Transactional
public void migrate(List<Row> rows) {
    for (int i = 0; i < rows.size(); i++) {
        em.persist(toEntity(rows.get(i)));
        if (i % 500 == 0) {
            em.flush();
            em.clear();
        }
    }
}
```

## 하지 말 것 - 이유

- 운영 DB에서 `EXPLAIN ANALYZE`는 실제 실행이므로 UPDATE/DELETE에는 절대 금지.
- Hibernate 5.x(Boot 2.7)와 6.x/7.x(Boot 3/4)는 로깅 카테고리, 방언 설정 등이 다르다. 확인 후 적는다.

## 참고

- Hibernate 7 User Guide (Boot 4 기본): https://docs.jboss.org/hibernate/orm/7.1/userguide/html_single/Hibernate_User_Guide.html
- Hibernate 6.6 User Guide (Boot 3.x 프로젝트용): https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html
- Spring Data JPA - Query Methods / EntityGraph: https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html
- PostgreSQL - Using EXPLAIN: https://www.postgresql.org/docs/current/using-explain.html
- Vlad Mihalcea - N+1 query problem: https://vladmihalcea.com/n-plus-1-query-problem/
