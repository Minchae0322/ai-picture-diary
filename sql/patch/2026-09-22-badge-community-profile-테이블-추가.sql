-- 목적: 시안 05~10 화면 구현에 필요한 도메인 테이블 추가 (뱃지 / 커뮤니티 / 프로필·꾸미기)
-- 대상: MySQL 8.0 / 전부 신규 테이블이므로 무중단 고려 없음
-- 작성: 2026-09-22 (2026-10-14 MySQL 로 다시 씀 - docs/adr/2026-10-14-DB를-MySQL로.md)
-- 실행: 사람이 한다. AI는 실행하지 않는다(db-schema-and-migration 0장)
--
-- 05 캘린더·06 그래프는 tb_diary 만으로 집계한다. 새 테이블이 없다.
--
-- alive 컬럼: MySQL 에는 부분 인덱스가 없어 "살아 있는 행만 unique" 를 이렇게 만든다.
--             살아 있으면 1, 삭제됐으면 NULL. NULL 은 중복으로 보지 않는다.
--             애플리케이션은 이 컬럼을 매핑하지 않는다.

-- ---------------------------------------------------------------- 07 뱃지
CREATE TABLE tb_user_badge (
    id         bigint      NOT NULL AUTO_INCREMENT,
    user_id    bigint      NOT NULL,
    badge_type varchar(40) NOT NULL COMMENT 'BadgeType enum 이름. 저장된 이름은 바꾸지 않는다',
    earned_at  datetime(6) NOT NULL,
    created_at datetime(6) NOT NULL,
    created_by bigint      NOT NULL,
    updated_at datetime(6) NOT NULL,
    updated_by bigint      NOT NULL,
    deleted_at datetime(6),
    version    int         NOT NULL DEFAULT 0,
    alive      tinyint     GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED
                           COMMENT '소프트 삭제 제외용. 살아 있으면 1, 삭제됐으면 NULL',
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '사용자가 획득한 뱃지 (정의는 코드 enum BadgeType)';

-- 같은 뱃지를 두 번 주지 않는다. 획득 판정의 멱등성을 DB가 보장한다
CREATE UNIQUE INDEX ux_user_badge_user_id_badge_type
    ON tb_user_badge (user_id, badge_type, alive);

-- ---------------------------------------------------------------- 08 커뮤니티
CREATE TABLE tb_community_post (
    id            bigint       NOT NULL AUTO_INCREMENT,
    user_id       bigint       NOT NULL,
    diary_id      bigint       NOT NULL,
    author_name   varchar(30)  NOT NULL,
    weather       varchar(30)  NOT NULL COMMENT 'diary.Weather enum 이름. 커뮤니티는 일기 도메인을 참조하지 않아 문자열로 보관',
    content       varchar(500) NOT NULL COMMENT '게시 시점의 일기 본문 복사본. 원본 수정은 따라가지 않는다',
    like_count    int          NOT NULL DEFAULT 0,
    comment_count int          NOT NULL DEFAULT 0,
    created_at    datetime(6)  NOT NULL,
    created_by    bigint       NOT NULL,
    updated_at    datetime(6)  NOT NULL,
    updated_by    bigint       NOT NULL,
    deleted_at    datetime(6),
    version       int          NOT NULL DEFAULT 0,
    alive         tinyint      GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED
                               COMMENT '소프트 삭제 제외용. 살아 있으면 1, 삭제됐으면 NULL',
    PRIMARY KEY (id),
    CONSTRAINT ck_community_post_like_count CHECK (like_count >= 0)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '08 커뮤니티 피드 글 (04 일기를 복사해 게시)';

-- 같은 일기를 두 번 공유하지 않는다
CREATE UNIQUE INDEX ux_community_post_diary_id
    ON tb_community_post (diary_id, alive);

-- 최신 정렬 커서: id DESC 하나로 유일
CREATE INDEX ix_community_post_id_desc
    ON tb_community_post (id DESC);

-- 인기 정렬 커서: (like_count DESC, id DESC). 날씨 필터는 선택도가 낮아 인덱스에 넣지 않는다
CREATE INDEX ix_community_post_like_count_id_desc
    ON tb_community_post (like_count DESC, id DESC);

CREATE TABLE tb_post_like (
    id         bigint      NOT NULL AUTO_INCREMENT,
    post_id    bigint      NOT NULL,
    user_id    bigint      NOT NULL,
    created_at datetime(6) NOT NULL,
    created_by bigint      NOT NULL,
    updated_at datetime(6) NOT NULL,
    updated_by bigint      NOT NULL,
    deleted_at datetime(6),
    version    int         NOT NULL DEFAULT 0,
    alive      tinyint     GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED
                           COMMENT '소프트 삭제 제외용. 살아 있으면 1, 삭제됐으면 NULL',
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '08 좋아요';

-- 연타·중복 좋아요를 DB가 막는다(애플리케이션 검사만으로는 경쟁 상태가 남는다)
CREATE UNIQUE INDEX ux_post_like_post_id_user_id
    ON tb_post_like (post_id, user_id, alive);

CREATE TABLE tb_post_report (
    id         bigint      NOT NULL AUTO_INCREMENT,
    post_id    bigint      NOT NULL,
    user_id    bigint      NOT NULL,
    reason     varchar(30) NOT NULL,
    detail     varchar(200),
    created_at datetime(6) NOT NULL,
    created_by bigint      NOT NULL,
    updated_at datetime(6) NOT NULL,
    updated_by bigint      NOT NULL,
    deleted_at datetime(6),
    version    int         NOT NULL DEFAULT 0,
    alive      tinyint     GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED
                           COMMENT '소프트 삭제 제외용. 살아 있으면 1, 삭제됐으면 NULL',
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '신고. UGC 배포 필수 항목(app-store-release)';

-- 한 사람이 같은 글을 반복 신고하지 않는다
CREATE UNIQUE INDEX ux_post_report_post_id_user_id
    ON tb_post_report (post_id, user_id, alive);

-- ---------------------------------------------------------------- 09·10 프로필/꾸미기
CREATE TABLE tb_profile (
    id             bigint      NOT NULL AUTO_INCREMENT,
    user_id        bigint      NOT NULL,
    nickname       varchar(30) NOT NULL,
    theme_code     varchar(40) NOT NULL COMMENT 'StoreItem enum 이름 (THEME 카테고리)',
    character_code varchar(40) NOT NULL COMMENT 'StoreItem enum 이름 (CHARACTER 카테고리)',
    plus           boolean     NOT NULL DEFAULT false COMMENT '구독 여부. 결제·영수증 검증은 아직 없다(09 미정)',
    joined_on      date        NOT NULL,
    reminder_time  time                 COMMENT 'NULL = 리마인더 설정 안 함',
    ai_style       varchar(40) NOT NULL,
    diary_lock     boolean     NOT NULL DEFAULT false,
    created_at     datetime(6) NOT NULL,
    created_by     bigint      NOT NULL,
    updated_at     datetime(6) NOT NULL,
    updated_by     bigint      NOT NULL,
    deleted_at     datetime(6),
    version        int         NOT NULL DEFAULT 0,
    alive          tinyint     GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED
                               COMMENT '소프트 삭제 제외용. 살아 있으면 1, 삭제됐으면 NULL',
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '10 마이페이지 + 09 꾸미기 선택 상태. 인증 도입 전이라 사용자 테이블을 겸한다';

CREATE UNIQUE INDEX ux_profile_user_id
    ON tb_profile (user_id, alive);

-- 실행 후 확인
-- SHOW CREATE TABLE tb_user_badge;
-- SHOW CREATE TABLE tb_community_post;
-- SHOW CREATE TABLE tb_profile;

-- 롤백
-- DROP TABLE tb_post_report; DROP TABLE tb_post_like; DROP TABLE tb_community_post;
-- DROP TABLE tb_user_badge; DROP TABLE tb_profile;
