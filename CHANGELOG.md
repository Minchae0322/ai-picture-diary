# 변경 기록

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/), 버전은 [SemVer](https://semver.org/lang/ko/).

## [Unreleased]

### Added
- 일기 도메인: 하루 한 줄 기록 -> AI 감정 날씨 판정 -> 그림 결과의 핵심 루프 (화면 02·03·04)
  - `POST /api/v1/diaries`, `GET /api/v1/diaries/{id}`, `GET /api/v1/diaries/today`, `GET /api/v1/diaries`(커서), `POST /api/v1/diaries/{id}/regenerate`
  - `tb_diary` 테이블, 하루 1건 부분 unique, 커서 페이징 인덱스
  - AI 대역 `MockDiaryPainter` (규칙 기반). 실모델은 `app.ai.provider`로 교체
- Expo 앱: 탭 5개 + 홈 탭에서 기록/생성중/결과 분기, 디자인 토큰(soft-modern)
- 관측성: `AppLog` 구조화 로그 헬퍼, 요청 종료 1줄 로그, traceId 전파(@Async 포함)
- 검증 하네스: ArchUnit 9규칙, 단위/통합 테스트 분리, Spotless, Claude/git hook
- 문서: 화면 10건, API 명세, DB 변경, 도메인 비즈니스 로직, INDEX/BOARD

### Known issues
- 빌드·테스트 미검증 (JDK 21·Gradle 미설치 환경에서 작성)
- 인증 없음. `X-User-Id` 헤더로 임시 식별
