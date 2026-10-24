# 산출물 진행 보드

CHANGELOG.md는 코드 변경 기록, 이 보드는 **현행 문서 동기화 상태**와 무엇이 구현됐는지를 다룬다.

## 동기화 상태
- last_synced_commit: 52f12ad + 미커밋(손그림 UI, 게스트 모드, 02 재구성)
- last_synced_at: 2026-10-20
- synced_by: Claude

## 구현 현황 (화면 기준)

| # | 화면 | 앱 | 서버 | 비고 |
|---|---|---|---|---|
| 01 | 온보딩 | 구현 | 해당 없음 | 보조 링크가 11 로그인으로 간다 |
| 02 | 홈 (기록 전) | 구현 | 구현 | 두 단계(기분 **필수** -> 공책 200자). 연속 배지·닉네임. 세기 게이지는 **값을 서버로 안 보냄** |
| 03 | AI 생성 중 | 구현 | 구현 | AI는 규칙 기반 대역(MockDiaryPainter) |
| 04 | 결과 | 구현 | 구현 | 공유·뱃지 카드. 판정 줄이 감정 캐릭터 + 라벨 |
| 05 | 감정 캘린더 | 구현 | 구현 | 새 테이블 없이 tb_diary 집계. 셀이 감정 캐릭터, 월 요약은 상위 4칸만 |
| 06 | 감정 그래프 | 구현 | 구현 | 자주 쓴 말은 순진한 토크나이저 |
| 07 | 뱃지 컬렉션 | 구현 | 구현 | 정의는 `tb_badge` 마스터. 12/40종만 seed. 댓글·구독 뱃지는 잠김 |
| 08 | 커뮤니티 | 구현 | 구현 | 정렬 추천/최신/인기. 감정 필터는 2종만 열려 있음. **신고 처리 도구·차단 없음 - 배포 전 필수** |
| 09 | 테마 상점 | 구현 | 구현 | 결제·복원 없음. Plus 항목은 아무도 못 씀 |
| 10 | 마이페이지 | 구현 | 구현 | **계정 삭제 없음 - 스토어 필수**. 설정 4행은 준비 중 안내 |
| 11 | 로그인 | 구현 | **없음** | 시안에 없는 화면. 버튼을 눌러도 홈으로 간다 - 인증이 없다 |
| - | 게스트 모드 | 구현 | 구현 | 기기 1대 = 사용자 1명. 07·08·09·10 은 로그인 시트. **SQL 미실행이라 아직 못 돈다** |

## 검증 안 된 것

- 앱을 **실행해 보지 않았다.** `npx tsc --noEmit` 과 `./gradlew test`(74건)는 통과했지만
  SUIT 등록(`useFonts`), `@assets` 별칭의 metro 해석, 감정 PNG 9장의 실제 렌더는 런타임에서만 확인된다
- 감정 전환 뒤의 **화면을 눈으로 보지 않았다.** 특히 캐릭터 배율(`EMOTION_SCALE`)이 상자를 넘치는지,
  05 캘린더 셀(32px 안에 26px 캐릭터)과 02 칩(36px 안에 22px)에서 잘리지 않는지
- `sql/patch/2026-10-05-날씨-감정-전환.sql` 은 **문법만 MySQL 로 맞췄고 실행해 보지 않았다**
- 2026-10-20 의 02 재구성(기분 필수·공책·200자·재배치)은 **프로토타입을 390x844 로 헤드리스 렌더해
  빈 상태·쓴 상태를 눈으로 확인했다.** 아직 **앱으로는** 보지 않았다 - 공책 괘선과 글줄이 실제로
  맞물리는지(`NotePaper` 의 28px)는 기기에서만 확인된다. iOS `TextInput` 의 기본 내부 여백이
  첫 줄을 한 칸 밀어낼 수 있다

## 미분류 변경 (사람 판단 필요)
없음.

## 갱신 이력 (최근 10건만 유지)
| 일시 | 갱신 문서 | 커밋 범위 |
|---|---|---|
| 2026-10-20 | 02 재배치(세로 예산 680): `screen/02-home.md` 11장, 프로젝트 스킬 02 규칙, `CHANGELOG.md` · 코드: `DiaryComposer`(누운 그림 자리·간격 16), `Screen`(키보드 3종), `prototype.html` | (미커밋) |
| 2026-10-20 | 신규: `adr/2026-10-20-기분-선택-필수와-본문-200자.md` · 갱신: `screen/02-home.md`(3·4·6·11장), `api/2026-09-21-일기-API-명세.md`, `domain/diary/일기생성-비즈니스로직.md`, `feature/오늘-한줄-기록.md`, `design/components.html`, `INDEX.md`, `CHANGELOG.md`, 프로젝트 스킬 1·2·3장과 02 규칙, `hand-drawn-ui` 5장 · 신규 코드: `NotePaper`, `Icon(check)` · 갱신 코드: `DiaryComposer`, `Diary`, `ErrorCode`, `DiaryRequest`, `application.yml`, `prototype.html` | (미커밋) |
| 2026-10-20 | 신규: `adr/2026-10-20-로그인-없이-쓰는-게스트-모드.md`, `db/2026-10-20-게스트-기기-테이블.md`, `domain/account/게스트계정-비즈니스로직.md`, `feature/로그인-없이-쓰기.md`, `db/2026-10-20-프로필-게스트-권한.md` · 갱신: `api/` 2건, `domain/profile/`, `screen/07`·`08`·`09`·`10`·`11`, `README.md`, `INDEX.md`, `app/INSTALL.md`, 프로젝트 스킬 4장 · 코드: `account` 도메인, 게스트 상한, 커뮤니티 로그인 벽, 앱 `features/auth` | (미커밋) |
| 2026-10-20 | 갱신: `screen/03-generating.md`(3·4·5·7·8장), 프로젝트 스킬 03 규칙, `hand-drawn-ui` 5장, `design/components.html`, `INDEX.md`, `feature/오늘-한줄-기록.md`, `CHANGELOG.md` · 신규 코드: `DrawingBoard`, `SketchLine` · 갱신 코드: `GeneratingCard`(접기·경과 안내), `useDiary`(폴링 상한) | (미커밋) |
| 2026-10-20 | 갱신: `app/INSTALL.md`(Skia 설치와 버전 함정), `screen/04-result.md`, `CHANGELOG.md` · 코드: `StrokeCanvas`(Skia), `penTools.ts`, `babel.config.js` | (미커밋) |
| 2026-10-20 | 갱신: `screen/04-result.md`(덧그리기 + 저장 미정), `CHANGELOG.md` · 코드: `DiaryDrawModal`(도구 5종), 배경 토큰 재조정 | (미커밋) |
| 2026-10-20 | 갱신: `CLAUDE.md` 배경 선언(바닐라 -> 종이), `screen/README.md`(면과 경계), `CHANGELOG.md` · 코드: `PaperGrain`, 칩·설정목록·세그먼트·뱃지·상점·입력창·썸네일 손그림화 | (미커밋) |
| 2026-10-20 | 갱신: `hand-drawn-ui` 스킬 5장(구현/설계 분리), `design/components.html`(구현 현황), `CHANGELOG.md` · 신규 코드: `sketch.ts`, `SketchShape`, `SketchButton`, `SketchBadge`, `Tape`, `/sketch-gallery` | (미커밋) |
| 2026-10-20 | 신규: 스킬 `hand-drawn-ui`(SKILL·components·reference), `design/components.html` · 갱신: `CLAUDE.md` 디자인 선언, 프로젝트 스킬 4장, `INDEX.md`, `docs/README.md` (손그림 체계 도입) | (미커밋) |
| 2026-10-20 | 갱신: `screen/README.md`(버튼·면과 경계·탭바·칩/세그먼트), `screen/02`·`04`, `CHANGELOG.md` (버튼 줄바꿈·카드 대비·인사말 줄나눔·탭 선택 대비·칩 키) | (미커밋) |
| 2026-10-19 | 갱신: `screen/README.md`(빈 화면 규칙), `screen/01`·`07`·`09`·`11`, `CHANGELOG.md` (앱 디자인 - 빈 화면 캐릭터·프로필 아바타·뱃지/상점 정리, 한글 깨짐·상점 500 수정) | (미커밋) |
| 2026-10-19 | 신규: `시스템구성도.drawio`(+png/pdf, 2페이지) · 삭제: 스킬 `architecture-diagram`(훅 3층은 구성도 파일을 직접 가리키게 고침) · `INDEX.md` 등록 | (미커밋) |
| 2026-10-19 | 신규: `db/2026-10-05-날씨-감정-전환.md`, `screen/11-login.md` · 갱신: `domain/` 4건, `api/` 2건, `screen/` 7건, `feature/` 5건, `README.md`, `INDEX.md`, 프로젝트 스킬 1·2·3·4·8·9장 (날씨 6종 -> 감정 9종) | `ca1d5d2..cf388ce` |
| 2026-10-14 | 신규: `adr/2026-10-14-DB를-MySQL로.md` · 갱신: `db/` 4건, `guide/`, `domain/badge/`, `README.md`, 프로젝트 스킬 3·4·8장 (DB PostgreSQL -> MySQL 8.0) | (미커밋) |
| 2026-09-22 | 갱신: 추천 다양성(상위 10 중 2) - `domain/community/`, `screen/08`, API 명세 | (미커밋) |
| 2026-09-22 | 신규: 스킬 `feed-ranking`·`similarity-search`, `db/2026-09-22-커뮤니티-추천정렬` · 갱신: `domain/community/`, `screen/08`, API 명세 | (미커밋) |
| 2026-09-22 | 신규: `db/2026-09-22-badge-마스터-테이블.md` · 갱신: `domain/badge/`, `screen/07`, `feature/뱃지-컬렉션`, API 명세 | (미커밋) |
| 2026-09-22 | 갱신: 패키지 구조(domain=엔티티만) · util/llm 공통화 · 이모지 제거 - 프로젝트 스킬 4-1·5장, `expo-app-conventions`, `harness`, ArchUnit, `.githooks/no-emoji.js` | (미커밋) |
| 2026-09-22 | 갱신: 도메인 예외를 `BusinessException`으로 통일 - `api/2026-09-21-*`, `domain/diary/`, `domain/profile/`, `guide/` | (미커밋) |
| 2026-09-22 | 갱신: 프로필 기본값을 `app.profile.*`로 이전 - `domain/profile/`, API 명세, `feature/프로필과-꾸미기.md` | (미커밋) |
| 2026-09-22 | 신규: `api/2026-09-22-화면05-10-API-명세.md`, `db/2026-09-22-badge-community-profile-테이블-추가.md` | (미커밋) |

| 2026-10-25 | 갱신: 바탕에서 전면 모눈 제거(세 겹) - `paper-background`, `Screen`·`PaperGrain`, 토큰(`grid`/`gridOpacity` 삭제), `screen/README`, `screen/01`, `design/components.html`, `screen/prototype.html`, `hand-drawn-ui`, `CLAUDE.md` · 삭제: `app/src/shared/ui/PaperGrid.tsx` · 적용: 11 로그인·견본 화면에도 `Backdrop` | (미커밋) |
| 2026-10-24 | 신규: 스킬 `paper-background` · 갱신: `screen/README`(바탕 겹), `design/components.html`, `screen/prototype.html`, `hand-drawn-ui`, `CLAUDE.md`, 토큰(`grainOpacity`) | (미커밋) |

| 2026-10-24 | 신규: ADR `로컬-DB-실행-허용`·`바탕을-연노랑-종이로` · 갱신: `docs/db/` 7개 실행 기록, 바탕 토큰(`paper`/`paperDeep`/`glow`), `GuestDevice`, `DiaryQueryService`·`DiaryRepository`, `CLAUDE.md`, 프로젝트 스킬 | (미커밋) |

| 2026-10-25 | 신규: `DiarySheet`·`StylePreview`, `DELETE /api/v1/diaries/{id}`, 손글씨 서체 · 갱신: `screen/02`, `api/일기-API-명세`, ADR `2026-10-20-기분-선택-필수`, `INDEX`, 프로젝트 스킬 · 삭제: `EmotionGauge.tsx` | (미커밋) |

## 할 일

### 막는 것 (배포 전 필수)
- [x] ~~`sql/patch/*.sql` **7개** 순서대로 실행 + 각 `docs/db/` 실행 기록 채우기~~ **2026-10-24 완료 (local)**
- [x] ~~MySQL 8.0 에서 DDL 실행 + `ddl-auto: validate` 기동 확인~~ **2026-10-24 완료.**
      Docker `mysql:8.0` 컨테이너(3307). 로컬 Homebrew MySQL(3306)은 건드리지 않았다.
      **이 과정에서 버그 둘이 나왔다** - `GuestDevice.deviceHash` 의 char/varchar 불일치(기동 실패),
      커서 페이징 첫 장의 `LocalDate.MAX`(MySQL DATE 상한 초과). 둘 다 고쳤다(CHANGELOG)
- [ ] **dev/prod 에 패치 7개 실행 (사람이).** local 만 끝났다. 운영·스테이징은 AI 가 하지 않는다
      (ADR `docs/adr/2026-10-24-로컬-DB-실행-허용.md`)
- [ ] 08 신고 처리 도구와 차단 (`app-store-release`)
- [ ] 10 계정 삭제 (두 스토어 필수) - 인증 도입과 함께
- [ ] 09 구독 복원(Restore) 동선 - iOS 심사 필수

### 그다음
- [ ] **시스템 구성도에 `account` 기술 컨텍스트와 기기 등록 흐름 추가.** 게스트 모드(ADR 2026-10-20)로
  `com.jellydiary.account` 와 `POST /api/v1/guest/devices` 가 생겼는데 `docs/시스템구성도.drawio` 에는
  상자도 화살표도 없다. 2026-10-20 의 02 재구성과는 무관한, 그 전부터 비어 있던 자리다
- [ ] 인증 도입 (`spring-auth`). `X-User-Id` 임시 헤더 제거, `common/auth/CurrentUser*` 삭제, 프로필 자동 생성을 회원가입으로 이전
- [ ] 실제 LLM 구현체 (`llm-integration`, `prompt-and-eval`). 10의 "AI 그림 스타일"을 프롬프트에 연결
- [ ] 댓글 도메인 (08 `commentCount`가 항상 0, 뱃지 `FIRST_COMMENT`가 잠김)
- [ ] 구독 결제·영수증 검증 (09, 뱃지 `PREMIUM`)
- [ ] 리마인더 실제 발송 (`notification`)
- [ ] 나머지 28개 뱃지 정의 (기존 지표면 SQL, 새 지표면 `BadgeMetric` 추가)
- [ ] "자주 쓴 말"을 형태소 분석기나 LLM 추출로 교체
