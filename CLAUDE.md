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
- 프리셋: **soft-modern** (브랜드만 젤리 바이올렛 `#6c5ce7`으로 교체)
- 토큰의 진실: `app/src/shared/theme/tokens.ts`. Figma 변수는 여기서 파생된다.

## 글쓰기 규칙 (문서, 주석, 커밋 메시지, 대화 전부)

- **em dash(—) 금지. 하이픈(-)을 쓴다.** 붙임표가 필요하면 ` - `.
- en dash(–)도 쓰지 않는다. 범위는 `1~500자`, `-3 ~ +3`처럼 물결로 적는다.

## 기능 구현의 완료

코드만 고치고 끝내지 않는다. **프로젝트 스킬 4-2장(완료 정의)** 의 9개 항목 - 테스트, SQL, API 명세, 도메인 현행 문서, `docs/BOARD.md`, `docs/INDEX.md`, `CHANGELOG.md`, 화면 문서 - 를 같은 커밋에 넣는다. 종료 전 hook이 docs 미갱신을 한 번 잡아준다.

## 즉시 금지 (스킬을 읽기 전에도 적용)

- 어떤 환경이든 DB 접속·SQL 실행 금지. 스키마 변경은 `sql/patch/` 파일과 `docs/db/` 문서로만
- 시크릿 커밋 금지: `.env`, `*.jks`, `*.p8`, 서비스 계정 JSON
- `EXPO_PUBLIC_*` 에 비밀값 금지 (앱 번들에 평문으로 박힌다)
