# ai-picture-diary

하루를 한 줄로 적으면 AI가 감정을 읽어 **날씨**로 보여주는 그림일기.

> 제품 정의는 아직 임시입니다. 확정되면 이 문단과 `.claude/skills/ai-picture-diary/SKILL.md` 1장을 같이 고칩니다.

---

## 처음 오셨다면

이 저장소는 **규칙을 문서가 아니라 스킬 파일로 관리**합니다. Claude Code가 작업 종류에 맞는 스킬을 자동으로 읽고, 사람도 같은 파일을 읽습니다. 규칙이 코드 옆에 있으니 PR 리뷰에서 "왜 이렇게 했냐"를 반복하지 않습니다.

세 단계만 하시면 됩니다.

1. **`CLAUDE.md`를 읽습니다.** 20줄짜리입니다. 경로, 빌드 명령, 즉시 금지 사항만 있습니다.
2. **`.claude/skills/ai-picture-diary/SKILL.md`를 읽습니다.** 이 제품의 도메인 어휘, 불변 규칙, 확정 사항. 여기가 출발점입니다.
3. **하려는 작업에 맞는 범용 스킬을 읽습니다.** 아래 [작업별 안내](#작업별-어디를-보나)에서 찾으시면 됩니다.

Claude에게 시킬 때도 따로 지시할 필요 없습니다. "일기 목록 API 만들어줘"라고 하면 `ai-picture-diary` → `api-design` → `ddd-spring` 순으로 알아서 읽습니다.

---

## 폴더 구조

```
ai-picture-diary/
├── README.md                  이 파일
├── CLAUDE.md                  ★ 항상 로드된다. 얇게 유지한다
├── .claude/
│   ├── README.md              스킬 배치와 갱신 방법
│   ├── check-skills.py        스킬 frontmatter 검사기
│   └── skills/
│       ├── ai-picture-diary/  ★ 프로젝트 스킬 - 이 저장소의 것. 여기서 시작한다
│       │   └── SKILL.md
│       │
│       ├── backend/   (16)    api-design, ddd-spring, spring-auth, ...
│       ├── design/    (3)     ui-fundamentals, design-system, figma-workflow
│       ├── frontend/  (3)     frontend-architecture, frontend-state, frontend-api-client
│       ├── mobile/    (2)     expo-app-conventions, app-store-release
│       ├── ai/        (3)     llm-integration, prompt-and-eval, rag-pipeline
│       ├── infra/     (1)     deploy-pipeline
│       └── docs/      (4)     deliverable-*, report-style
│
└── (코드는 아직 없습니다)
```

영역 폴더는 **사람이 찾기 쉬우라고** 나눈 것입니다. 스킬을 부를 때는 경로가 아니라 **맨 안쪽 폴더 이름**을 씁니다 - `backend/api-design/`은 그냥 `api-design`입니다. 그래서 이름은 영역을 넘어 전부 달라야 합니다.

프로젝트 스킬만 최상위에 둔 이유와, 중첩이 동작하지 않을 때 평탄화하는 방법은 `.claude/README.md`에 있습니다.

각 스킬 폴더는 이렇게 생겼습니다.

```
design/design-system/
├── SKILL.md        규칙만. 짧게 유지한다 (100~150줄)
├── reference.md    예시와 이유. 필요할 때만 읽는다
├── presets/        갈아끼우는 값
└── templates/      복사해 쓰는 파일
```

**`SKILL.md`부터 읽고, 값이나 예시가 필요할 때 `reference.md`를 엽니다.**

---

## 규칙은 두 층입니다

| 층 | 어디에 | 무엇이 | 다른 프로젝트에서 |
|---|---|---|---|
| **프로젝트 스킬** | `.claude/skills/ai-picture-diary/` | 이 제품의 도메인·확정 사항·금지 | 안 씁니다 |
| **범용 스킬** | `.claude/skills/` 나머지 | 어디서나 맞는 판단 기준과 절차 | 그대로 씁니다 |

읽는 순서는 **`CLAUDE.md` → 프로젝트 스킬 → 범용 스킬**이고, 충돌하면 **프로젝트 스킬이 이깁니다.**

왜 나누냐면, 섞으면 범용 스킬에 이 제품의 값이 박히고 다음 프로젝트에서 그 줄이 틀린 규칙이 되기 때문입니다. 판단 기준은 한 문장입니다.

> **다음 프로젝트에서도 이 줄이 맞는가?**

| 예 | 어디 |
|---|---|
| "트랜잭션 경계는 비즈니스 로직마다 다르니 항상 묻고 정한다" | 범용 |
| "일기 저장과 감정 분석은 트랜잭션을 나눈다" | 프로젝트 |
| "커서 페이징은 count 쿼리를 쓰지 않는다" | 범용 |
| "한 줄 일기는 200자다" | 프로젝트 |

---

## 작업별 어디를 보나

### 디자인 · 화면

`.claude/skills/design/`

새 화면이나 컴포넌트를 만든다면 **이 순서**입니다.

| 순서 | 스킬 | 무엇을 정해주나 |
|---|---|---|
| 1 | `design/ui-fundamentals` | 스타일과 무관하게 **항상 맞는 원칙**. 중첩 라운드 공식(안쪽 = 바깥 - 여백), 4px 간격 스케일, 시각 계층, 대비 기준(본문 4.5:1), 상태 5종(기본·호버·포커스·비활성·로딩), 터치 타깃, 반응형 기본 구조, 로딩/빈/에러 화면 |
| 2 | `design/design-system` | **프로젝트마다 달라지는 값**. 토큰 3계층, 버튼 크기 체계(small 32 / medium 40 / large 48 / xlarge 56), 다크 모드, 주 타깃(모바일 우선/데스크톱 우선) |
| 3 | `design/design-system/presets/*.md` | 분위기. 아래 참고 |

**프리셋**은 화면의 재질을 통째로 정합니다. 하나만 고르고 **섞지 않습니다.**

| 프리셋 | 성격 | 어울리는 곳 |
|---|---|---|
| `soft-modern.md` | 부드러운 라운드, 낮은 대비, 은은한 그림자 | 기본값. 앱·SaaS 대부분 |
| `glass-depth.md` | 반투명 레이어 + 블러. 젖빛 유리 | 미디어, 대시보드, 오버레이 |
| `clear-glass.md` | 채움 0. 가장자리에서만 굴절하는 맑은 유리 | 어둡고 고정된 배경 전용 |

`clear-glass-demo.html`을 브라우저로 열면 슬라이더로 굴절 값을 직접 만져볼 수 있습니다.

Figma 시안을 받았거나 Figma에 그려야 하면 **`design/figma-workflow`**를 먼저 엽니다. 어떤 Figma 도구를 언제 쓰는지, 시안에 없는 것(반응형·상태 5종·다크 모드·경계값)을 어떻게 채우는지가 있습니다.

> **디자인에서 가장 자주 나는 사고**는 Figma 색을 그대로 옮겼다가 대비가 미달하는 것입니다. `ui-fundamentals` 5장에 검증 방법이 있고, 어긋나면 **코드에서 고치고 `fix:` 주석으로 원본 값과 측정치를 남긴 뒤** 디자이너에게 전달합니다.

### 프론트엔드 코드

`.claude/skills/frontend/`

| 하려는 일 | 스킬 |
|---|---|
| 컴포넌트·훅·타입 작성, 폴더 구조, 리팩터링 | `frontend-architecture` |
| 상태를 어디 둘지, 캐시, 무효화, 낙관적 업데이트 | `frontend-state` |
| API 호출, 토큰 갱신, 에러 처리 | `frontend-api-client` |
| React Native / Expo 코드 | `mobile/expo-app-conventions` (위 셋을 먼저 읽고 달라지는 절만 덮어씁니다) |

### 백엔드

`.claude/skills/backend/`

| 하려는 일 | 스킬 |
|---|---|
| 새 도메인·기능, 패키지 배치, 엔티티/서비스 책임 | `ddd-spring` |
| 엔드포인트, 응답 포맷, 에러 코드, 페이징 | `api-design` |
| 로그인, 토큰, 401/403 | `spring-auth` |
| 테이블·컬럼·인덱스 변경, 마이그레이션 SQL | `db-schema-and-migration` |
| 트랜잭션 경계, 락, 동시성, 중복 요청 | `transaction-and-concurrency` |
| 쿼리 느림, N+1, 인덱스 | `jpa-query-optimization` |
| 외부 API 호출, 타임아웃, 서킷 브레이커 | `external-api-client` |
| 스케줄러·배치, cron, 재처리 | `batch-and-scheduler` |
| 파일·이미지 업로드, 스토리지, 썸네일 | `file-upload-storage` |
| 푸시·이메일·SMS, 수신 동의 | `notification` |
| yml·환경변수·시크릿·프로파일 | `config-and-secrets` |
| 로그, traceId/MDC | `logging-observability` |
| 테스트 | `test-writing-guide` |
| PR 리뷰 | `spring-code-review` |
| 장애 추적, 장애 보고서 | `rca-procedure` |
| ArchUnit, git hook, 정적 분석 | `harness` |

### AI

`.claude/skills/ai/`

| 하려는 일 | 스킬 |
|---|---|
| LLM 호출 붙이기, 토큰 상한, 프롬프트 파일 | `llm-integration` |
| 프롬프트 수정, 모델 교체, 품질 판단 | `prompt-and-eval` |
| 문서 기반 답변, 임베딩, 벡터 검색 | `rag-pipeline` |

> **프롬프트를 고칠 때는 평가 셋 없이 고치지 않습니다.** `prompt-and-eval` 0장에 이유가 있습니다.

### 배포 · 문서

`.claude/skills/infra/`, `.claude/skills/mobile/`, `.claude/skills/docs/`

| 하려는 일 | 스킬 |
|---|---|
| CI/CD, Dockerfile, 배포·롤백 | `deploy-pipeline` |
| 앱 스토어 등록, 심사 리젝 | `app-store-release` |
| `docs/` 구조, 문서 위치 판단 | `deliverable-structure` |
| 도메인 비즈니스 로직 문서 작성 | `deliverable-write` |
| 코드 변경 후 문서 동기화 | `deliverable-sync` |
| 이슈·주간보고를 개조식으로 정리 | `report-style` |

여러 개가 걸리면 **전부 읽습니다.** 예를 들어 "일기 목록 API에 페이징 추가"는 `api-design`(페이징 규칙) + `jpa-query-optimization`(커서 인덱스) + `test-writing-guide` 셋 다입니다.

---

## 규칙을 고치고 싶을 때

**범용 스킬을 이 저장소에서 직접 고치지 않습니다.** 고쳐도 다음 동기화 때 덮어써집니다.

| 고칠 것 | 어디서 |
|---|---|
| 이 제품에만 해당하는 규칙 | `.claude/skills/ai-picture-diary/SKILL.md` - 여기서 바로 |
| 어디서나 맞는 규칙 | [dev-skills](https://github.com/Minchae0322/dev-skills)에서 고치고 아래로 다시 받기 |

```bash
git clone https://github.com/Minchae0322/dev-skills ../dev-skills
../dev-skills/install.sh . backend docs mobile frontend infra ai
python3 .claude/check-skills.py .      # frontmatter 검사
```

규칙이 안 맞는다고 느끼면 **말없이 어기지 말고 먼저 얘기해 주세요.** 한 번이면 예외, 반복되면 스킬을 고쳐야 한다는 신호입니다.

---

## 하지 말 것

- **DB 접속·SQL 실행** (어떤 환경이든). 스키마 변경은 SQL 파일과 문서로만 만들고 실행은 사람이 합니다
- 시크릿 커밋: `.env`, `*.jks`, `*.p8`, 서비스 계정 JSON, `google-services.json`
- 범용 스킬을 이 저장소에서 직접 수정
- 프리셋 섞어 쓰기 (한 화면에 `soft-modern` 카드와 `clear-glass` 카드)
- 규칙이 안 맞는데 말없이 어기기 / 명백히 안 맞는데 기계적으로 따르기

---

## 아직 안 된 것

- [ ] `.claude/skills/ai-picture-diary/SKILL.md`의 `{{...}}` 채우기 - 도메인 어휘, 불변 규칙, 확정 사항
- [ ] `CLAUDE.md`의 `{{...}}` 채우기 - 패키지 경로, 빌드 명령
- [ ] 코드 올리기
- [ ] `docs/` 부트스트랩 (`deliverable-structure`의 `templates/` 참고)
