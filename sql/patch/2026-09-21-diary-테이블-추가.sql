-- 목적: 그림일기 핵심 루프(02 기록 -> 03 생성 -> 04 결과)용 테이블 추가
-- 대상: PostgreSQL / 신규 테이블이므로 무중단 고려 없음
-- 작성: 2026-09-21
-- 실행: 사람이 한다. AI는 실행하지 않는다(db-schema-and-migration 0장)

CREATE SEQUENCE seq_diary START 1 INCREMENT 50;

CREATE TABLE tb_diary (
    id               bigint       NOT NULL DEFAULT nextval('seq_diary'),
    user_id          bigint       NOT NULL,
    entry_date       date         NOT NULL,
    content          varchar(500) NOT NULL,
    user_hint        varchar(30),
    weather          varchar(30),
    mood_score       integer,
    ai_comment       varchar(300),
    image_url        varchar(500),
    status           varchar(30)  NOT NULL,
    regenerate_count integer      NOT NULL DEFAULT 0,
    created_at       timestamptz  NOT NULL,
    created_by       bigint       NOT NULL,
    updated_at       timestamptz  NOT NULL,
    updated_by       bigint       NOT NULL,
    deleted_at       timestamptz,
    version          integer      NOT NULL DEFAULT 0,
    CONSTRAINT pk_diary PRIMARY KEY (id),
    CONSTRAINT ck_diary_mood_score CHECK (mood_score IS NULL OR mood_score BETWEEN -3 AND 3)
);

-- 하루 1건. 소프트 삭제를 고려한 부분 인덱스(2장)
CREATE UNIQUE INDEX ux_diary_user_id_entry_date
    ON tb_diary (user_id, entry_date) WHERE deleted_at IS NULL;

-- 최근 기록 커서 페이징: (정렬 컬럼, 유일 키) 순서, 방향까지 일치
CREATE INDEX ix_diary_user_id_entry_date_desc
    ON tb_diary (user_id, entry_date DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE  tb_diary            IS '그림일기 (하루 1건)';
COMMENT ON COLUMN tb_diary.user_hint  IS '02 빠른 감정 칩. 사용자 힌트이며 AI 판정을 대체하지 않음';
COMMENT ON COLUMN tb_diary.weather    IS 'SUNNY|PARTLY_CLOUDY|CLOUDY|RAIN|SNOW|RAINBOW';
COMMENT ON COLUMN tb_diary.status     IS 'GENERATING|DONE|FAILED';

-- 실행 후 확인
-- SELECT count(*) FROM tb_diary;
-- \d tb_diary

-- 롤백
-- DROP TABLE tb_diary;
-- DROP SEQUENCE seq_diary;
