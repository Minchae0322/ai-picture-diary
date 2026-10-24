# CLAUDE.md

## 무엇보다 먼저

**작업을 시작하기 전에 `.claude/skills/ai-picture-diary/SKILL.md`를 읽는다.**

거기에 이 제품의 도메인 규칙, 확정 사항, 금지 사항, 화면 인덱스, 그리고 작업 종류별로 **이어서 읽을 범용 스킬**이 있다. 라우팅 표를 여기 두지 않는 이유는, 이 파일은 항상 통째로 로드되고 스킬은 필요할 때만 로드되기 때문이다.

읽는 순서: `CLAUDE.md` → 프로젝트 스킬 → 해당 범용 스킬.
충돌하면 **프로젝트 스킬 > 범용 스킬**이다.

## 이 파일에만 두는 것

파일 경로와 명령어처럼 **매 턴 필요한 짧은 사실**만 둔다. 판단이 필요한 것은 전부 스킬 쪽이다.

- 저장소: `api/`(Spring Boot) + `app/`(Expo) 모노레포
- 루트 패키지: `com.jellydiary` / 도메인 패키지: `com.jellydiary.<domain>` (현재 `diary`)
- 빌드·테스트: `cd api && ./gradlew build`, `./gradlew test`
- 앱 실행: `cd app && npm run start` (최초 설치는 `app/INSTALL.md`)
- 스키마: `sql/patch/*.sql` 이 진실. `ddl-auto: validate`
- 문서: `docs/` (화면 `docs/screen/`, API `docs/api/`, DB `docs/db/`)
- 커밋: `<type>(<scope>): <subject>`, scope = 도메인 패키지명

## 디자인 선언 (design-system 0장)

- 주 타깃: **모바일 우선** (390x844 기준)
- 프리셋: **muted-sky** (채도 낮은 하늘색. `.claude/skills/design-system/presets/muted-sky.md`)
- **표현 방식: 손그림(색연필).** UI 의 선·면·바탕을 손으로 그린 것처럼 만든다.
  규칙과 컴포넌트 코드는 `.claude/skills/hand-drawn-ui/`, 눈으로 고르는 목록은 `docs/design/components.html`.
  **새 UI 를 만들 때 기본값이다** - 반듯한 `borderWidth` 대신 `SketchBorder`, 네 귀 같은 radius 대신 비대칭
- 브랜드: 흐린 하늘 `#3f6d8e`. 배경은 **연노랑 종이 `#FDF6DC`**
  (2026-10-24, ADR `docs/adr/2026-10-24-바탕을-연노랑-종이로.md`. 서늘한 `#F2F5F8` 에서 되돌렸다)
  - 손그림 체계의 바탕은 색이 아니라 종이고, **종이는 푸르지 않다.**
  - 본문 11.60 · 보조 5.76 · 흰 카드와 ΔE **4.5**(서늘한 값의 3.2 보다 넓다). 아래쪽은 `#F7EFCF`
  - **밝기를 더 올리지 않는다.** 카드를 지운 범인은 노란기가 아니라 밝기였다 -
    크림 `#FAF6ED` 는 ΔE 2.9 라 카드가 사라졌다. 경계는 색이 아니라 손그림 테두리가 잡는다
  - 바탕은 `Screen` 의 `Backdrop` 이 **세 겹**으로 쌓는다 - 색, 결(`PaperGrain` 9%), 빛.
    순서와 수치는 `.claude/skills/paper-background/`. 색만 바꾸면 그냥 면이고, 결이 있어야 종이다
  - **바탕에 전면 모눈은 깔지 않는다**(2026-10-25). 바탕이 조용해야 그 위에 손으로 그린 선이
    먼저 읽힌다. 격자가 필요한 자리는 글이 올라가는 면의 괘선뿐이고 그건 손으로 긋는다
- 서체: **둘.** 기본은 **SUIT**, 그림일기 종이 안쪽만 손글씨 **그리운X국한박 사랑스러운**(`font.hand`,
  2026-10-25). 손글씨를 종이 밖으로 내보내지 않는다 - 화면 전체가 손글씨면 읽기가 피곤해진다
  (`hand-drawn-ui` 4장). 손글씨는 **한글 2,780자뿐**이라 없는 글자는 시스템 폰트로 떨어진다
  - 굵기는 `fontWeight` 가 아니라 패밀리로 고른다(RN 제약, `app/INSTALL.md`).
    손글씨는 굵기가 하나뿐이라 종이 안의 위계는 **크기와 색**으로 만든다
- 토큰의 진실: `app/src/shared/theme/tokens.ts`. **색은 코드가 진실이다** - Figma 시안(복숭아)과
  갈라져 있고 그 방향은 의도된 것이다(figma-workflow 4장). 레이아웃·구조는 여전히 시안이 진실이다.
- 동작하는 프로토타입: `docs/screen/prototype.html` (10화면 전부. 브라우저에서 바로 열린다)

## 글쓰기 규칙 (문서, 주석, 커밋 메시지, 대화 전부)

- **em dash(—) 금지. 하이픈(-)을 쓴다.** 붙임표가 필요하면 ` - `.
- en dash(–)도 쓰지 않는다. 범위는 `1~500자`, `-3 ~ +3`처럼 물결로 적는다.

## 기능 구현의 완료

코드만 고치고 끝내지 않는다. **프로젝트 스킬 4-2장(완료 정의)** 의 9개 항목 - 테스트, SQL, API 명세, 도메인 현행 문서, `docs/BOARD.md`, `docs/INDEX.md`, `CHANGELOG.md`, 화면 문서 - 를 같은 커밋에 넣는다. 종료 전 hook이 docs 미갱신을 한 번 잡아준다.

## 즉시 금지 (스킬을 읽기 전에도 적용)

- **운영·스테이징 DB 접속·SQL 실행 금지.** 로컬(`localhost` · `jellydiary` · `jelly` 계정)은
  `sql/patch/*.sql` 실행과 확인용 읽기 쿼리에 한해 허용한다(ADR `docs/adr/2026-10-24-로컬-DB-실행-허용.md`).
  스키마의 진실은 여전히 `sql/patch/` 파일과 `docs/db/` 문서다 - DB 를 먼저 고치지 않는다.
  로컬이어도 `DROP`·`TRUNCATE`·`DELETE` 는 먼저 말하고 실행한다
- 시크릿 커밋 금지: `.env`, `*.jks`, `*.p8`, 서비스 계정 JSON
- `EXPO_PUBLIC_*` 에 비밀값 금지 (앱 번들에 평문으로 박힌다)
