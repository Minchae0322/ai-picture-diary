# 변경 기록

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/), 버전은 [SemVer](https://semver.org/lang/ko/).

## [Unreleased]

### Added
- 01 히어로 뒤에 노트 괘선 추가(`rule` 토큰, 32px 간격 1px, 좌우 28px 여백). RN은 `NotebookLines.tsx`
- 01 온보딩 히어로를 손그림 로고 `onboarding.png` 로 교체 (`features/onboarding/ui/OnboardingHero.tsx`)
  - 시안의 `jelly-bowl`(꽃잎 6장 + 젤리 5개)은 더 이상 쓰지 않는다. 의도된 시안 이탈
  - 투명 배경 PNG, 움직임 없음
  - 알파 경계 상자(x 384~1736, y 322~1586)를 재서 그림 영역을 레이아웃 박스로 삼았다.
    PNG 박스를 그냥 가운데 두면 투명 여백이 비대칭이라 그림이 중앙에 오지 않는다. 표시 폭 280
- 01 온보딩 CTA를 글래스모피즘으로 (`glass-button` 스킬 설치: `.claude/skills/glass-button/`)
  - HTML 프로토타입 전용. `backdrop-filter`·`mask-composite`가 RN에 없어 앱은 아직 solid다
  - 밝은 배경이라 라벨은 흰색이 아니라 `--text`(#253544). 흰 오버레이 0.16, blur 10px + saturate 125%
  - 유리가 흐릴 대상으로 화면 바닥에 손그림 대각선 띠 `bottom.png` 를 깔았다
    선이 얇아 blur를 10px -> 5px로 낮췄다(크면 선이 지워진다). 움직이지 않는다
  - 프리셋 예외로 기록: `presets/muted-sky.md` 5.5장 (앱 전체에서 유리는 이 하나뿐)
- 일기 도메인: 하루 한 줄 기록 -> AI 감정 날씨 판정 -> 그림 결과의 핵심 루프 (화면 02·03·04)
  - `POST /api/v1/diaries`, `GET /api/v1/diaries/{id}`, `GET /api/v1/diaries/today`, `GET /api/v1/diaries`(커서), `POST /api/v1/diaries/{id}/regenerate`
  - `tb_diary` 테이블, 하루 1건 부분 unique, 커서 페이징 인덱스
  - AI 대역 `MockDiaryPainter` (규칙 기반). 실모델은 `app.ai.provider`로 교체
- Expo 앱: 탭 5개 + 홈 탭에서 기록/생성중/결과 분기, 디자인 토큰(soft-modern)
- 관측성: `AppLog` 구조화 로그 헬퍼, 요청 종료 1줄 로그, traceId 전파(@Async 포함)
- 검증 하네스: ArchUnit 9규칙, 단위/통합 테스트 분리, Spotless, Claude/git hook
- 문서: 화면 10건, API 명세, DB 변경, 도메인 비즈니스 로직, INDEX/BOARD

### Changed
- 배경을 **바닐라 단색 `#faf4dc`** 로 교체(하늘색 3스톱 그라디언트에서)
  - 글로우도 차가운 하늘빛에서 따뜻한 빛으로. 배경만 따뜻하고 빛만 차가우면 얼룩으로 보인다
  - **흰 테두리를 옅은 선으로 바꿨다.** 종이색 배경에 흰 카드 + 흰 테두리는 경계가 사라진다
  - 대비 재계산: 본문 11.39 / 보조 5.66 / 흐린 4.78 / 주색 5.02, 하이라이트는 배경과 ΔE 11.7. 전부 통과
  - 09 기본 테마 미리보기와 이름도 배경에 맞춰 `Sky` -> `Paper`
- 01 온보딩 헤드라인의 "오늘의 기분"·"그림일기"에 형광펜 띠 추가(`highlight` `#7c5445` + `highlightText` 배경과 같은 바닐라. 글자가 파인 듯 보인다)
- 01 온보딩 문구 변경: 헤드라인 "날씨로 그려드릴게요" -> "나만의 그림일기로", 서브카피 "감정을 읽고 / 날씨와 그림을" -> "기분을 읽고 / 그림일기를"
- **서체를 SUIT(수트)로 통일.** 프로토타입·정적 미리보기·RN 앱 세 곳이 서로 달랐다
  - 웹: 가변 woff2 한 벌(610KB)을 `docs/screen/fonts/` 에 두고 `@font-face` 로 얹는다. Google Fonts 링크 제거
  - 앱: 정적 OTF 4벌(각 ~345KB)을 `app/assets/fonts/` 에 두고 `expo-font` 로 등록
  - **`fontWeight` 를 전부 `fontFamily` 로 교체**(40건). RN은 커스텀 폰트의 굵기를 합성하지 못한다
  - 폰트가 상속되지 않아 글자가 있는 스타일 43곳에 `font.regular` 를 보강했다
  - SUIT는 Google Fonts에 없어 파일을 저장소가 직접 들고 있다(SIL OFL 1.1)
- **디자인 톤 교체: 채도 낮은 하늘색(`muted-sky`).** `jelly-peach`(복숭아)를 대신한다
  - 새 프리셋 `.claude/skills/design-system/presets/muted-sky.md` (구조는 jelly-peach와 같고 색만 다르다)
  - `tokens.ts` 원시값·의미 토큰·날씨 6색·탭 색·그림자 색 전부 교체. **컴포넌트 코드는 한 줄도 안 바뀌었다** - 토큰 계층이 의도대로 동작했다
  - 대비 재계산: 본문 9.72 / 보조 4.83 / 흐린 4.76 / 흰 글자 on 주 버튼 5.54. 전부 통과
  - **색의 진실이 Figma 시안에서 코드로 옮겨졌다.** 시안은 복숭아 톤이라 이제 갈라져 있다. 레이아웃·구조·문구는 여전히 시안이 진실(`CLAUDE.md`, `docs/screen/README.md`)
  - 상점 상품 미리보기·캐릭터 색과 프로토타입 두 파일도 같은 값으로 맞췄다. 기본 테마 이름 `Jelly` -> `Sky`
- 디자인 프리셋을 `soft-modern`(바이올렛)에서 **`jelly-peach`**(Figma 시안 팔레트)로 교체. `app/src/shared/theme/tokens.ts` 전면 재작성
  - 시안 값 3종을 대비 미달로 보정: 보조 텍스트 `#8a6e78`->`#6b555d`, 흐린 텍스트 `#bca3ab`->`#7e6d73`, 주 버튼 `#f2637c`->`#c24f63` (근거는 프리셋 문서 6장)
  - 시안 원본 두 색은 장식 전용 토큰으로 유지
- 02·03·04를 시안 레이아웃으로 다시 구현. 03은 인라인 카드에서 **오버레이**로 바뀜
- 03의 진행 막대를 불확정 표시로. 서버가 단계를 주지 않아 시안의 68%는 가짜 진행이 된다

### Added
- 화면 01·05·06·07·08·09·10 구현 (시안 10화면 완비). 자리표시자 `ComingSoon` 제거
- 공통 UI: `Screen`(배경 그라디언트 + 글로우 + 안전영역 + 키보드), `Card`, `Button`, `Chip`, `Segmented`, `ProgressBar`, `WeatherTag`, `BackLink`, `States`(로딩/빈/에러)
- 시안 에셋 `app/assets/figma/*.svg` 13개 + `metro.config.js`(svg transformer)
- 날씨 어휘를 `app/src/shared/weather/`로 올림. 4개 feature가 같이 쓴다
- 시안에 없지만 필수라 추가: 08 신고·차단, 09 구매 복원, 10 계정 삭제
- 06 기분 추이 차트(`react-native-svg`). 무기록일은 선을 끊고, 차트에 텍스트 요약을 붙임
- 앱 의존성 4종: `expo-linear-gradient`, `react-native-svg`, `react-native-svg-transformer`(dev), `@react-native-async-storage/async-storage`
- 새 디자인 프리셋 `.claude/skills/design-system/presets/jelly-peach.md`
- `docs/screen/prototype.html` - 눌러서 돌아가는 HTML 프로토타입. 10화면 전부, 02->03->04 흐름, 규칙 기반 AI 대역(`MockDiaryPainter`와 같은 생각), 라이트/다크 토글, 전체 보기
- `docs/screen/index.html` - 10화면을 한 페이지에서 보는 정적 미리보기(prototype.html의 "전체 보기"로 대체 가능)

### Known issues
- 빌드·테스트 미검증 (JDK 21·Gradle 미설치 환경에서 작성)
- **앱 타입체크 미검증** (`node_modules` 없는 환경에서 작성). `npm install` 후 `npx tsc --noEmit` 필요
- 05~10의 데이터는 전부 목이다. 위치는 각 화면 문서 8장과 `docs/INDEX.md` 하단 주석
- Figma MCP 호출 한도로 03~10 화면의 색·간격을 시안과 직접 대조하지 못했다. 구조와 문구는 메타데이터로 맞췄다
- 인증 없음. `X-User-Id` 헤더로 임시 식별
