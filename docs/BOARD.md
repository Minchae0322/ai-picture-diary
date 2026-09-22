# 산출물 진행 보드

CHANGELOG.md는 코드 변경 기록, 이 보드는 **현행 문서 동기화 상태**와 무엇이 구현됐는지를 다룬다.

## 동기화 상태
- last_synced_commit: 8eaf3db + 미커밋(화면 05~10 구현)
- last_synced_at: 2026-09-22
- synced_by: Claude

## 구현 현황 (화면 기준)

| # | 화면 | 앱 | 서버 | 비고 |
|---|---|---|---|---|
| 01 | 온보딩 | 구현 | 해당 없음 | 로그인 화면 없음. CTA·보조 링크 둘 다 홈으로 |
| 02 | 홈 (기록 전) | 구현 | 구현 | 연속 배지·닉네임 붙음 |
| 03 | AI 생성 중 | 구현 | 구현 | AI는 규칙 기반 대역(MockDiaryPainter) |
| 04 | 결과 | 구현 | 구현 | 공유·뱃지 카드 붙음. 과거 날짜 모드 추가 |
| 05 | 감정 캘린더 | 구현 | 구현 | 새 테이블 없이 tb_diary 집계 |
| 06 | 감정 그래프 | 구현 | 구현 | 자주 쓴 말은 순진한 토크나이저 |
| 07 | 뱃지 컬렉션 | 구현 | 구현 | 정의는 `tb_badge` 마스터. 12/40종만 seed. 댓글·구독 뱃지는 잠김 |
| 08 | 커뮤니티 | 구현 | 구현 | 정렬 추천/최신/인기. **신고 처리 도구·차단 없음 - 배포 전 필수** |
| 09 | 테마 상점 | 구현 | 구현 | 결제·복원 없음. Plus 항목은 아무도 못 씀 |
| 10 | 마이페이지 | 구현 | 구현 | **계정 삭제 없음 - 스토어 필수**. 설정 4행은 준비 중 안내 |

## 미분류 변경 (사람 판단 필요)
없음.

## 갱신 이력 (최근 10건만 유지)
| 일시 | 갱신 문서 | 커밋 범위 |
|---|---|---|
| 2026-09-22 | 갱신: 추천 다양성(상위 10 중 2) - `domain/community/`, `screen/08`, API 명세 | (미커밋) |
| 2026-09-22 | 신규: 스킬 `feed-ranking`·`similarity-search`, `db/2026-09-22-커뮤니티-추천정렬` · 갱신: `domain/community/`, `screen/08`, API 명세 | (미커밋) |
| 2026-09-22 | 신규: `db/2026-09-22-badge-마스터-테이블.md` · 갱신: `domain/badge/`, `screen/07`, `feature/뱃지-컬렉션`, API 명세 | (미커밋) |
| 2026-09-22 | 갱신: 패키지 구조(domain=엔티티만) · util/llm 공통화 · 이모지 제거 - 프로젝트 스킬 4-1·5장, `expo-app-conventions`, `harness`, ArchUnit, `.githooks/no-emoji.js` | (미커밋) |
| 2026-09-22 | 갱신: 도메인 예외를 `BusinessException`으로 통일 - `api/2026-09-21-*`, `domain/diary/`, `domain/profile/`, `guide/` | (미커밋) |
| 2026-09-22 | 갱신: 프로필 기본값을 `app.profile.*`로 이전 - `domain/profile/`, API 명세, `feature/프로필과-꾸미기.md` | (미커밋) |
| 2026-09-22 | 신규: `api/2026-09-22-화면05-10-API-명세.md`, `db/2026-09-22-badge-community-profile-테이블-추가.md` | (미커밋) |
| 2026-09-22 | 신규: `domain/diary/감정집계-`, `domain/badge/`, `domain/community/`, `domain/profile/` 4건 | (미커밋) |
| 2026-09-22 | 신규: `feature/` 4건(온보딩·캘린더그래프·뱃지·커뮤니티·프로필) | (미커밋) |
| 2026-09-22 | 갱신: `screen/` 01·02·04~10 + README(라우트 표), `INDEX.md` 전면, `README.md` 기능 표 | (미커밋) |
| 2026-09-21 | 신규: `feature/오늘-한줄-기록.md`, `README.md` 기능 표로 재편 | 73aa7fc |
| 2026-09-21 | 신규: `guide/개발-가이드.md` (common·resources·app shared 매핑) | 73aa7fc |

## 할 일

### 막는 것 (배포 전 필수)
- [ ] **백엔드 빌드·테스트 실행.** JDK 21 + `cd api && gradle wrapper`가 필요하다. **지금까지 한 번도 컴파일되지 않았다**
- [ ] `sql/patch/*.sql` 4개를 순서대로 실행 (사람이) 후 각 `docs/db/` 문서의 실행 기록 채우기. **뱃지 마스터는 badge-community-profile 다음**
- [ ] 08 신고 처리 도구와 차단 (`app-store-release`)
- [ ] 10 계정 삭제 (두 스토어 필수) - 인증 도입과 함께
- [ ] 09 구독 복원(Restore) 동선 - iOS 심사 필수

### 그다음
- [ ] 인증 도입 (`spring-auth`). `X-User-Id` 임시 헤더 제거, `common/auth/CurrentUser*` 삭제, 프로필 자동 생성을 회원가입으로 이전
- [ ] 실제 LLM 구현체 (`llm-integration`, `prompt-and-eval`). 10의 "AI 그림 스타일"을 프롬프트에 연결
- [ ] 댓글 도메인 (08 `commentCount`가 항상 0, 뱃지 `FIRST_COMMENT`가 잠김)
- [ ] 구독 결제·영수증 검증 (09, 뱃지 `PREMIUM`)
- [ ] 리마인더 실제 발송 (`notification`)
- [ ] 나머지 28개 뱃지 정의 (기존 지표면 SQL, 새 지표면 `BadgeMetric` 추가)
- [ ] "자주 쓴 말"을 형태소 분석기나 LLM 추출로 교체
