-- ============================================================
-- 대상 DB   : PostgreSQL (DB2는 timestamptz -> timestamp)
-- 목적      : 알림 발송 요청/이력, 수신 동의, 디바이스 토큰
-- 문서      : docs/db/YYYY-MM-DD-알림-테이블-추가.md
-- 분류      : 신규 테이블
-- 실행 순서 : dev -> 코드 배포 -> prod  (스테이징이 있으면 dev 다음에 넣는다)
-- 실행자    : (사람이 실행. AI는 이 파일 작성까지)
-- ============================================================

-- 1. 발송 요청 --------------------------------------------------
create table tb_notification_request (
    id              bigint       not null,
    type            varchar(50)  not null,      -- NotificationType enum (문자열로 저장)
    category        varchar(30)  not null,      -- TRANSACTIONAL, MARKETING
    user_id         bigint       not null,
    event_key       varchar(200) not null,      -- 중복 방지용 사건 키. 예: order:12345
    payload         jsonb        not null,      -- 템플릿 변수
    status          varchar(30)  not null,      -- PENDING, DISPATCHED, SKIPPED
    skip_reason     varchar(100),               -- CONSENT_DENIED, SETTING_OFF ...
    scheduled_at    timestamptz,                -- 야간 지연 발송 등
    created_at      timestamptz  not null,
    updated_at      timestamptz  not null,

    constraint pk_notification_request primary key (id),
    -- 같은 사건에 같은 알림을 두 번 만들지 않는다
    constraint ux_notification_request_event unique (type, user_id, event_key)
);

create index ix_notification_request_pending
    on tb_notification_request (status, scheduled_at)
    where status = 'PENDING';

-- 2. 발송 이력 (채널별) ----------------------------------------
create table tb_notification_history (
    id              bigint       not null,
    request_id      bigint       not null,
    channel         varchar(30)  not null,      -- PUSH, INAPP, EMAIL, SMS, ALIMTALK
    status          varchar(30)  not null,      -- SENT, FAILED, RETRYABLE
    result_code     varchar(100),               -- 채널이 준 코드. 원문 연락처는 저장하지 않는다
    error_message   varchar(1000),
    retry_count     integer      not null default 0,
    sent_at         timestamptz,
    created_at      timestamptz  not null,

    constraint pk_notification_history primary key (id),
    constraint fk_notification_history_request
        foreign key (request_id) references tb_notification_request (id)
);

create index ix_notification_history_request on tb_notification_history (request_id);
create index ix_notification_history_retry
    on tb_notification_history (status, created_at)
    where status = 'RETRYABLE';

-- 3. 인앱 알림함 ------------------------------------------------
create table tb_notification_inbox (
    id              bigint       not null,
    user_id         bigint       not null,
    type            varchar(50)  not null,
    title           varchar(200) not null,
    body            varchar(1000) not null,
    link            varchar(500),               -- 딥링크
    read_at         timestamptz,
    created_at      timestamptz  not null,
    deleted_at      timestamptz,

    constraint pk_notification_inbox primary key (id)
);

-- 커서 페이징용 (api-design 6장)
create index ix_notification_inbox_user
    on tb_notification_inbox (user_id, created_at desc, id desc)
    where deleted_at is null;

-- 4. 종류별 수신 설정 -------------------------------------------
create table tb_notification_setting (
    id              bigint       not null,
    user_id         bigint       not null,
    type            varchar(50)  not null,
    enabled         boolean      not null,
    updated_at      timestamptz  not null,

    constraint pk_notification_setting primary key (id),
    constraint ux_notification_setting unique (user_id, type)
);

-- 5. 광고성 수신 동의 (분쟁 대비로 길게 보관) -------------------
create table tb_marketing_consent (
    id              bigint       not null,
    user_id         bigint       not null,
    agreed          boolean      not null,
    night_agreed    boolean      not null default false,   -- 21:00~08:00 별도 동의
    agreed_at       timestamptz,
    revoked_at      timestamptz,
    reconfirm_due   timestamptz,                -- 동의일 + 2년
    source          varchar(100),               -- 동의 경로: SIGNUP, SETTING, EVENT_PAGE ...
    source_ip       varchar(45),                -- 증빙용
    created_at      timestamptz  not null,
    updated_at      timestamptz  not null,

    constraint pk_marketing_consent primary key (id),
    constraint ux_marketing_consent_user unique (user_id)
);

create index ix_marketing_consent_reconfirm on tb_marketing_consent (reconfirm_due) where agreed = true;

-- 6. 디바이스 토큰 ----------------------------------------------
create table tb_device_token (
    id              bigint       not null,
    user_id         bigint       not null,
    token           varchar(500) not null,
    platform        varchar(20)  not null,      -- ANDROID, IOS, WEB
    app_version     varchar(30),
    active          boolean      not null default true,
    last_used_at    timestamptz,
    created_at      timestamptz  not null,
    updated_at      timestamptz  not null,

    constraint pk_device_token primary key (id),
    constraint ux_device_token unique (token)
);

create index ix_device_token_user on tb_device_token (user_id) where active = true;
create index ix_device_token_cleanup on tb_device_token (last_used_at) where active = true;

-- 확인
-- select type, status, count(*) from tb_notification_request group by type, status;

-- ============================================================
-- 롤백
-- ============================================================
-- drop table tb_device_token;
-- drop table tb_marketing_consent;
-- drop table tb_notification_setting;
-- drop table tb_notification_inbox;
-- drop table tb_notification_history;
-- drop table tb_notification_request;

-- 주의
-- - 시퀀스는 프로젝트 규칙(seq_<테이블>, allocation 50)에 맞춰 별도로 생성한다.
-- - result_code/error_message에 수신자 연락처 원문을 넣지 않는다.
-- - tb_marketing_consent는 보관 기간을 길게 잡는다. 동의를 증명하지 못하면 동의가 없는 것과 같다.
-- - tb_notification_history는 무한 증가한다. 보관 기간과 정리 배치를 함께 정의한다.
