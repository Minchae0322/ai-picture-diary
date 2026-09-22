# 현행 문서 인덱스

<!-- 형식: | 문서 | 코드 경로(글롭, 쉼표 구분) | 키워드 | -->
<!-- 이력 문서(YYYY-MM-DD-*.md)는 넣지 않는다. 테스트·빌드 파일도 넣지 않는다. -->

| 문서 | 코드 경로 | 키워드 |
|---|---|---|
| `domain/diary/일기생성-비즈니스로직.md` | `api/src/main/java/com/jellydiary/diary/domain/**`, `api/src/main/java/com/jellydiary/diary/service/Diary{Service,QueryService,GenerationListener,ResultApplier}.java`, `api/src/main/java/com/jellydiary/llm/**` | 일기, 하루 1건, 감정 날씨, 기분 점수, 다시 그리기, AI 생성 |
| `domain/diary/감정집계-비즈니스로직.md` | `api/src/main/java/com/jellydiary/diary/service/DiaryStatsService.java`, `api/src/main/java/com/jellydiary/diary/domain/Diary{Streak,Words}.java`, `api/src/main/java/com/jellydiary/diary/domain/StatsPeriod.java` | 캘린더, 그래프, 연속 기록, 월 집계, 기분 추이, 자주 쓴 말 |
| `domain/badge/뱃지획득-비즈니스로직.md` | `api/src/main/java/com/jellydiary/badge/**` | 뱃지, 획득 조건, 연속 기록, 컬렉션 |
| `domain/community/피드공유-비즈니스로직.md` | `api/src/main/java/com/jellydiary/community/**` | 커뮤니티, 피드, 공유, 좋아요, 신고, 커서 페이징 |
| `domain/profile/프로필꾸미기-비즈니스로직.md` | `api/src/main/java/com/jellydiary/profile/**` | 프로필, 닉네임, 테마, 캐릭터, 구독, 설정 |
| `feature/온보딩.md` | `app/app/onboarding.tsx`, `app/src/features/onboarding/**` | 기능 소개, 첫 실행, 슬라이드 |
| `feature/오늘-한줄-기록.md` | `api/src/main/java/com/jellydiary/diary/**`, `app/src/features/diary/ui/Diary{Composer,Result}.tsx`, `app/src/features/diary/ui/GeneratingCard.tsx` | 기능 소개, 한 줄 기록, 다시 그리기 |
| `feature/감정-캘린더와-그래프.md` | `app/app/(tabs)/{calendar,graph}.tsx`, `app/src/features/diary/ui/{CalendarMonth,MonthSummary,MoodChart,KpiRow,StreakBadge}.tsx` | 기능 소개, 캘린더, 그래프, 연속 기록 |
| `feature/뱃지-컬렉션.md` | `app/app/badges.tsx`, `app/src/features/badge/**` | 기능 소개, 뱃지 |
| `feature/커뮤니티-피드.md` | `app/app/(tabs)/community.tsx`, `app/src/features/community/**` | 기능 소개, 피드, 공유, 신고 |
| `feature/프로필과-꾸미기.md` | `app/app/{store,(tabs)/my}.tsx`, `app/src/features/profile/**` | 기능 소개, 마이페이지, 테마, 구독 |
| `guide/개발-가이드.md` | `api/src/main/java/com/jellydiary/common/**`, `api/src/main/resources/**`, `app/src/shared/**`, `.githooks/**` | 응답 봉투, ErrorCode, 인증 임시 헤더, traceId, AppLog, 토큰, 하네스 |
| `screen/01-onboarding.md` | `app/app/onboarding.tsx`, `app/src/features/onboarding/useOnboarding.ts` | 온보딩, 첫 실행, 슬라이드 |
| `screen/02-home.md` | `app/app/(tabs)/index.tsx`, `app/src/features/diary/ui/DiaryComposer.tsx`, `app/src/features/diary/ui/RecentDiaries.tsx`, `app/src/features/diary/ui/StreakBadge.tsx` | 홈, 한 줄 기록, 빠른 감정 칩, 최근 기록, 연속 배지 |
| `screen/03-generating.md` | `app/src/features/diary/ui/GeneratingCard.tsx`, `app/src/features/diary/hooks/useDiary.ts` | 생성 중, 폴링, 대기 화면 |
| `screen/04-result.md` | `app/src/features/diary/ui/DiaryResult.tsx`, `app/app/diary/[id].tsx` | 결과, AI 이미지, 다시 그리기, 공유, AI generated |
| `screen/05-calendar.md` | `app/app/(tabs)/calendar.tsx`, `app/src/features/diary/ui/CalendarMonth.tsx`, `app/src/features/diary/ui/MonthSummary.tsx` | 캘린더, 월 집계, 날씨 그리드 |
| `screen/06-graph.md` | `app/app/(tabs)/graph.tsx`, `app/src/features/diary/ui/MoodChart.tsx`, `app/src/features/diary/ui/KpiRow.tsx` | 그래프, 기분 추이, KPI, 자주 쓴 말 |
| `screen/07-badge.md` | `app/app/badges.tsx`, `app/src/features/badge/**` | 뱃지, 컬렉션, 잠금 |
| `screen/08-community.md` | `app/app/(tabs)/community.tsx`, `app/src/features/community/**` | 커뮤니티, 피드, 필터, 좋아요, 신고 |
| `screen/09-store.md` | `app/app/store.tsx`, `app/src/features/profile/ui/StoreGrid.tsx` | 꾸미기, 테마, 캐릭터, 구독 |
| `screen/10-mypage.md` | `app/app/(tabs)/my.tsx`, `app/src/features/profile/ui/ProfileCard.tsx`, `app/src/shared/ui/ListRow.tsx` | 마이페이지, 프로필, 통계, 설정 |
| `screen/README.md` | `app/app/(tabs)/_layout.tsx`, `app/app/_layout.tsx` | 탭바, 화면 목록, 탐색 구조, 라우트 |
