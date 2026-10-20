-- 목적: 게스트와 계정 보유자를 프로필이 구분하게 한다 (로그인 벽 · 하루 AI 생성 상한의 기준)
-- 대상: MySQL 8.0 / tb_profile 은 이미 실행된 테이블이라 ALTER 다
-- 근거: docs/adr/2026-10-20-로그인-없이-쓰는-게스트-모드.md
-- 작성: 2026-10-20
-- 실행: 사람이 한다. AI는 실행하지 않는다(db-schema-and-migration 0장)
-- 주의: 로컬에서 ddl-auto=update 로 먼저 띄웠다면 하이버네이트가 만든 것이 이미 있다.
--       그 모양은 이 파일과 다르다(unique 인덱스 없음 / 컬럼 타입이 enum). 실행 전에 떨어뜨린다.

-- 기존 행은 전부 GUEST 가 된다. 아직 로그인이 없으므로 사실과 맞다.
-- DEFAULT 는 그 채우기용이다 - 애플리케이션은 INSERT 에 role 을 늘 담는다.
ALTER TABLE tb_profile
    ADD COLUMN role varchar(20) NOT NULL DEFAULT 'GUEST'
        COMMENT 'GUEST|MEMBER. 로그인하면 MEMBER 로 올라가고 사용자 번호는 그대로다';

-- 실행 후 확인
-- SELECT role, count(*) FROM tb_profile GROUP BY role;

-- 롤백
-- ALTER TABLE tb_profile DROP COLUMN role;
