-- 목적: 뱃지 정의를 코드 enum에서 테이블로 옮긴다 (07 화면)
-- 대상: MySQL 8.0
-- 작성: 2026-09-22 (2026-10-14 MySQL 로 다시 씀 - docs/adr/2026-10-14-DB를-MySQL로.md)
-- 실행: 사람이 한다. AI는 실행하지 않는다(db-schema-and-migration 0장)
--
-- 왜: 시안이 말한 40종을 채우려면 코드 배포 없이 늘릴 수 있어야 한다.
--     이름·조건 문구·임계값·정렬은 데이터, "무엇을 재는가"(metric)는 코드(BadgeMetric)다.
--     여기 없는 metric 값을 넣으면 그 뱃지는 영원히 안 걸린다.
--
-- 선행: 2026-09-22-badge-community-profile-테이블-추가.sql 을 먼저 실행해야 한다
--       (이 파일이 tb_user_badge 의 컬럼명을 바꾼다)

CREATE TABLE tb_badge (
    id             bigint      NOT NULL AUTO_INCREMENT,
    code           varchar(40) NOT NULL,
    name           varchar(40) NOT NULL,
    condition_text varchar(60) NOT NULL COMMENT '07 화면에 그대로 보이는 문구. 앱 배포 없이 고치기 위해 데이터다',
    metric         varchar(40) NOT NULL COMMENT 'BadgeMetric enum 이름. 코드에 없는 값을 넣으면 그 뱃지는 안 걸린다',
    threshold      int         NOT NULL COMMENT '이 값 이상이면 획득. 0/1 지표는 1을 쓴다',
    sort_order     int         NOT NULL,
    created_at     datetime(6) NOT NULL,
    created_by     bigint      NOT NULL,
    updated_at     datetime(6) NOT NULL,
    updated_by     bigint      NOT NULL,
    deleted_at     datetime(6),
    version        int         NOT NULL DEFAULT 0,
    alive          tinyint     GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED
                               COMMENT '소프트 삭제 제외용. 살아 있으면 1, 삭제됐으면 NULL',
    PRIMARY KEY (id),
    CONSTRAINT ck_badge_threshold CHECK (threshold >= 1)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '뱃지 정의(마스터). 07 화면의 목록과 순서가 이 표다';

-- tb_user_badge.badge_code 가 이 값을 가리킨다. FK는 걸지 않는다:
-- 정의를 내려도 이미 받은 기록은 남아야 한다
CREATE UNIQUE INDEX ux_badge_code ON tb_badge (code, alive);

CREATE INDEX ix_badge_sort_order ON tb_badge (sort_order);

-- 시안의 12종. 나머지 28종은 아직 정의되지 않았다(07 화면 문서 7장)
INSERT INTO tb_badge (code, name, condition_text, metric, threshold, sort_order,
                      created_at, created_by, updated_at, updated_by)
VALUES
    ('FIRST_RECORD',     '첫 기록',     '1일',        'TOTAL_RECORDS',  1,   1,  now(6), 0, now(6), 0),
    ('JELLY_7',          '젤리 7',      '7일 연속',    'STREAK_DAYS',    7,   2,  now(6), 0, now(6), 0),
    ('JELLY_14',         '젤리 14',     '14일 연속',   'STREAK_DAYS',    14,  3,  now(6), 0, now(6), 0),
    ('SUNNY_COLLECTOR',  '맑음 수집가',  '맑음 10회',   'SUNNY_RECORDS',  10,  4,  now(6), 0, now(6), 0),
    ('RAINY_DAY',        '비 오는 날',   '비 5회',     'RAIN_RECORDS',   5,   5,  now(6), 0, now(6), 0),
    ('RAINBOW_30',       '무지개 30',   '30일 연속',   'STREAK_DAYS',    30,  6,  now(6), 0, now(6), 0),
    ('FOUR_SEASONS',     '사계절',      '365일',      'TOTAL_RECORDS',  365, 7,  now(6), 0, now(6), 0),
    ('EMOTION_EXPLORER', '감정 탐험가',  '6종 전부',    'ALL_WEATHERS',   1,   8,  now(6), 0, now(6), 0),
    ('DAWN_WRITER',      '새벽 기록',    '04시 기록',   'DAWN_RECORD',    1,   9,  now(6), 0, now(6), 0),
    ('SHARE_KING',       '공유왕',      '10회 공유',   'SHARES',         10,  10, now(6), 0, now(6), 0),
    ('FIRST_COMMENT',    '첫 댓글',     '커뮤니티',    'COMMENTS',       1,   11, now(6), 0, now(6), 0),
    ('PREMIUM',          '프리미엄',    '구독 시작',   'PREMIUM',        1,   12, now(6), 0, now(6), 0);

-- 획득 기록은 이제 enum 이름이 아니라 tb_badge.code 를 가리킨다
ALTER TABLE tb_user_badge RENAME COLUMN badge_type TO badge_code;
ALTER TABLE tb_user_badge
    RENAME INDEX ux_user_badge_user_id_badge_type TO ux_user_badge_user_id_badge_code;
ALTER TABLE tb_user_badge
    MODIFY COLUMN badge_code varchar(40) NOT NULL
    COMMENT 'tb_badge.code. FK 없음 - 정의를 내려도 받은 기록은 남는다';

-- 실행 후 확인
-- SELECT code, metric, threshold FROM tb_badge ORDER BY sort_order;
-- SHOW CREATE TABLE tb_user_badge;

-- 롤백
-- ALTER TABLE tb_user_badge RENAME INDEX ux_user_badge_user_id_badge_code TO ux_user_badge_user_id_badge_type;
-- ALTER TABLE tb_user_badge RENAME COLUMN badge_code TO badge_type;
-- DROP TABLE tb_badge;
