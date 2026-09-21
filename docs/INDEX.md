# 현행 문서 인덱스

<!-- 형식: | 문서 | 코드 경로(글롭, 쉼표 구분) | 키워드 | -->
<!-- 이력 문서(YYYY-MM-DD-*.md)는 넣지 않는다. 테스트·빌드 파일도 넣지 않는다. -->

| 문서 | 코드 경로 | 키워드 |
|---|---|---|
| `domain/diary/일기생성-비즈니스로직.md` | `api/src/main/java/com/jellydiary/diary/**` | 일기, 하루 1건, 감정 날씨, 기분 점수, 다시 그리기, AI 생성 |
| `feature/오늘-한줄-기록.md` | `api/src/main/java/com/jellydiary/diary/**`, `app/src/features/diary/**` | 기능 소개, 한 줄 기록, 다시 그리기 |
| `feature/화면-10종-시안-구현.md` | `app/app/**`, `app/src/features/**` | 화면 10종, 시안 구현, 목 데이터, 예시 값 |
| `guide/개발-가이드.md` | `api/src/main/java/com/jellydiary/common/**`, `api/src/main/resources/**`, `app/src/shared/**` | 응답 봉투, ErrorCode, 인증 임시 헤더, traceId, AppLog, 토큰, 하네스 |
| `screen/01-onboarding.md` | `app/app/onboarding.tsx`, `app/src/features/onboarding/**`, `app/src/shared/lib/onboarding.ts` | 온보딩, 시작, 로컬 플래그, 구름 히어로, 글래스 CTA |
| `screen/02-home.md` | `app/app/(tabs)/index.tsx`, `app/src/features/diary/ui/DiaryComposer.tsx`, `app/src/features/diary/ui/EmptyCanvas.tsx`, `app/src/features/diary/ui/RecentDiaries.tsx`, `app/src/features/diary/ui/StreakChip.tsx` | 홈, 한 줄 기록, 빠른 감정 칩, 최근 기록, 연속 기록 |
| `screen/03-generating.md` | `app/src/features/diary/ui/GeneratingOverlay.tsx`, `app/src/features/diary/hooks/useDiary.ts` | 생성 중, 폴링, 대기 화면, 불확정 진행 |
| `screen/04-result.md` | `app/src/features/diary/ui/DiaryResult.tsx`, `app/src/features/diary/ui/DiaryArtwork.tsx` | 결과, AI 이미지, 다시 그리기, AI generated |
| `screen/05-calendar.md` | `app/app/(tabs)/calendar.tsx`, `app/src/features/calendar/**` | 캘린더, 월 격자, 월 요약, 날씨 색 |
| `screen/06-graph.md` | `app/app/(tabs)/graph.tsx`, `app/src/features/graph/**` | 그래프, 기분 추이, KPI, 자주 쓴 말 |
| `screen/07-badge.md` | `app/app/badges.tsx`, `app/src/features/badge/**` | 뱃지, 컬렉션, 잠금, 수집 진행 |
| `screen/08-community.md` | `app/app/(tabs)/community.tsx`, `app/src/features/community/**` | 커뮤니티, 피드, 좋아요, 신고 차단 |
| `screen/09-store.md` | `app/app/store.tsx`, `app/src/features/store/**` | 상점, 테마, 캐릭터, 구독, 구매 복원 |
| `screen/10-mypage.md` | `app/app/(tabs)/my.tsx`, `app/src/features/profile/**` | 마이페이지, 프로필, 설정, 계정 삭제 |
| `screen/prototype.html` | `app/app/**`, `app/src/**` | 프로토타입, 동작하는 HTML, 10화면, 규칙 기반 AI 대역 |
| `screen/index.html` | `app/src/shared/theme/tokens.ts`, `app/src/shared/ui/**` | 화면 미리보기, 10화면 한눈에, 다크 모드 확인 |
| `screen/README.md` | `app/app/(tabs)/_layout.tsx`, `app/app/_layout.tsx`, `app/src/shared/ui/**`, `app/src/shared/theme/**` | 탭바, 화면 목록, 탐색 구조, 공통 UI, 디자인 토큰 |

<!-- 목 데이터의 위치: `app/src/shared/lib/mock*.ts`, `app/src/features/*/model/mock*.ts`. 서버가 붙으면 여기부터 지운다. -->
