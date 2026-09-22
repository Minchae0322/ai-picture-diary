-- 목적: 08 커뮤니티에 "추천" 정렬 추가 (내 오늘 기분과 비슷한 글 먼저)
-- 대상: PostgreSQL
-- 작성: 2026-09-22
-- 실행: 사람이 한다. AI는 실행하지 않는다(db-schema-and-migration 0장)
--
-- 선행: 2026-09-22-badge-community-profile-테이블-추가.sql
--
-- 추천 점수는 (날씨 일치 + 기분 점수 근접 + 신선도)다. 앞의 둘을 재려면 게시글이 기분 점수를
-- 들고 있어야 한다. 정렬 점수는 사용자마다 달라서 미리 계산해 둘 수 없다 - 컬럼은 재료만 늘린다.

ALTER TABLE tb_community_post ADD COLUMN mood_score integer;

-- 기존 행 채우기: 공유 시점 일기의 점수. 지금은 데이터가 없어 0건이다
UPDATE tb_community_post p
   SET mood_score = d.mood_score
  FROM tb_diary d
 WHERE d.id = p.diary_id
   AND p.mood_score IS NULL;

-- 남은 행이 있으면(원본이 지워진 경우) 중립으로 둔다
UPDATE tb_community_post SET mood_score = 0 WHERE mood_score IS NULL;

ALTER TABLE tb_community_post ALTER COLUMN mood_score SET NOT NULL;

ALTER TABLE tb_community_post
    ADD CONSTRAINT ck_community_post_mood_score CHECK (mood_score BETWEEN -3 AND 3);

COMMENT ON COLUMN tb_community_post.mood_score IS '게시 시점 일기의 기분 점수(-3~3). 추천 정렬의 재료';

-- 추천 정렬은 점수를 매 요청 계산하므로 점수용 인덱스를 만들 수 없다.
-- 대신 후보를 좁히는 (weather, id DESC) 를 둔다 - 날씨 필터와 정렬 키를 같이 탄다
CREATE INDEX ix_community_post_weather_id_desc
    ON tb_community_post (weather, id DESC) WHERE deleted_at IS NULL;

-- 실행 후 확인
-- \d tb_community_post
-- SELECT count(*) FROM tb_community_post WHERE mood_score IS NULL;   -- 0 이어야 한다

-- 롤백
-- DROP INDEX ix_community_post_weather_id_desc;
-- ALTER TABLE tb_community_post DROP CONSTRAINT ck_community_post_mood_score;
-- ALTER TABLE tb_community_post DROP COLUMN mood_score;
