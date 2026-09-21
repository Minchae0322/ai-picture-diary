# db-schema-and-migration - 참고 자료

`SKILL.md`의 규칙에 대한 이유, 예시, DB2 대응, 참고 링크. 절 번호는 SKILL.md와 같다.

## 0. 왜 AI는 DB를 만지지 않는가

- 실행은 되돌릴 수 없고, AI는 "확인만"과 "변경"의 경계를 스스로 보장할 수 없다. 접속 자체를 막으면 실수의 종류가 하나 사라진다.
- 회사 저장소 AGENTS.md의 "DB / SQL 실행 절대 금지"와 같은 규칙이다. 이 스킬은 그것을 모든 프로젝트로 확장한 것.
- `ddl-auto: update`가 금지인 이유: 컬럼 삭제/이름 변경을 못 하고(새 컬럼만 추가), 운영에서 예상 못 한 DDL이 나가며, 스키마의 진실이 코드와 DB 두 곳으로 갈라진다. `validate`는 엔티티와 DB가 어긋나면 기동 실패로 알려주는 안전망이다.

## 1. 네이밍 - 왜 이 형식인가

- `tb_` 접두사: 뷰(`vw_`), 시퀀스(`seq_`), 임시 테이블과 구분되고, 회사 관행과 맞는다.
- 단수 명사: 엔티티 클래스명(`Article`)과 1:1이라 매핑이 기계적이다. 복수(`articles`)도 널리 쓰이지만 한 프로젝트에서 섞이지 않는 게 중요하다.
- 컬럼에 테이블명 반복 금지(`article_title`): JOIN 결과에서 컬럼명이 충돌하는 경우는 별칭으로 풀고, 평소엔 짧은 게 읽기 쉽다.
- `is_` 없는 boolean: Java 필드가 `isPublished`면 Lombok getter가 `isPublished()`가 되어 Jackson이 `published`로 직렬화하고, 필드명과 JSON 키가 어긋나는 사고가 난다(`api-design`). 필드도 컬럼도 `published`.
- 인덱스 이름에 컬럼 나열: `ix_article_status_created_at`을 보면 무엇을 위한 인덱스인지 카탈로그 없이 안다. `idx1`, `article_idx`는 6개월 뒤 아무도 못 지운다.

예시 DDL (PostgreSQL):

```sql
CREATE SEQUENCE seq_article START 1 INCREMENT 50;

CREATE TABLE tb_article (
    id            BIGINT       NOT NULL DEFAULT nextval('seq_article'),
    title         VARCHAR(200) NOT NULL,
    body          TEXT,
    status        VARCHAR(30)  NOT NULL,                 -- enum: DRAFT | PUBLISHED | RETRACTED
    reporter_id   BIGINT       NOT NULL,                 -- tb_member.id (다른 애그리거트는 ID 참조)
    published_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by    BIGINT       NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by    BIGINT       NOT NULL,
    deleted_at    TIMESTAMPTZ,
    version       INTEGER      NOT NULL DEFAULT 0,
    CONSTRAINT pk_article PRIMARY KEY (id),
    CONSTRAINT fk_article_member FOREIGN KEY (reporter_id) REFERENCES tb_member(id) ON DELETE RESTRICT,
    CONSTRAINT ck_article_title_not_blank CHECK (length(trim(title)) > 0)
);

CREATE INDEX ix_article_reporter_id ON tb_article(reporter_id);                       -- FK 인덱스
CREATE INDEX ix_article_status_created_at ON tb_article(status, created_at DESC, id DESC)
    WHERE deleted_at IS NULL;                                                          -- 목록/커서 페이징용 부분 인덱스

COMMENT ON TABLE tb_article IS '기사';
COMMENT ON COLUMN tb_article.status IS 'DRAFT/PUBLISHED/RETRACTED. 코드 enum ArticleStatus';
```

## 2. 공통 컬럼과 소프트 삭제

### BaseEntity

`templates/BaseEntity.java`. `@MappedSuperclass` + JPA Auditing(`@EnableJpaAuditing`, `AuditorAware<Long>`가 현재 회원 ID 반환). `deleted_at`은 Hibernate 6.4+의 `@SoftDelete`도 있지만, "삭제 시각"이 필요하고 조회 예외를 명시적으로 두려면 `@SQLRestriction` + `@SQLDelete` 조합이 더 유연하다.

```java
@Entity
@Table(name = "tb_article")
@SQLDelete(sql = "UPDATE tb_article SET deleted_at = now() WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
public class Article extends BaseEntity { ... }
```

- `@SQLRestriction`은 `findById`, JPQL, 연관관계 로딩에 전부 적용된다. 네이티브 쿼리에는 적용되지 않으므로 네이티브에서는 `deleted_at IS NULL`을 직접 쓴다.
- 삭제된 것을 포함해 조회해야 하는 관리 화면은 별도 QueryDSL 리포지토리에서 `@SQLRestriction`을 우회할 수 없으므로 네이티브 쿼리 또는 별도 읽기 전용 엔티티(`ArticleWithDeleted`)를 둔다. 후자가 타입 안전하다.
- 소프트 삭제 + 연관관계: 자식이 살아 있는데 부모만 소프트 삭제되면 `@SQLRestriction` 때문에 자식에서 부모 로딩이 `EntityNotFoundException`. 부모 삭제 시 자식도 함께 소프트 삭제하거나, 부모 삭제를 막는다(`RESTRICT` 의미를 앱에서도).

### 부분 unique 인덱스가 필요한 이유

일반 `UNIQUE(email)`이면 탈퇴한 회원(`deleted_at` 채워짐)의 이메일로 재가입이 막힌다. PostgreSQL:

```sql
CREATE UNIQUE INDEX ux_member_email ON tb_member(email) WHERE deleted_at IS NULL;
```

DB2는 부분 인덱스가 없다. 두 가지 우회:

```sql
-- (a) 생성 컬럼: 살아 있으면 email, 삭제되면 NULL. NULL은 unique 검사에서 제외된다
ALTER TABLE tb_member ADD COLUMN email_active VARCHAR(255)
    GENERATED ALWAYS AS (CASE WHEN deleted_at IS NULL THEN email ELSE NULL END);
CREATE UNIQUE INDEX ux_member_email_active ON tb_member(email_active);

-- (b) 삭제 시 이메일에 접미사 부여: email = email || '#deleted#' || id  (앱에서 처리, 복구 불가)
```

(a)가 데이터를 보존하므로 기본. DB2 버전에 따라 생성 컬럼 문법이 다르니 문서 확인.

### 시각 타입

`timestamp without time zone`은 "언제"를 잃는다. 서버 시간대가 바뀌거나 KST/UTC 혼용 시 9시간 어긋나는 사고가 `rca-procedure` 단골이다. PostgreSQL `timestamptz`는 UTC로 저장하고 세션 시간대로 보여준다. DB2는 `TIMESTAMP WITH TIME ZONE`(11.1+)이 있지만 드라이버 지원이 불완전할 수 있어, 회사 프로젝트는 `TIMESTAMP` + "항상 UTC 저장" 규칙 + 앱에서 `Instant`로 다루는 쪽이 안전하다. 어느 쪽이든 문서에 "저장 시간대"를 명시.

## 3. enum - 왜 문자열인가

- DB enum 타입(PostgreSQL `CREATE TYPE ... AS ENUM`)은 값 추가마다 `ALTER TYPE`, 값 삭제는 불가, 순서 변경 불가. 개발 속도가 DDL 승인 절차에 묶인다. 이전 프로젝트에서 겪은 그 불편함이다.
- check 제약으로 값을 고정하는 것도 같은 문제. 값 추가 = DDL.
- 숫자 코드(`1=DRAFT`)는 DB만 보고 의미를 알 수 없고, `ORDINAL`은 enum 순서를 바꾸면 데이터가 조용히 뒤집힌다.
- 문자열 + 코드 enum이면 값 추가는 Java enum 한 줄이고, DB에는 그냥 새 문자열이 들어간다. 대신 DB만 보고 유효한 값 목록을 알 수 없으므로 `COMMENT ON COLUMN`에 값 목록과 enum 클래스명을 적는다.

`UNKNOWN` 매핑 컨버터:

```java
@Converter(autoApply = false)
public class ArticleStatusConverter implements AttributeConverter<ArticleStatus, String> {
    public String convertToDatabaseColumn(ArticleStatus s) { return s == null ? null : s.name(); }
    public ArticleStatus convertToEntityAttribute(String v) {
        if (v == null) return null;
        try { return ArticleStatus.valueOf(v); }
        catch (IllegalArgumentException e) { return ArticleStatus.UNKNOWN; }   // 레거시/타 시스템 값
    }
}
```

`UNKNOWN`이 실제로 들어오면 `logging-observability` 규칙으로 `event=enum.unknown_value column=... value=...` WARN을 남겨 데이터 정리 대상을 찾는다.

## 4. 변경 절차 - 파일 형식

### Flyway

- 파일명 `V202609091955__add_article_published_at.sql`. 타임스탬프 버전은 브랜치 간 충돌이 없다(`V1`, `V2`는 두 사람이 동시에 만들면 충돌).
- `spring.flyway.enabled=true`, `validate-on-migrate=true`, 운영은 `spring.flyway.enabled=false`로 두고 **사람이 `flyway migrate`를 실행**한다(앱 기동이 DDL을 실행하게 두지 않는다. 0장 규칙의 연장).
- 이미 적용된 마이그레이션 파일은 수정하지 않는다(체크섬 불일치로 기동 실패). 고치려면 새 버전.
- 롤백은 Flyway 무료판에 없다. `U202609091955__*.sql`을 관례로 같이 두고 사람이 실행.

### 회사 수동 관행 (`sql/patch/`)

- 파일명 `sql/patch/2026-09-09-기사-발행시각-컬럼-추가.sql`. 회사 `AGENTS.md` 규칙.
- 파일 상단 주석에 대상 DB(DB2/PostgreSQL), 실행 순서, 예상 락, 롤백 파일 경로.
- 실행 기록은 `docs/db/` 문서 하단.

### 문서 (`docs/db/YYYY-MM-DD-<변경>.md`)

`templates/db-change.md`. `deliverable-structure`의 이력 문서 규칙(`YYYY-MM-DD-` 접두사, 작성 후 불변). ERD가 있으면 `docs/erd/schema-*.dbml`도 같은 커밋에서 갱신.

## 5. expand-contract 예시 - 컬럼 이름 변경

`tb_article.reporter_id` -> `author_id`로 바꾸는 경우. 한 번의 `RENAME COLUMN`은 배포 중 구버전 코드가 `reporter_id`를 찾다 죽는다.

```
배포 1 (expand)
  DDL:  ALTER TABLE tb_article ADD COLUMN author_id BIGINT;
        CREATE INDEX CONCURRENTLY ix_article_author_id ON tb_article(author_id);
  코드: 쓰기는 두 컬럼 모두, 읽기는 reporter_id
백필:  UPDATE tb_article SET author_id = reporter_id WHERE author_id IS NULL AND id BETWEEN :from AND :to;  (청크)
배포 2
  코드: 읽기를 author_id로 전환. 쓰기는 여전히 둘 다
배포 3 (contract, 배포 2 이후 최소 한 주기)
  코드: reporter_id 참조 제거
  DDL:  ALTER TABLE tb_article ALTER COLUMN author_id SET NOT NULL;
        ALTER TABLE tb_article DROP COLUMN reporter_id;   -- 다음 배포에
```

`NOT NULL` 추가를 락 없이(PostgreSQL 12+):

```sql
ALTER TABLE tb_article ADD CONSTRAINT ck_article_author_not_null CHECK (author_id IS NOT NULL) NOT VALID;
ALTER TABLE tb_article VALIDATE CONSTRAINT ck_article_author_not_null;   -- 테이블 스캔하지만 쓰기 락 없음
ALTER TABLE tb_article ALTER COLUMN author_id SET NOT NULL;              -- check가 있으면 스캔 생략
ALTER TABLE tb_article DROP CONSTRAINT ck_article_author_not_null;
```

백필 청크:

```sql
-- 1만 행씩, id 순, 청크마다 커밋. 진행은 마지막 id를 로그로
UPDATE tb_article SET author_id = reporter_id
 WHERE id IN (SELECT id FROM tb_article WHERE author_id IS NULL ORDER BY id LIMIT 10000);
-- 반복. 영향 행이 0이면 종료
```

DB2는 `LIMIT` 대신 `FETCH FIRST 10000 ROWS ONLY`, `CREATE INDEX CONCURRENTLY` 대신 온라인 인덱스 생성 옵션(버전별 상이). 문서 확인.

## 6. 인덱스 - 왜 FK에 인덱스인가

PostgreSQL은 FK 제약을 만들 때 참조하는 쪽 컬럼에 인덱스를 만들지 않는다. `tb_article_comment.article_id`에 인덱스가 없으면 (1) 기사별 댓글 조회가 풀 스캔, (2) 기사를 삭제할 때 `RESTRICT` 검사가 댓글 테이블 풀 스캔이라 삭제 하나가 수 초 걸린다. MySQL은 자동 생성하므로 MySQL에서 온 사람이 자주 놓친다.

복합 인덱스 순서 예: `WHERE status = ? AND created_at < ? ORDER BY created_at DESC, id DESC` -> `(status, created_at DESC, id DESC)`. 등호(`status`)가 앞, 범위+정렬(`created_at`)이 뒤, 커서 유일 키(`id`)가 마지막. 방향까지 맞추면 정렬 단계가 사라진다.

## 7. 자주 하는 실수 모음

- 새 컬럼을 `NOT NULL` + default 없이 추가 -> 기존 행 때문에 DDL 실패 또는 코드에서 NPE.
- 소프트 삭제 테이블에 `UNIQUE(email)` -> 재가입 불가.
- `@Enumerated` 생략 -> 기본이 `ORDINAL`.
- `LocalDateTime` 필드 + `timestamp` 컬럼 -> 시간대 사고.
- 인덱스 추가를 트랜잭션 안에서 `CONCURRENTLY` -> PostgreSQL이 거부. 마이그레이션 파일에 `-- flyway:executeInTransaction=false` 필요(Flyway 지원 여부 버전 확인).
- 운영 반영 전 `EXPLAIN`을 개발 DB에서만 -> 데이터 분포가 달라 운영에서 다른 계획. 운영 통계로 확인은 담당자에게 요청.

## 참고

- PostgreSQL - ALTER TABLE 락 수준: https://www.postgresql.org/docs/current/sql-altertable.html
- PostgreSQL - Partial Indexes: https://www.postgresql.org/docs/current/indexes-partial.html
- PostgreSQL - CREATE INDEX CONCURRENTLY: https://www.postgresql.org/docs/current/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY
- Hibernate 7 - `@SQLRestriction`, `@SQLDelete`, `@SoftDelete`: https://docs.jboss.org/hibernate/orm/7.1/userguide/html_single/Hibernate_User_Guide.html
- Spring Data JPA - Auditing: https://docs.spring.io/spring-data/jpa/reference/auditing.html
- Flyway - Migrations, versioned naming: https://documentation.red-gate.com/flyway/flyway-concepts/migrations
- Expand/Contract 패턴 (Martin Fowler, ParallelChange): https://martinfowler.com/bliki/ParallelChange.html
- IBM Db2 - Generated columns, online index: https://www.ibm.com/docs/en/db2
- Zero-downtime PostgreSQL migrations (braintree 사례): https://github.com/braintree/pg_ha_migrations
