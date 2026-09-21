# 현행 문서 인덱스

<!-- 형식: | 문서 | 코드 경로(글롭, 쉼표 구분) | 키워드 | -->
<!-- 이력 문서(YYYY-MM-DD-*.md)는 넣지 않는다. 테스트·빌드 파일도 넣지 않는다. -->

| 문서 | 코드 경로 | 키워드 |
|---|---|---|
| `domain/diary/일기생성-비즈니스로직.md` | `api/src/main/java/com/jellydiary/diary/**` | 일기, 하루 1건, 감정 날씨, 기분 점수, 다시 그리기, AI 생성 |
| `feature/오늘-한줄-기록.md` | `api/src/main/java/com/jellydiary/diary/**`, `app/src/features/diary/**` | 기능 소개, 한 줄 기록, 다시 그리기 |
| `guide/개발-가이드.md` | `api/src/main/java/com/jellydiary/common/**`, `api/src/main/resources/**`, `app/src/shared/**` | 응답 봉투, ErrorCode, 인증 임시 헤더, traceId, AppLog, 토큰, 하네스 |
| `screen/02-home.md` | `app/app/(tabs)/index.tsx`, `app/src/features/diary/ui/DiaryComposer.tsx`, `app/src/features/diary/ui/RecentDiaries.tsx` | 홈, 한 줄 기록, 빠른 감정 칩, 최근 기록 |
| `screen/03-generating.md` | `app/src/features/diary/ui/GeneratingCard.tsx`, `app/src/features/diary/hooks/useDiary.ts` | 생성 중, 폴링, 대기 화면 |
| `screen/04-result.md` | `app/src/features/diary/ui/DiaryResult.tsx` | 결과, AI 이미지, 다시 그리기, AI generated |
| `screen/README.md` | `app/app/(tabs)/_layout.tsx`, `app/app/_layout.tsx` | 탭바, 화면 목록, 탐색 구조 |

<!-- 미구현 화면(05~10)은 코드가 없어 매핑하지 않는다. 착수 시 이 표에 줄을 추가한다. -->
