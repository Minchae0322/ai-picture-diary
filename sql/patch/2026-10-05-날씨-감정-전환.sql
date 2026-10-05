-- 목적: 감정 표현을 날씨 6종에서 감정 9종(과일 캐릭터)으로 바꾼다
-- 대상: PostgreSQL
-- 작성: 2026-10-05
-- 실행: 사람이 한다. AI는 실행하지 않는다(db-schema-and-migration 0장)
--
-- 선행: 2026-09-22-커뮤니티-추천정렬.sql
--
-- 날씨는 감정을 은유로 한 겹 더 감쌌고 6칸이 좁았다. 이제 감정을 그대로 저장한다.
-- 컬럼 이름도 weather -> emotion 으로 바꾼다. 엔티티 필드명이 바뀌었고
-- 매핑이 암시적이라(명시적 @Column(name) 이 없다) ddl-auto: validate 가 이름을 본다.
--
-- **되돌릴 수 없는 손실이 있다.** 6 -> 9 는 늘리는 방향이라 옛 값은 전부 새 값으로 갈 수 있지만,
-- 반대로 되돌리면 ANGRY / EMBARRASSED / SHY 는 옛 어휘에 자리가 없다. 롤백 절을 참고.

BEGIN;

-- ---------------------------------------------------------------- 1) tb_diary

ALTER TABLE tb_diary RENAME COLUMN weather TO emotion;

-- 값 옮기기. user_hint 도 같은 enum 을 담는다
UPDATE tb_diary
SET emotion = CASE emotion
        WHEN 'SUNNY'         THEN 'HAPPY'
        WHEN 'PARTLY_CLOUDY' THEN 'SOSO'
        WHEN 'CLOUDY'        THEN 'TIRED'
        WHEN 'RAIN'          THEN 'SAD'
        WHEN 'SNOW'          THEN 'DEPRESSED'
        WHEN 'RAINBOW'       THEN 'ENERGETIC'
        ELSE emotion
    END
WHERE emotion IS NOT NULL;

UPDATE tb_diary
SET user_hint = CASE user_hint
        WHEN 'SUNNY'         THEN 'HAPPY'
        WHEN 'PARTLY_CLOUDY' THEN 'SOSO'
        WHEN 'CLOUDY'        THEN 'TIRED'
        WHEN 'RAIN'          THEN 'SAD'
        WHEN 'SNOW'          THEN 'DEPRESSED'
        WHEN 'RAINBOW'       THEN 'ENERGETIC'
        ELSE user_hint
    END
WHERE user_hint IS NOT NULL;

COMMENT ON COLUMN tb_diary.emotion   IS 'HAPPY|ENERGETIC|SOSO|SHY|EMBARRASSED|TIRED|SAD|DEPRESSED|ANGRY';
COMMENT ON COLUMN tb_diary.user_hint IS '02 빠른 감정 칩. 사용자 힌트이며 AI 판정을 대체하지 않음. 값은 emotion 과 같은 enum';

-- ------------------------------------------------------- 2) tb_community_post

ALTER TABLE tb_community_post RENAME COLUMN weather TO emotion;

UPDATE tb_community_post
SET emotion = CASE emotion
        WHEN 'SUNNY'         THEN 'HAPPY'
        WHEN 'PARTLY_CLOUDY' THEN 'SOSO'
        WHEN 'CLOUDY'        THEN 'TIRED'
        WHEN 'RAIN'          THEN 'SAD'
        WHEN 'SNOW'          THEN 'DEPRESSED'
        WHEN 'RAINBOW'       THEN 'ENERGETIC'
        ELSE emotion
    END;

COMMENT ON COLUMN tb_community_post.emotion IS 'diary.Emotion enum 이름. 커뮤니티는 일기 도메인을 참조하지 않아 문자열로 보관';

-- 인덱스는 컬럼 이름 변경을 따라가지만 이름에 weather 가 남는다. 같이 고친다
ALTER INDEX ix_community_post_weather_id_desc RENAME TO ix_community_post_emotion_id_desc;

-- --------------------------------------------------------------- 3) tb_badge

-- 지표 이름이 BadgeMetric enum 과 1:1이다. enum 을 바꿨으니 저장된 값도 바꾼다
UPDATE tb_badge SET metric = 'HAPPY_RECORDS' WHERE metric = 'SUNNY_RECORDS';
UPDATE tb_badge SET metric = 'SAD_RECORDS'   WHERE metric = 'RAIN_RECORDS';
UPDATE tb_badge SET metric = 'ALL_EMOTIONS'  WHERE metric = 'ALL_WEATHERS';

-- 날씨 어휘로 쓴 뱃지 이름·조건문도 감정으로 옮긴다. code 는 식별자라 바꾸지 않는다
UPDATE tb_badge
SET name = '행복 수집가', condition_text = '행복한 날 10회'
WHERE code = 'SUNNY_COLLECTOR';

UPDATE tb_badge
SET name = '슬픈 날', condition_text = '슬픈 날 5회'
WHERE code = 'RAINY_DAY';

-- "6종 전부" 는 이제 9종이다. 임계값(1)은 참/거짓이라 그대로 둔다
UPDATE tb_badge
SET condition_text = '9종 전부'
WHERE code = 'EMOTION_EXPLORER';

COMMIT;

-- 실행 후 확인
-- \d tb_diary
-- \d tb_community_post
-- SELECT DISTINCT emotion FROM tb_diary;            -- 9종 안에만 있어야 한다
-- SELECT DISTINCT emotion FROM tb_community_post;   -- 같다
-- SELECT metric, count(*) FROM tb_badge GROUP BY metric;   -- SUNNY_RECORDS / RAIN_RECORDS / ALL_WEATHERS 가 0건
-- SELECT count(*) FROM tb_diary WHERE emotion IN ('SUNNY','PARTLY_CLOUDY','CLOUDY','RAIN','SNOW','RAINBOW');  -- 0

-- 롤백
-- **값은 완전히 되돌아가지 않는다.** ANGRY / EMBARRASSED / SHY 는 옛 날씨 어휘에 자리가 없어
-- 가장 가까운 값으로 뭉갠다. 되돌릴 일이 생기면 이 뭉개짐을 먼저 사람이 승인해야 한다.
-- BEGIN;
-- UPDATE tb_badge SET condition_text = '6종 전부' WHERE code = 'EMOTION_EXPLORER';
-- UPDATE tb_badge SET name = '비 오는 날', condition_text = '비 5회' WHERE code = 'RAINY_DAY';
-- UPDATE tb_badge SET name = '맑음 수집가', condition_text = '맑음 10회' WHERE code = 'SUNNY_COLLECTOR';
-- UPDATE tb_badge SET metric = 'ALL_WEATHERS'  WHERE metric = 'ALL_EMOTIONS';
-- UPDATE tb_badge SET metric = 'RAIN_RECORDS'  WHERE metric = 'SAD_RECORDS';
-- UPDATE tb_badge SET metric = 'SUNNY_RECORDS' WHERE metric = 'HAPPY_RECORDS';
-- ALTER INDEX ix_community_post_emotion_id_desc RENAME TO ix_community_post_weather_id_desc;
-- UPDATE tb_community_post SET emotion = CASE emotion
--     WHEN 'HAPPY' THEN 'SUNNY'   WHEN 'ENERGETIC' THEN 'RAINBOW'  WHEN 'SOSO' THEN 'PARTLY_CLOUDY'
--     WHEN 'TIRED' THEN 'CLOUDY'  WHEN 'SAD' THEN 'RAIN'           WHEN 'DEPRESSED' THEN 'SNOW'
--     WHEN 'SHY' THEN 'RAINBOW'   WHEN 'EMBARRASSED' THEN 'CLOUDY' WHEN 'ANGRY' THEN 'RAIN' END;
-- ALTER TABLE tb_community_post RENAME COLUMN emotion TO weather;
-- (tb_diary 의 emotion / user_hint 도 같은 표로 되돌린 뒤 컬럼 이름을 바꾼다)
-- COMMIT;
