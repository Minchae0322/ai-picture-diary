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
- 도메인 4개: `diary`(01~06) · `badge`(07) · `community`(08) · `profile`(09·10)

## 2. 도메인 어휘

| 용어 | 뜻 | 코드에서 |
|---|---|---|
| 일기 | 하루치 기록 1건. 본문 + AI 판정 + 그림 | `Diary` / `tb_diary` |
| 날씨 | 감정의 표현. 6종 고정 | `Weather` |
| 기분 점수 | -3 ~ +3 정수. 그래프의 Y축 | `Diary.moodScore` |
| 빠른 감정 칩 | 02 화면에서 사용자가 고르는 힌트. AI 판정을 대체하지 않는다 | `Diary.userHint` |
| 그리기 | 감정 분석 + 이미지 생성의 한 묶음 | `DiaryPainter.paint()` |
| 다시 그리기 | 같은 본문으로 재생성. 하루 상한 있음 | `Diary.requestRegenerate()` |
| 연속 기록 | 끊기지 않고 기록한 일수. 뱃지의 기준 | `StreakCalculator.count()` - 계산은 여기 한 곳뿐 |
| 뱃지 | 조건을 넘기면 서버가 주는 수집품. 정의는 데이터, 지표는 코드 | `tb_badge` / `BadgeMetric` / `tb_user_badge` |
| 공유 | 04 결과를 08 피드에 **복사**해 올린다 | `CommunityPost.share()` |
| 꾸미기 | 테마·캐릭터 선택. 일부는 Jelly Plus 전용 | `StoreItem` / `Profile.select()` |

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
│   ├── domain/                 # 엔티티만. 테이블 1:1
│   ├── type/                   # enum, 값 객체(정책·판정 입력). 상태 없는 타입
│   ├── event/                  # 도메인 이벤트 record
│   └── config/                 # @ConfigurationProperties (config-and-secrets 4장)
├── llm/                        # 기술 컨텍스트. 모델 연동은 전부 여기. 업무 도메인이 아니다
│   ├── config/                 # LlmProperties (app.llm.*)
│   └── painter/                # 그림 생성 계약 + 구현 (DiaryPainter/DiaryPainting/MockDiaryPainter)
└── common/                     # response, error, auth, logging, config, domain(BaseEntity)
    └── util/                   # 순수 계산. final + private 생성자 + static, 상태 없음
```

- **`domain/`에는 엔티티만 둔다.** 테이블이 아닌 것이 섞이면 "도메인 폴더"가 곧 쓰레기통이 된다.
  enum·값 객체 -> `type/`, 이벤트 -> `event/`, 순수 계산 -> `common/util/`, 모델 연동 -> `llm/`.
  ArchUnit 4번 규칙이 `..domain..`의 모든 클래스에 `@Entity`(또는 `@MappedSuperclass`)를 요구한다.
- **의존 방향 관점에서 `domain/type/event/util`은 전부 같은 "도메인 층"이다.**
  이 넷은 `controller`·`service`·`repository`·`config`와 스프링 웹을 모른다(ArchUnit 1·2번).
- 의존 방향: **`controller -> service -> repository -> domain`**
  (`api/src/test/java/com/jellydiary/ArchitectureTest.java`).
- **리포지토리는 `domain`이 아니라 `repository` 폴더에 둔다.** 도메인이 Spring Data를 모르게 하고, 조회 코드가 늘어날 자리를 미리 연다.
- `config`는 계층이 아니라 부속이다. service가 참조해도 계층 규칙 위반이 아니다.
- **순수 계산은 `common/util` 한 곳에 모은다.** 도메인 타입을 하나도 안 쓰는 계산에 도메인 폴더를 주면
  같은 계산이 도메인마다 복사된다. 이름은 하는 일로 짓고(`StreakCalculator`, `WordCounter`, `NicknameGenerator`),
  10개 메서드를 넘으면 쪼갠다. **단위 테스트 필수**(`ddd-spring` reference).
  도메인 타입을 인자로 받아야만 하는 계산이 생기면 그때 그 도메인 안으로 내린다.
- **모델 연동은 도메인이 아니라 `llm/` 컨텍스트에 전부 모은다.** 계약 인터페이스(`DiaryPainter`)와 구현체와
  설정이 한 폴더 트리에 있다. 도메인 서비스는 인터페이스만 주입받고 LLM 타입은 모른다.
  (`ddd-spring`·`llm-integration`은 포트를 도메인에 두고 구현만 `infrastructure/ai`로 빼라고 말하지만
  **이 파일이 이긴다** - 모델 관련을 한자리에서 보는 쪽을 택했다.)
  - 계약에 들어가도 되는 것은 **도메인 어휘**(`Weather`, 점수, 코멘트, 그림 URL)뿐이다. LLM 타입이 계약에
    새면 도메인이 모델에 끌려간다. 이건 기계가 아니라 **리뷰가 막는다**.
  - 프롬프트는 자바 문자열이 아니라 `api/src/main/resources/prompts/<기능>-v<n>.st`.
- **`llm`과 `common`은 업무 도메인이 아니라 기술 컨텍스트**라 ArchUnit 3번(도메인 간 참조 금지)에서 빠진다.
  `llm`은 계약에 도메인 어휘를 담아야 해서 **반대 방향도** 허용된다. 대신 11번이
  `llm -> controller/service/repository`를 막는다 - 기술 컨텍스트가 업무 흐름을 되부르면 안 된다.
  새 기술 컨텍스트를 만들면 3번의 예외 목록에 추가한다 - 안 그러면 도메인 간 참조로 잡힌다.
- 새 도메인도 같은 모양으로 만든다. 필요 없는 폴더는 만들지 않는다(badge에는 `event/`가 없다).
- 도메인 간 직접 참조 금지. 필요하면 **`service`에서 조합하거나 이벤트로.** ArchUnit 3번이 `service` 밖의 교차 참조를 막는다.

### 예외를 던지는 자리 (api-design 3장)

- **사용자에게 돌려줄 거절은 도메인이 `BusinessException(ErrorCode.XXX)`로 직접 던진다.**
  서비스가 `IllegalArgumentException`을 잡아 `BusinessException`으로 번역하는 계층을 만들지 않는다 -
  같은 규칙이 어느 코드로 나가는지가 두 곳에 흩어지고, 서로 다른 사유가 한 코드로 뭉개진다.
- **사용자가 만들 수 없는 상황은 시스템 예외**(`IllegalArgumentException`/`IllegalStateException`)로 둔다.
  어댑터 계약 위반(AI가 범위 밖 점수를 줌), 설정값 오류, 서비스가 이미 막은 도달 불가 방어선이 여기 해당한다.
- 예외 -> HTTP 상태 변환은 `common/error/GlobalExceptionHandler` 한 곳.
- 거절 사유가 둘이면 `ErrorCode`도 둘이다. 사용자가 읽는 문구가 달라야 하기 때문이다.
- 테스트는 예외 타입이 아니라 **`ErrorCode`까지** 단언한다. 타입만 보면 코드 뭉개기를 놓친다.

### 계층별 책임

규칙은 `ddd-spring` **6-1. 계층별 책임**에 있다. 여기는 이 저장소의 배선만 적는다.

| 규칙 | 이 프로젝트에서 |
|---|---|
| 인증을 컨트롤러가 확인하지 않는다 | `@LoginUser Long userId` + `common/auth/LoginUserArgumentResolver` (401 판단 한 곳) |
| 엔티티는 service 밖으로 나가지 않는다 | `<도메인>/service/result/<Xxx>Result` record -> `XxxResponse.from(result)` |
| 파생 판단은 근거를 아는 계층이 | `canRegenerate`는 상한(`app.diary.daily-regenerate-limit`)을 아는 `DiaryQueryService`가 계산 |
| 업무 상한은 설정에서 | `app.<도메인>.*` -> `XxxPolicy` 값 객체(`type/`) -> 도메인 메서드 인자 |
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
- **앱 UI에 이모지 넣기.** 아이콘은 `app/src/shared/ui/Icon.tsx`의 SVG로 (`expo-app-conventions` 8장)
- **산출물 문서에 이모지 넣기.** 시안이 이모지를 써도 문서에는 말로 적는다 (`deliverable-write` 30행)
  - 둘 다 커밋 훅이 막는다(`.githooks/no-emoji.js`)
- 08 커뮤니티에 신고·차단 없이 배포 (스토어 심사 항목)

## 6. 다음에 읽을 범용 스킬

**이 저장소에 해당 없는 행은 지운다.** 표가 짧을수록 잘 걸린다.
여러 개가 걸리면 전부 읽는다. 범용 스킬과 이 파일이 충돌하면 **이 파일이 우선**이다.

| 작업 | 스킬 |
|---|---|
| 새 도메인/기능, 패키지 배치, 엔티티/서비스 책임 | `ddd-spring` |
| 엔드포인트 추가/수정, 응답 포맷, 에러 코드, 페이징 | `api-design` |
| 피드 정렬·추천·개인화, "인기" 기준 | `feed-ranking` |
| 유사도 계산, 중복 검출, 오타 허용 검색 | `similarity-search` |
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

- **시안 10화면이 전부 구현됨** (2026-09-22). 도메인 4개: `diary`, `badge`, `community`, `profile`.
- **백엔드 빌드·테스트 여전히 미검증.** 이 환경에 JDK 11만 있고 Gradle도 wrapper도 없어 `compileJava`/`test`를 한 번도 돌리지 못했다. 컴파일 오류가 남아 있을 수 있다. 앱은 `npx tsc --noEmit` 통과.
- Gradle wrapper 없음: `cd api && gradle wrapper` 최초 1회 필요. 하네스 hook도 wrapper가 생겨야 동작한다.
- 통합 테스트(`DiaryRepositoryTest`)는 Docker가 있어야 돈다: `./gradlew integrationTest`.
- 인증 없음(`X-User-Id` 임시). 붙는 순간 `common/auth/CurrentUser*`는 삭제 대상이고, `ProfileService`의 첫 조회 자동 생성도 회원가입으로 옮긴다.
- **배포를 막는 것**: 커뮤니티 신고 처리 도구·차단 없음, 계정 삭제 없음, 구독 복원 동선 없음 (`app-store-release`).
- 댓글·구독 결제 도메인 없음. 뱃지 `FIRST_COMMENT`·`PREMIUM`은 그래서 영구 잠김이다.
- 뱃지는 시안 12종만 정의됐다(시안이 말한 40종 중). "자주 쓴 말"은 형태소 분석기가 아니라 공백 토크나이저다.
- 정적 분석은 Spotless만. Error Prone은 아직(harness 4층 도입 순서 5단계).
- **Figma MCP는 무료 플랜 호출 한도가 있다.** 시안을 다시 읽어야 하면 한도를 먼저 확인한다.


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
