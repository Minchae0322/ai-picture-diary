# 화면 문서

> 시안: [AI 감정 날씨일기 · Web App Sketch](https://www.figma.com/design/zbYEQIRk1ttPOFzojh2hcL/AI-%25EA%25B0%2590%25EC%25A0%2595-%25EB%2582%25A0%25EC%2594%25A8%25EC%259D%25BC%25EA%25B8%25B0---Web-App-Sketch?node-id=2-7) (페이지 `01 · Mobile Screens`, 390x844) · 갱신: 2026-09-21
> 작성 규칙: `.claude/skills/screen-docs/SKILL.md`

> **[prototype.html](prototype.html)** - 눌러서 돌아가는 HTML 프로토타입. 브라우저로 연다.
> 한 줄 쓰면 02 → 03 → 04 흐름이 돌고, 탭·달 이동·필터·좋아요가 실제로 동작한다. 위 도구 막대에 라이트/다크 토글과 "전체 보기"(10화면 한 번에)가 있다.
> [index.html](index.html)은 그 이전의 정적 미리보기다. prototype.html의 "전체 보기"가 같은 일을 하므로 지워도 된다.

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
- 탭바 5개: 홈 / 캘린더 / 그래프 / 커뮤니티 / MY. 01·03을 제외한 모든 화면에 고정 노출.
- 03·04는 홈 탭의 흐름(기록 -> 생성 -> 결과). 별도 탭 아님. 03은 홈 위를 덮는 오버레이다.
- 07·09는 10 마이페이지에서 진입한다. 시안에 동선이 없어 **정했다**: 07은 "뱃지" 통계 탭, 09는 "테마 변경" 행.
- 01 온보딩은 탭 밖의 라우트다. `(tabs)/_layout.tsx`가 로컬 플래그(`onboarding_done`)를 보고 보낸다.

## 공통 규칙
- 기준 해상도 390x844(모바일 1폭). 더 넓은 폭에서는 본문을 430까지만 넓히고 가운데 정렬한다.
- 상단 상태바(`9:41`, `status-icons`)는 OS 영역. 구현 대상 아님.
- 배경 `sunlight` 원형 글로우는 공통 배경 레이어. `shared/ui/Screen.tsx`의 `ScreenBackground` 하나가 담당한다.
- 색·간격·라운드는 시안 값이 아니라 토큰으로 옮긴다(`design-system`, 프리셋 `muted-sky`).
- 모든 화면의 로딩/빈/에러는 시안에 없으므로 `shared/ui/States.tsx`의 한 모양을 쓴다.
- **날씨를 색으로만 표시하지 않는다.** 날씨색 6종은 서로 구분되지 않는다. 채도를 낮춘 지금은 더 그렇다. 라벨이 없는 자리(캘린더 셀, 썸네일)에는 글리프를 같이 둔다.

## 색은 시안과 갈라져 있다 (의도된 것)

**색의 진실은 코드**(`app/src/shared/theme/tokens.ts`)이고, 프리셋은 `muted-sky`(채도 낮은 하늘색)다.
Figma 시안은 복숭아 톤이므로 **색만 다르고 레이아웃·구조·문구는 시안이 진실이다.**
시안을 다시 가져올 때 색은 덮어쓰지 않는다(figma-workflow 4장 - 토큰 동기화 방향).

| 역할 | 값 | 최악 배경 대비 |
|---|---|---|
| 본문 | `#253544` | 9.72 |
| 보조 | `#4e6375` | 4.83 |
| 흐린 (표면 위에서만) | `#5b6e7f` | 4.76 |
| 주 버튼 | `#3f6d8e` | 흰 글자 5.54 |

`decor`(#a8bccd)와 `accentSoft`(#5b9bc4)는 대비를 못 맞추는 **장식 전용**이다. 점선 테두리, 인디케이터, 뜻 없는 큰 글리프에만 쓴다.

## 시안에 없어 추가한 것
UGC·스토어 심사에 필수라 시안에 없어도 넣었다.
- 08 신고·차단 (카드 우측 `···`)
- 09 구매 복원
- 10 계정 삭제

## 시안에 없어 전역으로 미정인 것
- 로그인·회원가입 화면 (01의 "이미 계정이 있어요" 목적지. 지금은 홈으로 보낸다)
- 과거 날짜 상세 화면 (05 캘린더 날짜 탭, 02 최근 기록 탭의 목적지)
- 커뮤니티 글쓰기·댓글 화면 (08 FAB, 💬 목적지)
- 구독 결제 화면 (09 "구독" 목적지)
- 설정 하위 화면 6종 (10의 각 행)
