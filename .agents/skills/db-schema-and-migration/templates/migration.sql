-- ============================================================
-- 파일: sql/patch/YYYY-MM-DD-<짧은-설명>.sql   (Flyway면 db/migration/V<yyyyMMddHHmm>__<desc>.sql)
-- 대상 DB : PostgreSQL 16 / DB2 11.5  (하나만 남긴다)
-- 목적    : tb_article 에 published_at 컬럼 추가 (기사 발행 시각 기록)
-- 문서    : docs/db/YYYY-MM-DD-기사-발행시각-컬럼-추가.md
-- 분류    : 추가만(안전)  |  위험(expand-contract 1/3단계)   (하나 선택)
-- 예상 락 : ALTER ADD COLUMN nullable - 짧은 ACCESS EXCLUSIVE, 즉시 완료
-- 영향 행 : tb_article 약 1,200,000행 (백필 없음)
-- 실행 순서: 1) 이 파일  2) 코드 배포 v1.0.107  3) (없음)
-- 실행자  : DBA / 담당자 이름   실행 환경: dev -> prod  (스테이징이 있으면 사이에)
-- ============================================================

-- 1. 스키마 변경 (문장마다 별도 실행 가능하게 세미콜론으로 끝낸다)
ALTER TABLE tb_article ADD COLUMN published_at TIMESTAMPTZ;
COMMENT ON COLUMN tb_article.published_at IS '기사 발행 시각. null이면 미발행';

-- 2. 인덱스 (PostgreSQL: 트랜잭션 밖에서 CONCURRENTLY. Flyway면 executeInTransaction=false)
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_article_published_at
    ON tb_article(published_at DESC, id DESC)
    WHERE deleted_at IS NULL;

-- 3. 백필 (필요 시. 청크로, 반복 실행. 영향 행 0이면 종료)
-- UPDATE tb_article SET published_at = created_at
--  WHERE id IN (SELECT id FROM tb_article WHERE status = 'PUBLISHED' AND published_at IS NULL ORDER BY id LIMIT 10000);

-- 4. 실행 후 확인 (사람이 실행하고 결과를 문서 "실행 기록"에 적는다)
-- SELECT count(*) FROM tb_article WHERE published_at IS NULL AND status = 'PUBLISHED';   -- 기대: 0
-- SELECT indexname FROM pg_indexes WHERE tablename = 'tb_article';

-- ============================================================
-- 롤백 (같은 파일 하단 또는 *-rollback.sql)
-- DROP INDEX CONCURRENTLY IF EXISTS ix_article_published_at;
-- ALTER TABLE tb_article DROP COLUMN published_at;
-- ============================================================
