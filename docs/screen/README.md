# 화면 문서

> 시안: [AI 감정 날씨일기 · Web App Sketch](https://www.figma.com/design/zbYEQIRk1ttPOFzojh2hcL/AI-%25EA%25B0%2590%25EC%25A0%2595-%25EB%2582%25A0%25EC%2594%25A8%25EC%259D%25BC%25EA%25B8%25B0---Web-App-Sketch?node-id=2-7) (페이지 `01 · Mobile Screens`, 390x844) · 갱신: 2026-09-21
> 작성 규칙: `.claude/skills/screen-docs/SKILL.md`

## 목록
| # | 화면 | 문서 | 시안 | 탭 |
|---|---|---|---|---|
| 01 | 온보딩 / 시작 | [01-onboarding.md](01-onboarding.md) | [8:2](https://www.figma.com/design/zbYEQIRk1ttPOFzojh2hcL/AI-%25EA%25B0%2590%25EC%25A0%2595-%25EB%2582%25A0%25EC%2594%25A8%25EC%259D%25BC%25EA%25B8%25B0---Web-App-Sketch?node-id=8-2) | - |
| 02 | 홈 · 오늘 기록 전 | [02-home.md](02-home.md) | [8:28](https://www.figma.com/design/zbYEQIRk1ttPOFzojh2hcL/AI-%25EA%25B0%2590%25EC%25A0%2595-%25EB%2582%25A0%25EC%2594%25A8%25EC%259D%25BC%25EA%25B8%25B0---Web-App-Sketch?node-id=8-28) | 홈 |
| 03 | AI 생성 중 | [03-generating.md](03-generating.md) | [8:91](https://www.figma.com/design/zbYEQIRk1ttPOFzojh2hcL/AI-%25EA%25B0%2590%25EC%25A0%2595-%25EB%2582%25A0%25EC%2594%25A8%25EC%259D%25BC%25EA%25B8%25B0---Web-App-Sketch?node-id=8-91) | 홈 |
| 04 | 오늘의 결과 · AI 이미지 | [04-result.md](04-result.md) | [9:2](https://www.figma.com/design/zbYEQIRk1ttPOFzojh2hcL/AI-%25EA%25B0%2590%25EC%25A0%2595-%25EB%2582%25A0%25EC%2594%25A8%25EC%259D%25BC%25EA%25B8%25B0---Web-App-Sketch?node-id=9-2) | 홈 |
| 05 | 감정 캘린더 | [05-calendar.md](05-calendar.md) | [9:46](https://www.figma.com/design/zbYEQIRk1ttPOFzojh2hcL/AI-%25EA%25B0%2590%25EC%25A0%2595-%25EB%2582%25A0%25EC%2594%25A8%25EC%259D%25BC%25EA%25B8%25B0---Web-App-Sketch?node-id=9-46) | 캘린더 |
| 06 | 감정 그래프 | [06-graph.md](06-graph.md) | [9:181](https://www.figma.com/design/zbYEQIRk1ttPOFzojh2hcL/AI-%25EA%25B0%2590%25EC%25A0%2595-%25EB%2582%25A0%25EC%2594%25A8%25EC%259D%25BC%25EA%25B8%25B0---Web-App-Sketch?node-id=9-181) | 그래프 |
| 07 | 뱃지 컬렉션 | [07-badge.md](07-badge.md) | [10:2](https://www.figma.com/design/zbYEQIRk1ttPOFzojh2hcL/AI-%25EA%25B0%2590%25EC%25A0%2595-%25EB%2582%25A0%25EC%2594%25A8%25EC%259D%25BC%25EA%25B8%25B0---Web-App-Sketch?node-id=10-2) | MY 하위 |
| 08 | 커뮤니티 | [08-community.md](08-community.md) | [10:79](https://www.figma.com/design/zbYEQIRk1ttPOFzojh2hcL/AI-%25EA%25B0%2590%25EC%25A0%2595-%25EB%2582%25A0%25EC%2594%25A8%25EC%259D%25BC%25EA%25B8%25B0---Web-App-Sketch?node-id=10-79) | 커뮤니티 |
| 09 | 테마 · 캐릭터 상점 | [09-store.md](09-store.md) | [11:2](https://www.figma.com/design/zbYEQIRk1ttPOFzojh2hcL/AI-%25EA%25B0%2590%25EC%25A0%2595-%25EB%2582%25A0%25EC%2594%25A8%25EC%259D%25BC%25EA%25B8%25B0---Web-App-Sketch?node-id=11-2) | MY 하위 |
| 10 | 마이페이지 | [10-mypage.md](10-mypage.md) | [11:87](https://www.figma.com/design/zbYEQIRk1ttPOFzojh2hcL/AI-%25EA%25B0%2590%25EC%25A0%2595-%25EB%2582%25A0%25EC%2594%25A8%25EC%259D%25BC%25EA%25B8%25B0---Web-App-Sketch?node-id=11-87) | MY |

## 탐색 구조
- 탭바 5개: 홈 / 캘린더 / 그래프 / 커뮤니티 / MY. 01·03·04를 제외한 모든 화면에 고정 노출.
- 03·04는 홈 탭의 흐름(기록 -> 생성 -> 결과). 별도 탭 아님.
- 07·09는 10 마이페이지에서 진입. 시안에 진입 동선이 명시돼 있지 않아 **미정**.

## 공통 규칙
- 기준 해상도 390x844(모바일 1폭). 다른 폭 동작은 시안에 없음 -> `design-system` 3장에서 정한다.
- 상단 상태바(`9:41`, `status-icons`)는 OS 영역. 구현 대상 아님.
- 배경 `sunlight` 원형 글로우는 공통 배경 레이어. 화면마다 다시 만들지 않는다.
- 색·간격·라운드는 시안 값이 아니라 토큰으로 옮긴다(`design-system`).
- 모든 화면의 로딩/빈/에러는 시안에 없으므로 각 문서 5장에서 정의한다.

## 시안에 없어 전역으로 미정인 것
- 로그인·회원가입 화면 (01의 "이미 계정이 있어요" 목적지)
- 과거 날짜 상세 화면 (05 캘린더 날짜 탭, 02 최근 기록 탭의 목적지)
- 커뮤니티 글쓰기·댓글 화면 (08 FAB, 💬 목적지)
- 구독 결제 화면 (09 "구독" 목적지)
- 설정 하위 화면 6종 (10의 각 행)
