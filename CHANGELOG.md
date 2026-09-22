# 변경 기록

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/), 버전은 [SemVer](https://semver.org/lang/ko/).

## [Unreleased]

### Added
- 화면 05~10 구현 (시안 10화면 전부 동작)
  - 05 감정 캘린더 / 06 감정 그래프: 새 테이블 없이 `tb_diary` 기간 집계. `GET /api/v1/diaries/calendar|stats|overview`
  - 연속 기록 계산을 `StreakCalculator` 한 곳으로 고정 (02·06·10이 같은 값)
  - 07 뱃지: `tb_badge`(정의) + `tb_user_badge`(획득), 시안 12종 seed. 일기 완료 이벤트로 서버가 판정
  - 08 커뮤니티: `tb_community_post`/`tb_post_like`/`tb_post_report`, 커서 페이징(최신/인기), 좋아요 멱등, **신고 동선**
  - 09·10 프로필·꾸미기: `tb_profile`, 테마·캐릭터 `StoreItem` enum, Plus 잠금 판정은 서버가
  - 01 온보딩: 슬라이드 3장 + 로컬 완료 플래그(AsyncStorage)
  - 04 과거 날짜 모드 라우트 `app/diary/[id].tsx`, 결과 화면에 공유·뱃지 획득 카드
- 앱 공용 컴포넌트: `Screen`/`ScreenHeader`/`Chip`/`Segmented`/`ListRow`/`StateBlock`(로딩·빈·에러·스켈레톤)
- 날씨 어휘를 `shared/weather.ts`로 올림 (캘린더·그래프·커뮤니티가 같이 쓴다) + 날씨 색 토큰

- 일기 도메인: 하루 한 줄 기록 -> AI 감정 날씨 판정 -> 그림 결과의 핵심 루프 (화면 02·03·04)
  - `POST /api/v1/diaries`, `GET /api/v1/diaries/{id}`, `GET /api/v1/diaries/today`, `GET /api/v1/diaries`(커서), `POST /api/v1/diaries/{id}/regenerate`
  - `tb_diary` 테이블, 하루 1건 부분 unique, 커서 페이징 인덱스
  - AI 대역 `MockDiaryPainter` (규칙 기반). 실모델은 `app.ai.provider`로 교체
- Expo 앱: 탭 5개 + 홈 탭에서 기록/생성중/결과 분기, 디자인 토큰(soft-modern)
- 관측성: `AppLog` 구조화 로그 헬퍼, 요청 종료 1줄 로그, traceId 전파(@Async 포함)
- 검증 하네스: ArchUnit 9규칙, 단위/통합 테스트 분리, Spotless, Claude/git hook
- 문서: 화면 10건, API 명세, DB 변경, 도메인 비즈니스 로직, INDEX/BOARD

### Added
- **08 커뮤니티 "추천" 정렬** (기본값). 내 오늘 기분과 비슷한 글 먼저 - 날씨 일치 2 + 기분 1칸 이내 1 + 최근 3일 1점. 임베딩이 아니라 규칙 점수(`FeedTaste`)이고 AI 호출이 0이다. 오늘 기록이 없으면 최신순으로 폴백
  - `tb_community_post.mood_score` 추가, 커서에 정렬 점수를 싣도록 `CommunityCursor` 확장
  - **다양성**: 상위 10개 중 2개는 다른 날씨(`FeedDiversity`). 재배열이라 커서는 그대로다
  - 새 범용 스킬 `feed-ranking`(정렬 축·커서 충돌·다양성·콜드 스타트), `similarity-search`(유사도 계산·임계값·평가)

### Changed
- **뱃지 정의를 코드 enum(`BadgeType`)에서 `tb_badge` 마스터 테이블로 옮겼다.** 이름·조건 문구·임계값·정렬은 데이터, 무엇을 재는지(`BadgeMetric`)와 판정식(`지표 >= 임계값`)은 코드. `tb_user_badge.badge_type` -> `badge_code`. 기존 지표를 쓰는 새 뱃지는 INSERT 한 줄로 늘어난다
- **패키지 구조**: `domain/`에는 엔티티(테이블)만 남기고 enum·값 객체는 `type/`, 이벤트는 `event/`, 포트는 `port/`로 뺐다. 순수 계산 3종은 `common/util`로 올리며 이름을 하는 일로 바꿨다(`DiaryStreak`->`StreakCalculator`, `DiaryWords`->`WordCounter`). ArchUnit이 `..domain..`에 `@Entity`를 요구한다
- **모델 연동을 `com.jellydiary.llm` 컨텍스트로 모았다.** `app.ai.*` -> `app.llm.*`(`llm/config/LlmProperties`), 계약과 구현은 `llm/painter/`(`DiaryPainter`/`DiaryPainting`/`MockDiaryPainter`). `diary/infrastructure`와 `diary/port`는 없앴다. ArchUnit 11번이 `llm -> controller/service/repository`를 막는다
- `DiaryProperties`가 `app.diary.*`만 담는다. 전역인 `app.timezone`은 `Clock` 빈이 통째로 물고 있어 도메인 설정에서 뺐다
- **앱 UI의 이모지를 전부 SVG 아이콘으로 바꿨다**(`app/src/shared/ui/Icon.tsx`, 25종). 플랫폼마다 모양이 다르고 토큰 색을 못 따르고 스크린리더가 이름을 제멋대로 읽는다
- 산출물 문서의 이모지 제거(`deliverable-write` 30행). `.githooks/no-emoji.js`가 커밋 때 막는다
- **도메인 예외를 `BusinessException(ErrorCode)`로 통일했다**(`api-design` 3장). `Diary`·`Profile`이 `IllegalArgumentException`/`IllegalStateException`을 던지고 서비스가 잡아 번역하던 계층을 없앴다 - 같은 규칙이 어느 코드로 나가는지가 두 곳에 흩어져 있었다. 어댑터 계약 위반·설정값 오류 같은 **시스템 예외는 그대로** `IllegalArgumentException`이다
- 프로필 기본값을 엔티티 상수에서 뺐다. `app.profile.default-ai-style`·`max-nickname-length` -> `ProfilePolicy`로 도메인에 넘긴다(config-and-secrets 4-1장). 기본 닉네임은 `NicknameGenerator`가 "형용사 + 명사"로 만든다 - 모두가 "젤리"면 08 피드가 같은 이름으로 찬다
- `Clock` 빈이 `app.timezone`으로 고정된다. UTC 시계 + 호출부마다 `withZone`은 한 곳만 빠져도 자정 근처에서 틀린다
- 제약 위반(`DataIntegrityViolationException`) 일반 처리가 `COMMON_CONFLICT`로 바뀌었다. "오늘은 이미 기록했어요"는 이제 `DiaryService`가 `saveAndFlush`로 직접 잡는다 - 예외 처리기가 제약 이름을 모른 채 일기 코드로 단정하던 것을 고쳤다
- `app/package.json`의 react 핀을 19.2.3으로 (react-native 0.85가 `^19.2.3`을 요구해 설치가 실패하고 있었다)

### Fixed
- 다시 그리기의 "아직 그리는 중"이 `DIARY_REGENERATE_LIMIT`으로 나가고 있었다. 상한을 다 쓰지 않았는데 "오늘은 더 다시 그릴 수 없어요"가 보였다 -> `DIARY_NOT_DONE`
- 앱 타입 오류: 다크 팔레트가 `as const` 리터럴 타입과 충돌하던 문제 (`Colors`/`WeatherColors` 타입 명시)

### Known issues
- **백엔드 빌드·테스트 미검증** (이 환경에 JDK 11만 있고 Gradle·wrapper가 없다). 앱은 `npx tsc --noEmit` 통과
- 인증 없음. `X-User-Id` 헤더로 임시 식별. 계정 삭제 없음(두 스토어 필수)
- 커뮤니티 신고를 받기만 하고 처리 도구·차단이 없다 (배포 전 필수)
- 구독 결제·영수증 검증 없음. Plus 항목은 아무도 쓸 수 없다
- 댓글 없음 (`commentCount`는 항상 0, 뱃지 `FIRST_COMMENT`·`PREMIUM`은 영구 잠김)
