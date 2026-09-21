-- ============================================================
-- 대상 DB   : PostgreSQL (DB2는 timestamptz -> timestamp)
-- 목적      : 업로드 파일 메타 테이블
-- 문서      : docs/db/YYYY-MM-DD-파일-테이블-추가.md
-- 분류      : 신규 테이블
-- 실행 순서 : dev -> 코드 배포 -> prod  (스테이징이 있으면 dev 다음에 넣는다)
-- 실행자    : (사람이 실행. AI는 이 파일 작성까지)
-- ============================================================

create sequence seq_file start with 1 increment by 50;

create table tb_file (
    id              bigint       not null,

    -- 저장 위치
    storage_key     varchar(500) not null,      -- <용도>/origin/yyyy/MM/dd/<uuid>.<ext>
    bucket          varchar(100) not null,

    -- 원본 정보 (경로에는 쓰지 않는다)
    original_name   varchar(500) not null,
    mime_type       varchar(100) not null,
    size_bytes      bigint       not null,
    etag            varchar(100),

    -- 용도와 상태
    purpose         varchar(50)  not null,      -- PROFILE, ATTACHMENT, DOCUMENT ...
    status          varchar(30)  not null,      -- PENDING, READY, LINKED, DELETING

    -- 소유/연결
    owner_id        bigint       not null,
    linked_type     varchar(50),                -- ARTICLE, MEMBER ... (연결된 엔티티 종류)
    linked_id       bigint,

    -- 이미지 부가 정보 (해당 시). width/height는 '원본'의 크기다
    width           integer,
    height          integer,
    -- 생성 완료된 변형 목록. 변형 키는 원본 키에서 규칙으로 유도하므로 키 자체는 저장하지 않는다
    -- 예: 'THUMB,MEDIUM'  (없거나 비면 아직 생성 전 -> 화면은 원본으로 폴백)
    variants_ready  varchar(200),

    -- 공통 컬럼
    created_at      timestamptz  not null,
    created_by      bigint,
    updated_at      timestamptz  not null,
    updated_by      bigint,
    deleted_at      timestamptz,
    version         integer      not null default 0,

    constraint pk_file primary key (id),
    constraint ux_file_storage_key unique (storage_key),
    constraint ck_file_size_positive check (size_bytes > 0)
);

-- 정리 배치용: 상태 + 생성 시각
create index ix_file_status_created_at on tb_file (status, created_at) where deleted_at is null;

-- 연결 엔티티에서 첨부 조회
create index ix_file_linked on tb_file (linked_type, linked_id) where deleted_at is null;

-- 소유자별 조회
create index ix_file_owner on tb_file (owner_id, created_at desc) where deleted_at is null;

-- 확인
-- select status, count(*) from tb_file where deleted_at is null group by status;

-- ============================================================
-- 롤백
-- ============================================================
-- drop table tb_file;
-- drop sequence seq_file;

-- 주의
-- - storage_key는 unique. 같은 키로 두 행이 생기면 정리 배치가 남의 파일을 지운다.
-- - storage_key는 '원본' 키다. 썸네일 등 변형은 이 키에서 prefix/확장자를 바꿔 유도한다
--   (profile/origin/2026/09/15/<uuid>.jpg -> profile/thumb/2026/09/15/<uuid>.webp).
--   변형마다 행을 만들지 않는다. 원본 1개 = 행 1개.
-- - 원본은 덮어쓰지 않는다. 리사이즈 결과를 storage_key에 쓰면 되돌릴 수 없다.
-- - 상태 전이: PENDING -> READY -> LINKED, 어느 단계에서든 -> DELETING
-- - 실제 스토리지 삭제는 배치가 한다. 이 테이블의 행 삭제보다 스토리지 삭제가 먼저다.
