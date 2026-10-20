-- 목적: 로그인 없이 쓰는 게스트 모드. 기기 하나에 사용자 번호 하나를 발급한다
-- 대상: MySQL 8.0 / 신규 테이블이므로 무중단 고려 없음
-- 근거: docs/adr/2026-10-20-로그인-없이-쓰는-게스트-모드.md
-- 작성: 2026-10-20
-- 실행: 사람이 한다. AI는 실행하지 않는다(db-schema-and-migration 0장)
-- 주의: 로컬에서 ddl-auto=update 로 먼저 띄웠다면 하이버네이트가 만든 것이 이미 있다.
--       그 모양은 이 파일과 다르다(unique 인덱스 없음 / 컬럼 타입이 enum). 실행 전에 떨어뜨린다.

CREATE TABLE tb_guest_device (
    id          bigint      NOT NULL AUTO_INCREMENT
                            COMMENT '이 값이 곧 사용자 번호다. 인증이 붙으면 tb_user 를 가리키는 컬럼이 생긴다',
    -- 기기 UUID 원문을 저장하지 않는 이유는 ADR 1번에 있다. 한 번 샌 값이 영구 식별자가 되지 않게 한다.
    -- 길이가 64 로 고정이라 varchar 가 아니라 char 다.
    device_hash char(64)    NOT NULL COMMENT '기기 UUID 의 SHA-256 소문자 hex',
    created_at  datetime(6) NOT NULL,
    created_by  bigint      NOT NULL,
    updated_at  datetime(6) NOT NULL,
    updated_by  bigint      NOT NULL,
    deleted_at  datetime(6),
    version     int         NOT NULL DEFAULT 0,
    alive       tinyint     GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED
                            COMMENT '소프트 삭제 제외용. 살아 있으면 1, 삭제됐으면 NULL',
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '게스트 기기 (기기 1대 = 사용자 1명)';

-- 같은 기기가 두 번 등록되면 기록이 둘로 갈린다. alive 를 끼워 소프트 삭제 행을 제외한다(2장)
CREATE UNIQUE INDEX ux_guest_device_hash
    ON tb_guest_device (device_hash, alive);

-- 실행 후 확인
-- SELECT count(*) FROM tb_guest_device;
-- SHOW CREATE TABLE tb_guest_device;

-- 롤백
-- DROP TABLE tb_guest_device;
