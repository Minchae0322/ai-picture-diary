---
name: db-schema-and-migration
description: 테이블/컬럼/인덱스를 만들거나 바꾸거나, 엔티티에 필드를 추가하거나, 마이그레이션 SQL을 쓰거나, ERD를 다룰 때 자동 적용. "테이블 추가", "컬럼 추가", "DDL", "마이그레이션", "인덱스 걸어", "소프트 삭제", "enum 컬럼", "스키마 변경" 요청이나 코드에 @Entity/@Table/@Column/@Index가 새로 등장하는 순간 트리거. 네이밍(tb_ 접두사), 공통 컬럼, 소프트 삭제 기본, enum은 DB 문자열 + 코드 enum, 무중단 변경 절차, 그리고 AI는 DB에 접속·실행하지 않고 SQL 파일과 docs/ 문서만 만든다는 규칙.
---

# DB 스키마와 마이그레이션 (db-schema-and-migration)

## 목적

스키마는 코드보다 되돌리기 어렵다. 한 번 올라간 컬럼명은 수년을 가고, 잘못된 변경은 운영 데이터를 잠근다. 이 스킬은 (1) 이름과 타입을 프로젝트 전체에서 하나로, (2) 소프트 삭제·감사 컬럼·enum 처리를 기본값으로, (3) 변경은 항상 **SQL 파일 + docs/ 문서**로 남기고 사람이 실행하게, (4) 무중단으로 바꾸는 순서를 정한다.

기본 스택: PostgreSQL(개인 프로젝트) / DB2 + PostgreSQL(회사), Spring Data JPA(Hibernate 7). 마이그레이션 도구는 Flyway 기본, 회사처럼 `sql/patch/` 수동 관행이면 그 형식을 따른다(4장).

## 언제 적용

`@Entity`/`@Table`/`@Column`/`@Index` 추가·변경, 컬럼/인덱스/제약 추가·삭제, 마이그레이션 SQL 작성, ERD 갱신, "이 값 enum으로 할까", 대량 백필, DB 관련 장애 후 스키마 수정.

## 이 스킬 폴더의 파일

| 파일 | 용도 | 복사 위치 |
|---|---|---|
| `templates/BaseEntity.java` | 공통 컬럼 5개 + version, 소프트 삭제 헬퍼 | `common/domain/` |
| `templates/migration.sql` | 마이그레이션 SQL 형식 (헤더, 단계, 확인, 롤백) | `sql/patch/` 또는 `db/migration/` |
| `templates/db-change.md` | DB 변경 문서 (영향, 실행 순서, 롤백, 실행 기록) | `docs/db/` |

## 0. 절대 규칙 - AI는 DB를 만지지 않는다

- **DB에 접속하지 않는다. SQL을 실행하지 않는다. 접속 정보를 요청하지 않는다.** `psql`, `db2`, JDBC 클라이언트, `DataSource` 직접 호출, 테스트 이름을 빌린 실행 전부 금지. 운영/개발/로컬 구분 없이 전부.
- AI가 하는 것: SQL **파일** 작성, 엔티티 코드, 문서. 실행은 사람이 절차(4장)대로 한다.
- 예외는 없다. "확인만 하려고 SELECT"도 금지. 확인이 필요하면 실행할 SQL을 문서에 적어 사람에게 넘긴다.
- Hibernate `ddl-auto`는 `validate`만(로컬 `create-drop` 허용). `update`는 어떤 환경에서도 금지. 스키마는 SQL 파일이 진실이다.

## 1. 네이밍

| 대상 | 규칙 | 예 |
|---|---|---|
| 테이블 | `tb_` + 단수 명사 snake_case. 도메인 접두사로 묶는다 | `tb_article`, `tb_article_comment`, `tb_order_line` |
| 매핑(N:M) 테이블 | `tb_<a>_<b>` (알파벳 순 아니라 주-종 순) | `tb_article_tag` |
| 컬럼 | snake_case, 단수, 테이블명 반복 금지 | `title` (O), `article_title` (X) |
| PK | `id` (bigint, 시퀀스/IDENTITY). 복합 PK 금지, 대신 unique | `id` |
| FK 컬럼 | `<참조 테이블 단수>_id` | `article_id`, `created_by` |
| boolean | 형용사/과거분사, `is_` 접두사 없음 | `published`, `locked`, `active` |
| 시각 | `_at` (timestamptz) | `created_at`, `published_at`, `deleted_at` |
| 날짜만 | `_date` (date) | `birth_date` |
| 금액 | `_amount` (numeric(19,4)) 또는 정수 `_krw` | `total_amount` |
| 코드/enum 컬럼 | 의미 명사, `_code` 접미사 없음 | `status`, `type`, `role` |
| 인덱스 | `ix_<테이블 접두사 뺀 이름>_<컬럼들>` | `ix_article_status_created_at` |
| unique | `ux_<테이블>_<컬럼들>` | `ux_member_email` |
| FK 제약 | `fk_<테이블>_<참조 테이블>` | `fk_article_comment_article` |
| check | `ck_<테이블>_<의미>` | `ck_order_line_qty_positive` |
| 시퀀스 | `seq_<테이블>` | `seq_article` |

- 약어 금지(`cnt`, `dtm`, `yn`). `count`, `_at`, boolean으로. 회사 레거시(`req_st_cd`)는 그대로 두되 새 컬럼은 이 규칙으로.
- 예약어(`user`, `order`, `group`)는 테이블명에 쓰지 않는다. `tb_member`, `tb_purchase_order`.
- 엔티티 <-> 테이블 매핑은 Hibernate 기본 물리 전략(camelCase -> snake_case)에 맡기고 `@Table(name = "tb_article")`만 명시. `@Column(name=)`은 규칙과 어긋날 때만.

## 2. 공통 컬럼과 기본값

모든 업무 테이블은 `templates/BaseEntity.java`를 상속한다.

| 컬럼 | 타입 | 의미 |
|---|---|---|
| `id` | bigint PK | `SEQUENCE`(PostgreSQL/DB2) + `allocationSize=50`. `IDENTITY`는 배치 insert 불가(`jpa-query-optimization`) |
| `created_at`, `updated_at` | timestamptz not null | JPA Auditing |
| `created_by`, `updated_by` | bigint | 회원 ID. 시스템은 0 |
| `deleted_at` | timestamptz null | **소프트 삭제 기본.** null이면 살아 있음 |
| `version` | int not null default 0 | 낙관적 락. 동시 수정 가능성이 있는 테이블만 |

- **소프트 삭제가 기본.** 삭제 API는 `deleted_at`을 채운다. 물리 삭제는 로그성 테이블, 매핑 테이블, 개인정보 파기(법적 요구)에만.
- 소프트 삭제 테이블의 unique는 **부분 인덱스**로: `CREATE UNIQUE INDEX ux_member_email ON tb_member(email) WHERE deleted_at IS NULL`. 아니면 탈퇴 후 재가입이 막힌다. DB2는 부분 인덱스가 없으므로 `deleted_at`을 unique에 포함하거나 생성 컬럼으로 우회(`reference.md`).
- 조회는 `deleted_at IS NULL`을 기본 적용: 엔티티에 `@SQLRestriction("deleted_at IS NULL")` + `@SQLDelete`. 삭제된 것도 봐야 하는 관리 조회는 네이티브/QueryDSL로 명시.
- FK는 **DB 제약으로 건다**(성능 핑계로 빼지 않는다). 소프트 삭제된 부모를 참조할 수 있으므로 `ON DELETE`는 `RESTRICT`. 대량 로그 테이블만 예외.
- `not null`이 기본. nullable은 "없음"이 의미를 가질 때만. 문자열은 빈 문자열 대신 null 허용 여부를 정하고 통일.
- 시각은 전부 `timestamptz`(DB2는 `TIMESTAMP` + UTC 저장 규칙). `timestamp without time zone` 금지. 앱은 `Instant`/`OffsetDateTime`.

## 3. enum - DB는 문자열, 코드는 enum

- 컬럼은 `varchar(30)`. DB enum 타입, check 제약으로 값 목록 고정, 숫자 코드 전부 금지. 값을 추가할 때 DDL이 필요하면 안 된다.
- 코드는 `@Enumerated(EnumType.STRING)` + Java enum. `ORDINAL` 금지.
- DB에 코드에 없는 값이 들어올 수 있으면(레거시, 타 시스템 적재) `AttributeConverter`로 읽어서 `UNKNOWN`으로 매핑. 기동 실패보다 낫다.
- 값 이름은 대문자 스네이크(`PUBLISH_CONFIRMED`), 한 번 저장된 값은 이름을 바꾸지 않는다(바꾸면 데이터 마이그레이션). 표시명은 코드의 `enum` 필드나 프론트 매핑.
- 코드 테이블(`tb_common_code`)은 **사용자가 관리 화면에서 값을 추가**해야 할 때만. 개발자가 추가하는 값은 enum.

## 4. 변경 절차 - 파일과 문서로만

1. **분류**: 추가만(안전) / 이름 변경·타입 변경·삭제(위험) / 대량 백필(위험). 위험이면 5장의 expand-contract.
2. **SQL 파일 작성**: `templates/migration.sql` 형식. 위치는 프로젝트 관행 - Flyway면 `src/main/resources/db/migration/V<yyyyMMddHHmm>__<desc>.sql`, 회사 수동 관행이면 `sql/patch/YYYY-MM-DD-<짧은-설명>.sql`. 한 파일 = 한 목적. **롤백 SQL을 같은 파일 하단 주석 또는 `*-rollback.sql`로 반드시.**
3. **엔티티/코드 변경**: 컬럼 추가는 nullable 또는 default로 먼저(기존 행 때문에). 2장 공통 컬럼 규칙.
4. **문서**: `docs/db/YYYY-MM-DD-<변경>.md` (`templates/db-change.md`). 무엇을, 왜, 영향 테이블/행 수 추정, 실행 순서, 실행 환경별 담당자, 롤백, 실행 후 확인 SQL. `docs/erd/`가 있으면 dbml 갱신.
5. **실행 요청**: 문서를 사람(DBA/담당자)에게 넘긴다. AI는 여기서 멈춘다. 실행 결과(행 수, 소요 시간)는 사람이 문서 하단 "실행 기록"에 적는다.
6. **배포 순서**: DDL 먼저(하위 호환) -> 코드 배포 -> (contract 단계 DDL은 다음 배포). 코드와 DDL을 같은 배포에 묶지 않는다.
7. 커밋: SQL + 엔티티 + 문서를 한 커밋(`feat(article): ...` 또는 `chore(db): ...`). `deliverable-sync`가 `docs/db/`를 이력 문서로 인식.

## 5. 무중단 변경 (expand-contract)

| 변경 | 순서 |
|---|---|
| 컬럼 추가 | nullable/default로 추가 -> 코드 배포 -> (필요 시) 백필 -> `NOT NULL` |
| 컬럼 이름 변경 | 새 컬럼 추가 -> 코드가 둘 다 쓰기(dual write) -> 백필 -> 코드가 새 컬럼만 읽기 -> 옛 컬럼 삭제(다음 배포) |
| 타입 변경 | 이름 변경과 동일(새 컬럼 경유). `ALTER TYPE`은 테이블 락 |
| 컬럼 삭제 | 코드에서 참조 제거 배포 -> 한 배포 주기 대기 -> DDL 삭제 |
| NOT NULL 추가 | 백필 완료 확인 -> `ALTER ... SET NOT NULL`(PostgreSQL 11+는 check 제약 `NOT VALID` -> `VALIDATE`로 락 최소화) |
| 인덱스 추가 | PostgreSQL `CREATE INDEX CONCURRENTLY`(트랜잭션 밖). DB2는 온라인 인덱스 옵션 확인 |
| 대량 백필 | 1,000~10,000행 청크, 청크마다 커밋, `WHERE id > :last ORDER BY id LIMIT`, 야간, 진행 로그 |
| 테이블 삭제 | `RENAME TO tb_<name>_dropped_YYYYMMDD` -> 한 달 뒤 DROP |

- 운영 테이블에 `ALTER TABLE`을 트랜잭션 하나로 여러 개 묶지 않는다. 각각 별도 문장, 락 시간 예측을 문서에.
- 백필 UPDATE에 `WHERE` 없는 전체 갱신 금지. 행 수 추정치와 예상 시간을 문서에 적고, 10만 행 이상이면 청크.

## 6. 인덱스

- 만드는 기준: `jpa-query-optimization`의 실행계획 확인 후. "혹시 몰라서" 인덱스 금지(쓰기 비용).
- FK 컬럼에는 기본으로 인덱스(PostgreSQL은 FK가 인덱스를 만들지 않는다). JOIN과 `ON DELETE RESTRICT` 검사가 여기서 느려진다.
- 복합 인덱스 컬럼 순서: 등호 조건 -> 범위 조건 -> 정렬. 커서 페이징(`api-design`)은 `(정렬 컬럼, id)` 순서로 정렬 방향까지 일치.
- 소프트 삭제 테이블의 조회 인덱스는 부분 인덱스(`WHERE deleted_at IS NULL`)로 작게.
- 인덱스 이름에 컬럼을 전부 넣는다. 나중에 무엇인지 보려고 카탈로그를 뒤지지 않게.

## 7. 리뷰 체크 (`spring-code-review`가 본다)

- [ ] 새 테이블이 `tb_` + 단수 snake_case, 공통 컬럼 5개, `deleted_at` 있음
- [ ] enum 컬럼이 `varchar` + `@Enumerated(STRING)`
- [ ] 시각 컬럼이 `timestamptz`/`_at`, boolean에 `is_` 없음
- [ ] unique가 소프트 삭제를 고려(부분 인덱스)
- [ ] FK 제약과 FK 인덱스가 있음
- [ ] 위험 변경이 expand-contract 순서
- [ ] SQL 파일 + 롤백 + `docs/db/` 문서가 같은 커밋
- [ ] `ddl-auto`가 `validate`(로컬 제외)
- [ ] AI가 DB에 접속하거나 실행한 흔적 없음 (`[BLOCKER]`)

## 하지 말 것

- DB 접속, SQL 실행, 접속 정보 요청. `ddl-auto: update`.
- DB enum 타입, check로 값 목록 고정, 숫자 코드, `@Enumerated(ORDINAL)`.
- 물리 삭제를 기본으로. 소프트 삭제 테이블에 일반 unique.
- `timestamp without time zone`, `is_` 접두사, 약어 컬럼, 복합 PK, FK 제약 생략.
- 컬럼 이름/타입을 한 번에 `ALTER`. 코드와 DDL을 같은 배포에.
- 롤백 없는 마이그레이션, 문서 없는 스키마 변경, `WHERE` 없는 백필.
- "혹시 몰라서" 인덱스.

## 관련 스킬

`batch-and-scheduler`(대량 백필 실행 계획서와 청크 처리), `rag-pipeline`(pgvector 테이블과 인덱스), `file-upload-storage`(파일 메타 테이블), `notification`(발송 이력·동의 테이블), `deploy-pipeline`(마이그레이션과 배포 순서). 
`ddd-spring`(엔티티 규칙), `jpa-query-optimization`(실행계획, 배치 insert, 커서 인덱스), `api-design`(커서 페이징), `config-and-secrets`(DB 접속 정보), `deliverable-structure`(`docs/db/`, `docs/erd/`), `spring-code-review`.

## 더 보기
- 이유, 예시 SQL/코드, DB2 대응, 참고 링크: `reference.md` (판단이 안 서거나 처음 적용할 때만 읽는다)
