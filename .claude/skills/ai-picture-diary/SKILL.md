---
name: ai-picture-diary
description: "이 저장소에서 코드·스키마·문서를 쓰거나 고치기 전에 **항상 맨 먼저** 읽는다. 제품이 무엇인지, 도메인 어휘와 불변 규칙, 이미 정해진 것(확정 사항), 절대 하지 말 것, 그리고 작업 종류별로 이어서 읽을 범용 스킬을 지정한다. 범용 스킬과 충돌하면 이 파일이 이긴다. '그림일기', '일기', '감정', '날씨', 'diary', 'picture-diary' 언급 시 트리거."
---

# AI 그림일기 (프로젝트 스킬)

> 이 파일은 **이 제품에만** 해당한다. 다른 프로젝트에 복사해서 쓰는 규칙은 전부 범용 스킬 쪽에 있다.
> 여기에 범용 규칙을 쓰지 않는다. 여기 쓴 내용이 다른 프로젝트에서도 맞다면 그건 범용 스킬로 옮길 신호다.

## 1. 제품이 무엇인가

하루에 한 줄을 쓰면 AI가 그 문장의 감정을 읽어 **날씨로 판정하고 그림으로 그려 주는** 모바일 일기 앱. 쌓인 날씨는 캘린더와 그래프가 되고, 연속 기록은 젤리 뱃지가 된다. 핵심 화면은 홈이다 - 빈 그림 자리 하나와 "오늘 어땠나요?" 입력창 하나, 그 아래 최근 3일의 날씨.

- 저장소 구성: 모노레포. `api/`(Spring Boot 백엔드) + `app/`(Expo 모바일)
- 시안: Figma `AI 감정 날씨일기 - Web App Sketch`, 10화면. 인덱스는 9장

## 2. 도메인 어휘

| 용어 | 뜻 | 코드에서 |
|---|---|---|
| 일기 | 하루치 기록 1건. 본문 + AI 판정 + 그림 | `Diary` / `tb_diary` |
| 날씨 | 감정의 표현. 6종 고정 | `Weather` |
| 기분 점수 | -3 ~ +3 정수. 그래프의 Y축 | `Diary.moodScore` |
| 빠른 감정 칩 | 02 화면에서 사용자가 고르는 힌트. AI 판정을 대체하지 않는다 | `Diary.userHint` |
| 그리기 | 감정 분석 + 이미지 생성의 한 묶음 | `DiaryPainter.paint()` |
| 다시 그리기 | 같은 본문으로 재생성. 하루 상한 있음 | `Diary.requestRegenerate()` |
| 연속 기록 | 끊기지 않고 기록한 일수. 뱃지의 기준 | (미구현) |

## 3. 불변 규칙 (이 제품의 비즈니스 규칙)

범용 스킬이 판단을 요구하는 지점들의 **이 제품에서의 답**이다. 다시 묻지 않는다.

- **일기는 사용자 x 날짜로 1건.** DB 부분 unique로 강제한다. 하루 여러 건은 없다.
- **"오늘"의 기준은 Asia/Seoul 자정.** 서버가 판단하고 클라이언트는 따르지 않는다.
- **날씨는 6종 고정**: `SUNNY` `PARTLY_CLOUDY` `CLOUDY` `RAIN` `SNOW` `RAINBOW`. 07 뱃지의 "감정 6종 전부"가 이 목록이다. 늘리려면 뱃지 조건도 같이 본다.
- **기분 점수는 -3 ~ +3 정수.** 04 표시, 06 그래프 축, DB check 제약이 같은 범위다.
- **본문은 1~500자.** 초과는 400 `COMMON_INVALID_REQUEST`.
- **위 수치(500자, 3회, -3~+3)의 출처는 설정 한 곳**(`app.diary.*`)이다. 도메인에는 `DiaryPolicy`로 넘어가며 코드에 상수로 박지 않는다(`config-and-secrets` 4-1장). 예외는 DB 컬럼 길이 `Diary.CONTENT_COLUMN_LENGTH`(스키마 상수, DDL과 같은 값).
- **그림 생성만 실패하면 일기는 `DONE`이다**(`imageUrl`이 null). 텍스트 결과만으로 04 화면을 보여준다. `FAILED`는 감정 분석까지 실패했을 때뿐이다.
- **AI 생성은 트랜잭션 밖, 커밋 후 비동기.** 자동 재시도는 하지 않는다 - 호출마다 비용이 든다.
- **다시 그리기는 하루 3회**(`app.diary.daily-regenerate-limit`). 상한 판단은 도메인(`Diary`)이 한다.
- **"AI generated" 표기는 04 화면에서 제거하지 않는다.**
- 연속 기록 일수는 **서버가 한 곳에서 계산**한다. 02·06·10이 같은 값을 쓴다.

## 4. 확정 사항 (이미 정한 것 - 재논의 대상 아님)

| 항목 | 값 | 정한 이유 / 근거 |
|---|---|---|
| 저장소 | 모노레포 `api/` + `app/` | 한 사람이 양쪽을 동시에 고치는 단계 |
| 백엔드 | Spring Boot 3.5 / Java 21 / PostgreSQL | 백엔드 스킬 14개가 이 기준 |
| 앱 | Expo SDK 56 / React Native / TypeScript / expo-router | 시안이 390x844 모바일 |
| 서버 상태 | TanStack Query v5 | `frontend-state` 기본값 |
| 응답 형식 | 봉투 `{data, meta}` + `ErrorCode` enum | `api-design` 3장 |
| 목록 | 커서 페이징 (커서 = entryDate Base64) | 하루 1건이라 정렬 키가 유일 |
| 디자인 | 모바일 우선 + soft-modern, 브랜드 `#6c5ce7` | `CLAUDE.md` 선언 |
| AI | 현재 `MockDiaryPainter`(규칙 기반). `app.ai.provider`로 교체 | 실모델은 다음 라운드 |
| 인증 | **없음.** `X-User-Id` 헤더 임시 | 핵심 루프 먼저. `spring-auth`는 다음 |

바꾸려면 ADR을 먼저 쓴다.

## 4-1. 패키지 구조 (ddd-spring 기본형을 이 프로젝트 이름으로 고정)

도메인이 먼저, 그 안에 계층. 계층 이름은 `ddd-spring`의 `interfaces`/`application` 대신 **`controller`/`service`**를 쓴다
(같은 문서가 "계층 이름이 달라도 역할이 대응되면 그대로 두고 의존 방향 규칙만 적용"으로 허용한다. 프로젝트 스킬이 이긴다).

```
com.jellydiary
├── diary/                      # 도메인(바운디드 컨텍스트)
│   ├── controller/             # @RestController, dto/ (XxxRequest/XxxResponse + static 이너 record)
│   │   └── dto/
│   ├── service/                # 유스케이스, @Transactional, 이벤트 리스너, result/
│   │   └── result/
│   ├── repository/             # Spring Data 인터페이스, QueryDSL 조회
│   ├── domain/                 # 엔티티, enum, 포트(DiaryPainter), 이벤트 record
│   ├── infrastructure/         # 포트 구현(ai/), 외부 연동
│   └── config/                 # @ConfigurationProperties (config-and-secrets 4장)
└── common/                     # response, error, auth, logging, config, domain(BaseEntity)
```

- 의존 방향: **`controller -> service -> repository -> domain`**, `infrastructure -> domain`. ArchUnit이 강제한다
  (`api/src/test/java/com/jellydiary/ArchitectureTest.java`).
- **리포지토리는 `domain`이 아니라 `repository` 폴더에 둔다.** 도메인이 Spring Data를 모르게 하고, 조회 코드가 늘어날 자리를 미리 연다.
- `config`는 계층이 아니라 부속이다. service가 참조해도 계층 규칙 위반이 아니다.
- 새 도메인(badge, community...)도 같은 6개 폴더로 만든다. 계층 우선 최상위 폴더(`controller/diary`)는 금지.
- 도메인 간 직접 참조 금지. 필요하면 `service`에서 조합하거나 이벤트로.

### 계층별 책임

규칙은 `ddd-spring` **6-1. 계층별 책임**에 있다. 여기는 이 저장소의 배선만 적는다.

| 규칙 | 이 프로젝트에서 |
|---|---|
| 인증을 컨트롤러가 확인하지 않는다 | `@LoginUser Long userId` + `common/auth/LoginUserArgumentResolver` (401 판단 한 곳) |
| 엔티티는 service 밖으로 나가지 않는다 | `diary/service/result/<Xxx>Result` record -> `DiaryResponse.Detail.from(result)` |
| 파생 판단은 근거를 아는 계층이 | `canRegenerate`는 상한(`app.diary.daily-regenerate-limit`)을 아는 `DiaryQueryService`가 계산 |
| 로그는 헬퍼로 | `common/logging/AppLog` (`logging-observability`) |
| 포맷 | Spotless `googleJavaFormat().aosp()` = 4칸. 커밋 훅이 `spotlessApply` |

## 4-2. 기능 구현의 완료 정의 (Definition of Done)

코드가 돌아가는 것은 절반이다. **아래를 다 하기 전에는 "구현했다"고 말하지 않는다.**

| # | 할 것 | 근거 스킬 |
|---|---|---|
| 1 | 코드 + 경계값 테스트 | `test-writing-guide` |
| 2 | `./gradlew test` 통과 (앱은 `npx tsc --noEmit`) | `harness` |
| 3 | 스키마를 건드렸으면 `sql/patch/*.sql` + `docs/db/YYYY-MM-DD-*.md` | `db-schema-and-migration` |
| 4 | 엔드포인트가 생겼거나 바뀌었으면 `docs/api/*-API-명세.md` | `api-design` 9장 |
| 5 | **도메인 현행 문서 작성·갱신** `docs/domain/<도메인>/<로직>-비즈니스로직.md` | `deliverable-write` |
| 6 | **`docs/BOARD.md` 구현 현황 표 + 갱신 이력** | `deliverable-structure` |
| 7 | **`docs/INDEX.md`에 문서 <-> 코드 경로 등록** (신규 문서일 때) | `deliverable-structure` |
| 8 | `CHANGELOG.md` Unreleased에 한 줄 | Keep a Changelog |
| 8-1 | **기능 문서** `docs/feature/<기능>.md` 신규 또는 갱신(비개발자 언어로: 사용자가 하는 일, 규칙, 예외 화면, 한계) + `docs/README.md` 기능 표에 한 줄. README에 설명을 쌓지 않는다 | `deliverable-structure` |
| 9 | 화면을 건드렸으면 `docs/screen/NN-*.md`의 7장(미정)에서 확정된 항목 제거 + 8장(구현) 갱신 | `screens/README.md` |

- 5~8은 **같은 커밋**에 넣는다. 문서만 나중에 몰아서 쓰면 반드시 어긋난다.
- 문서 갱신이 불필요한 변경(내부 리팩터링, 오타)이면 그렇다고 한 줄 말한다. 조용히 건너뛰지 않는다.
- 갱신 대상을 찾을 때는 `docs/INDEX.md`의 코드 경로 글롭과 변경 파일을 대조한다(`deliverable-sync` 방식).
- 순서: 코드 -> 테스트 -> 5 -> 6 -> 7 -> 8. 문서가 먼저 낡는 것을 막으려면 마지막이 아니라 **작업 종료 직전**에 한 번에.

## 5. 절대 하지 말 것

- 어떤 환경이든 DB 접속·SQL 실행. 스키마 변경은 `sql/patch/` + `docs/db/` 문서로만
- 커밋에 시크릿 - `.env`, `*.jks`, `*.p8`, 서비스 계정 JSON
- `EXPO_PUBLIC_*`에 비밀값 넣기 (번들에 평문으로 박힌다)
- 상한 없이 AI 호출 붙이기 (호출 수·토큰·재생성 횟수)
- 프롬프트를 자바 문자열로 박기 - `resources/prompts/<기능>-v<n>.st`
- 04 화면의 "AI generated" 표기 제거
- 08 커뮤니티에 신고·차단 없이 배포 (스토어 심사 항목)

## 6. 다음에 읽을 범용 스킬

**이 저장소에 해당 없는 행은 지운다.** 표가 짧을수록 잘 걸린다.
여러 개가 걸리면 전부 읽는다. 범용 스킬과 이 파일이 충돌하면 **이 파일이 우선**이다.

| 작업 | 스킬 |
|---|---|
| 새 도메인/기능, 패키지 배치, 엔티티/서비스 책임 | `ddd-spring` |
| 엔드포인트 추가/수정, 응답 포맷, 에러 코드, 페이징 | `api-design` |
| 로그인, 토큰, 소셜 로그인, 401/403 | `spring-auth` |
| 테이블/컬럼/인덱스 추가·변경, 마이그레이션 SQL | `db-schema-and-migration` |
| 트랜잭션 경계, 락, 동시성, 재시도, 중복 요청 | `transaction-and-concurrency` |
| 쿼리 느림, N+1, 대량 처리, 인덱스 | `jpa-query-optimization` |
| 외부 API 호출, 타임아웃, 서킷 브레이커 | `external-api-client` |
| 스케줄러/배치, cron, 재처리 | `batch-and-scheduler` |
| 파일/이미지 업로드, 스토리지, 썸네일 | `file-upload-storage` |
| 푸시·이메일·SMS 발송, 수신 동의 | `notification` |
| yml/환경변수/시크릿/프로파일 | `config-and-secrets` |
| 로그, traceId/MDC, 모니터링 | `logging-observability` |
| 테스트 작성/수정 | `test-writing-guide` |
| 리뷰 요청, PR 코멘트 | `spring-code-review` |
| 장애 추적, 장애 보고서 | `rca-procedure` |
| LLM 호출, 토큰 상한, 프롬프트 파일 | `llm-integration` |
| 프롬프트 수정, 모델 교체, AI 품질 판단 | `prompt-and-eval` |
| 문서 기반 답변, 임베딩, 벡터 검색 | `rag-pipeline` |
| 화면/컴포넌트, 여백·라운드·색, 반응형 | `ui-fundamentals` |
| 디자인 토큰, 테마, 다크 모드 | `design-system` |
| 컴포넌트/훅/타입, 프론트 폴더 구조 | `frontend-architecture` |
| 상태 위치, 스토어, 서버 데이터 캐시/무효화 | `frontend-state` |
| 프론트 API 호출, 토큰 갱신, 에러 처리 | `frontend-api-client` |
| Figma 시안 구현, Figma에 그리기 | `figma-workflow` |
| 화면 문서 작성/갱신 | `screens/README.md` (이 폴더) |
| 특정 화면 구현/수정 | `screens/NN-<슬러그>.md` + `docs/screen/NN-<슬러그>.md` |
| React Native / Expo 코드 | `expo-app-conventions` (+ 해당 `frontend-*`) |
| CI/CD, Dockerfile, 배포·롤백 | `deploy-pipeline` |
| 앱 스토어 등록, 심사 리젝 | `app-store-release` |
| 검증 하네스(ArchUnit, hook, 정적 분석) | `harness` |
| `docs/` 구조, 문서 위치 판단 | `deliverable-structure` |
| 도메인 비즈니스 로직 문서 작성 | `deliverable-write` |
| "산출물 업데이트", "문서 동기화" | `deliverable-sync` |
| 이슈/특이사항/주간보고 정리, 개조식으로 다듬기 | `report-style` |

## 7. 규칙과 판단

범용 스킬도 이 파일도 기본값이지 사고 정지가 아니다. 규칙대로 하되 이 상황에서 더 나은 방법이 보이면 **먼저 제안한다**: 무엇을 어떻게 다르게 할지, 왜 더 나은지, 규칙이 막으려던 문제는 어떻게 지키는지. 승인되면 그렇게 하고, 반복되면 규칙 자체를 고치자고 한다. 말없이 어기거나, 명백히 안 맞는데 기계적으로 따르는 것 둘 다 금지.

## 8. 지금 상태 / 아직 안 된 것

- **핵심 루프(02→03→04)만 구현됨.** 나머지 7화면은 문서와 자리표시자뿐이다.
- **빌드·테스트 미검증.** 이 환경에 JDK 21도 Gradle도 없어 `compileJava`/`test`를 한 번도 돌리지 못했다. 컴파일 오류가 남아 있을 수 있다.
- Gradle wrapper 없음: `cd api && gradle wrapper` 최초 1회 필요. 하네스 hook도 wrapper가 생겨야 동작한다.
- 통합 테스트(`DiaryRepositoryTest`)는 Docker가 있어야 돈다: `./gradlew integrationTest`.
- 인증 없음(`X-User-Id` 임시). 붙는 순간 `common/auth/CurrentUser*`는 삭제 대상.
- 연속 기록·뱃지·캘린더 집계·커뮤니티 도메인 없음.
- 정적 분석은 Spotless만. Error Prone은 아직(harness 4층 도입 순서 5단계).


## 9. 화면

시안 10개, 모바일 390x844. 전체 목록·탐색 구조·공통 규칙은 `docs/screen/README.md`.
화면 문서를 새로 쓰거나 갱신할 때는 `screens/README.md`(이 폴더)를 먼저 읽는다.

| # | 화면 | 규칙 | 명세 |
|---|---|---|---|
| 01 | 온보딩 | `screens/01-onboarding.md` | `docs/screen/01-onboarding.md` |
| 02 | 홈 (기록 전) | `screens/02-home.md` | `docs/screen/02-home.md` |
| 03 | AI 생성 중 | `screens/03-generating.md` | `docs/screen/03-generating.md` |
| 04 | 결과 (AI 이미지) | `screens/04-result.md` | `docs/screen/04-result.md` |
| 05 | 감정 캘린더 | `screens/05-calendar.md` | `docs/screen/05-calendar.md` |
| 06 | 감정 그래프 | `screens/06-graph.md` | `docs/screen/06-graph.md` |
| 07 | 뱃지 컬렉션 | `screens/07-badge.md` | `docs/screen/07-badge.md` |
| 08 | 커뮤니티 | `screens/08-community.md` | `docs/screen/08-community.md` |
| 09 | 테마·캐릭터 상점 | `screens/09-store.md` | `docs/screen/09-store.md` |
| 10 | 마이페이지 | `screens/10-mypage.md` | `docs/screen/10-mypage.md` |

화면 작업 전 해당 행의 두 파일을 읽는다. 규칙 파일이 없으면 명세만 읽는다.
