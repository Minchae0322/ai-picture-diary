-- 목적: 그림일기 핵심 루프(02 기록 -> 03 생성 -> 04 결과)용 테이블 추가
-- 대상: MySQL 8.0 / 신규 테이블이므로 무중단 고려 없음
-- 작성: 2026-09-21 (2026-10-14 MySQL 로 다시 씀 - docs/adr/2026-10-14-DB를-MySQL로.md)
-- 실행: 사람이 한다. AI는 실행하지 않는다(db-schema-and-migration 0장)

CREATE TABLE tb_diary (
    id               bigint       NOT NULL AUTO_INCREMENT,
    user_id          bigint       NOT NULL,
    entry_date       date         NOT NULL,
    content          varchar(500) NOT NULL,
    user_hint        varchar(30)           COMMENT '02 빠른 감정 칩. 사용자 힌트이며 AI 판정을 대체하지 않음',
    weather          varchar(30)           COMMENT 'SUNNY|PARTLY_CLOUDY|CLOUDY|RAIN|SNOW|RAINBOW',
    mood_score       int,
    ai_comment       varchar(300),
    image_url        varchar(500),
    status           varchar(30)  NOT NULL COMMENT 'GENERATING|DONE|FAILED',
    regenerate_count int          NOT NULL DEFAULT 0,
    created_at       datetime(6)  NOT NULL,
    created_by       bigint       NOT NULL,
    updated_at       datetime(6)  NOT NULL,
    updated_by       bigint       NOT NULL,
    deleted_at       datetime(6),
    version          int          NOT NULL DEFAULT 0,
    -- MySQL 에는 부분 인덱스가 없다. 살아 있는 행만 1, 삭제된 행은 NULL 로 만들어
    -- unique 키에 끼운다 - NULL 은 중복으로 보지 않으므로 삭제된 행끼리는 겹칠 수 있다.
    -- 애플리케이션이 매핑하지 않는 컬럼이다(ddl-auto: validate 는 추가 컬럼을 보지 않는다).
    alive            tinyint      GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED
                                  COMMENT '소프트 삭제 제외용. 살아 있으면 1, 삭제됐으면 NULL',
    PRIMARY KEY (id),
    CONSTRAINT ck_diary_mood_score CHECK (mood_score IS NULL OR mood_score BETWEEN -3 AND 3)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '그림일기 (하루 1건)';

-- 하루 1건. alive 를 끼워 소프트 삭제 행을 제외한다(2장)
CREATE UNIQUE INDEX ux_diary_user_id_entry_date
    ON tb_diary (user_id, entry_date, alive);

-- 최근 기록 커서 페이징: (정렬 컬럼, 유일 키) 순서, 방향까지 일치
CREATE INDEX ix_diary_user_id_entry_date_desc
    ON tb_diary (user_id, entry_date DESC);

-- 실행 후 확인
-- SELECT count(*) FROM tb_diary;
-- SHOW CREATE TABLE tb_diary;

-- 롤백
-- DROP TABLE tb_diary;
