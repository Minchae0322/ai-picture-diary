-- ============================================================
-- 대상 DB   : <PostgreSQL / DB2>
-- 목적      : ShedLock 락 테이블 생성 (스케줄러 다중 인스턴스 중복 실행 방지)
-- 문서      : docs/db/YYYY-MM-DD-shedlock-테이블-추가.md
-- 분류      : 신규 테이블 (기존 데이터 영향 없음)
-- 예상 락   : 없음
-- 실행 순서 : dev -> 코드 배포 -> prod  (스테이징이 있으면 dev 다음에 넣는다)
-- 실행자    : (사람이 실행. AI는 이 파일 작성까지만)
-- ============================================================

-- PostgreSQL
create table shedlock (
    name       varchar(64)  not null,
    lock_until timestamptz  not null,
    locked_at  timestamptz  not null,
    locked_by  varchar(255) not null,
    constraint pk_shedlock primary key (name)
);

-- DB2
-- create table shedlock (
--     name       varchar(64)  not null,
--     lock_until timestamp    not null,
--     locked_at  timestamp    not null,
--     locked_by  varchar(255) not null,
--     constraint pk_shedlock primary key (name)
-- );

-- 확인
-- select * from shedlock order by name;

-- ============================================================
-- 롤백
-- ============================================================
-- drop table shedlock;

-- 주의
-- - 테이블/컬럼 이름은 ShedLock JdbcTemplateLockProvider의 기본값이다.
--   프로젝트 네이밍(tb_ 접두사)에 맞추려면 LockProvider 설정에서
--   withTableName(...) / withColumnNames(...)를 함께 지정해야 한다.
-- - LockProvider에 usingDbTime()을 켜서 인스턴스 간 시계 오차를 없앤다.
-- - 행은 배치 이름당 1개만 생기고 계속 갱신된다. 별도 정리 배치는 필요 없다.
