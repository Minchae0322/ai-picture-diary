# ai-picture-diary

하루를 한 줄로 적으면 AI가 감정을 읽어 **날씨**로 보여주는 그림일기.

## 요약

| 항목 | 내용 |
|---|---|
| 제품 | 한 줄 일기와 감정을 날씨로 표현하는 AI 그림일기 |
| 현재 상태 | 개발 준비 단계. 제품 정의는 임시이며, 애플리케이션 코드는 아직 없습니다. |
| 규칙 관리 | 프로젝트 규칙과 범용 규칙을 `.claude/skills/`에서 관리합니다. |
| 시작 순서 | `CLAUDE.md` → 프로젝트 스킬 → 작업에 맞는 범용 스킬 |

**목차** - 아래 링크를 누르면 해당 항목으로 이동합니다.

| 항목 | 내용 |
|---|---|
| [시작하기](#시작하기) | 처음 읽을 문서와 순서 |
| [폴더 구조](#폴더-구조) | 주요 파일과 스킬 구성 |
| [규칙 관리](#규칙-관리) | 프로젝트 규칙과 범용 규칙의 구분 |
| [작업별 안내](#작업별-안내) | [디자인](#디자인) · [프론트엔드](#프론트엔드) · [백엔드](#백엔드) · [AI](#ai) · [배포 및 문서](#배포-및-문서) |
| [규칙 수정](#규칙-수정) | 수정 위치와 동기화 방법 |
| [주의사항](#주의사항) | 작업 전 확인할 금지 사항 |
| [남은 작업](#남은-작업) | 개발 준비 체크리스트 |

## 시작하기

1. **[CLAUDE.md](CLAUDE.md)** - 경로, 빌드 명령, 즉시 금지 사항을 확인합니다.
2. **[프로젝트 스킬](.claude/skills/ai-picture-diary/SKILL.md)** - 제품의 도메인 어휘, 불변 규칙, 확정 사항을 읽습니다.
3. **[작업별 안내](#작업별-안내)** - 하려는 작업에 해당하는 범용 스킬을 읽습니다.

여러 스킬이 해당하면 모두 읽습니다. 예를 들어 **일기 목록 API에 페이징 추가**는 `api-design`, `jpa-query-optimization`, `test-writing-guide`를 함께 확인합니다.

> 제품 정의가 확정되면 README의 소개와 프로젝트 스킬의 **1. 제품이 무엇인가**를 함께 수정합니다.

## 폴더 구조

```text
ai-picture-diary/
├── README.md                     프로젝트 소개와 작업 안내
├── CLAUDE.md                     작업 시작 시 읽는 기본 지침
└── .claude/
    ├── README.md                 스킬 배치와 갱신 방법
    ├── check-skills.py           스킬 frontmatter 검사기
    └── skills/
        ├── ai-picture-diary/     프로젝트 전용 규칙
        │   └── SKILL.md
        ├── api-design/           API 설계 규칙
        ├── ddd-spring/           백엔드 구조 규칙
        ├── design-system/        디자인 토큰과 프리셋
        └── ...                   작업별 범용 스킬
```

위 구조는 주요 파일만 표시했습니다. 아래 안내의 스킬 링크는 `.claude/skills/<스킬 이름>/`의 파일로 연결됩니다. 배치와 갱신에 관한 자세한 설명은 [.claude/README.md](.claude/README.md)를 참고하세요.

| 스킬 내부 파일 | 용도 |
|---|---|
| `SKILL.md` | 먼저 읽을 규칙과 절차 |
| `reference.md` | 필요할 때 확인할 예시와 근거 |
| `presets/` | 프로젝트에 맞게 선택할 설정 |
| `templates/` | 복사해서 사용할 템플릿 |

스킬마다 포함된 파일은 다를 수 있습니다. **`SKILL.md`부터 읽고**, 필요한 자료를 이어서 확인합니다.

## 규칙 관리

| 구분 | 담는 내용 | 수정 위치 |
|---|---|---|
| **프로젝트 스킬** | 이 제품의 도메인, 확정 사항, 금지 사항 | 이 저장소의 `ai-picture-diary/SKILL.md` |
| **범용 스킬** | 다른 프로젝트에서도 쓰는 판단 기준과 절차 | 원본 [dev-skills](https://github.com/Minchae0322/dev-skills) 저장소 |

읽는 순서는 **`CLAUDE.md` → 프로젝트 스킬 → 범용 스킬**입니다. 충돌하면 **프로젝트 스킬이 우선**합니다.

규칙을 어디에 둘지는 **“다음 프로젝트에서도 이 규칙이 맞는가?”**로 판단합니다.

| 예시 | 구분 |
|---|---|
| 트랜잭션 경계는 비즈니스 로직에 맞게 정한다 | 범용 규칙 |
| 일기 저장과 감정 분석은 트랜잭션을 나눈다 | 프로젝트 규칙 |
| 한 줄 일기는 200자로 제한한다 | 프로젝트 규칙 |

위 내용은 구분을 설명하는 예시이며, 제품의 확정 사항은 프로젝트 스킬에서 확인합니다.

## 작업별 안내

### 디자인

새 화면이나 컴포넌트는 **기본 원칙 → 디자인 시스템 → 프리셋** 순서로 확인합니다.

| 순서 | 스킬 | 확인할 내용 |
|---|---|---|
| 1 | [ui-fundamentals](.claude/skills/ui-fundamentals/SKILL.md) | 간격, 라운드, 시각 계층, 대비, 반응형, 화면과 컴포넌트 상태 |
| 2 | [design-system](.claude/skills/design-system/SKILL.md) | 디자인 토큰, 버튼 크기, 다크 모드, 모바일·데스크톱 우선순위 |
| 3 | [프리셋](.claude/skills/design-system/presets/) | 프로젝트에 적용할 화면 스타일 |

| 프리셋 | 특징 | 적합한 화면 |
|---|---|---|
| `soft-modern.md` | 부드러운 라운드와 은은한 그림자 | 일반 앱, SaaS의 기본값 |
| `glass-depth.md` | 반투명 레이어와 블러 | 미디어, 대시보드, 오버레이 |
| `clear-glass.md` | 투명한 채움과 가장자리 굴절 | 어둡고 고정된 배경 |

프리셋은 **하나만 선택하고 섞지 않습니다.** `clear-glass-demo.html`에서는 굴절 값을 직접 조절해 볼 수 있습니다.

Figma 작업은 [figma-workflow](.claude/skills/figma-workflow/SKILL.md)를 먼저 읽습니다. 시안에 없는 반응형, 상태, 다크 모드, 경계값도 확인합니다.

> Figma의 색상도 대비 검증이 필요합니다. 기준에 미달하면 코드에서 수정하고, `fix:` 주석에 원본 값과 측정치를 남긴 뒤 디자이너에게 전달합니다. 검증 방법은 `ui-fundamentals` 5장을 참고하세요.

### 프론트엔드

| 작업 | 스킬 |
|---|---|
| 컴포넌트·훅·타입, 폴더 구조, 리팩터링 | [frontend-architecture](.claude/skills/frontend-architecture/SKILL.md) |
| 상태 관리, 캐시, 무효화, 낙관적 업데이트 | [frontend-state](.claude/skills/frontend-state/SKILL.md) |
| API 호출, 토큰 갱신, 에러 처리 | [frontend-api-client](.claude/skills/frontend-api-client/SKILL.md) |
| React Native / Expo | [expo-app-conventions](.claude/skills/expo-app-conventions/SKILL.md) |

Expo 작업은 프론트엔드 스킬 세 개를 먼저 읽고, 모바일에서 달라지는 규칙을 적용합니다.

### 백엔드

| 작업 | 스킬 |
|---|---|
| 도메인·기능, 패키지, 엔티티·서비스 책임 | [ddd-spring](.claude/skills/ddd-spring/SKILL.md) |
| 엔드포인트, 응답, 에러 코드, 페이징 | [api-design](.claude/skills/api-design/SKILL.md) |
| 로그인, 토큰, 401/403 | [spring-auth](.claude/skills/spring-auth/SKILL.md) |
| 테이블·컬럼·인덱스, 마이그레이션 SQL | [db-schema-and-migration](.claude/skills/db-schema-and-migration/SKILL.md) |
| 트랜잭션, 락, 동시성, 중복 요청 | [transaction-and-concurrency](.claude/skills/transaction-and-concurrency/SKILL.md) |
| 느린 쿼리, N+1, 인덱스 | [jpa-query-optimization](.claude/skills/jpa-query-optimization/SKILL.md) |
| 외부 API, 타임아웃, 서킷 브레이커 | [external-api-client](.claude/skills/external-api-client/SKILL.md) |
| 스케줄러·배치, cron, 재처리 | [batch-and-scheduler](.claude/skills/batch-and-scheduler/SKILL.md) |
| 파일·이미지 업로드, 스토리지, 썸네일 | [file-upload-storage](.claude/skills/file-upload-storage/SKILL.md) |
| 푸시·이메일·SMS, 수신 동의 | [notification](.claude/skills/notification/SKILL.md) |
| 환경변수, 시크릿, 프로파일 | [config-and-secrets](.claude/skills/config-and-secrets/SKILL.md) |
| 로그, traceId/MDC | [logging-observability](.claude/skills/logging-observability/SKILL.md) |
| 테스트 | [test-writing-guide](.claude/skills/test-writing-guide/SKILL.md) |
| PR 리뷰 | [spring-code-review](.claude/skills/spring-code-review/SKILL.md) |
| 장애 추적·보고서 | [rca-procedure](.claude/skills/rca-procedure/SKILL.md) |
| ArchUnit, Git hook, 정적 분석 | [harness](.claude/skills/harness/SKILL.md) |

### AI

| 작업 | 스킬 |
|---|---|
| LLM 연동, 토큰 상한, 프롬프트 파일 | [llm-integration](.claude/skills/llm-integration/SKILL.md) |
| 프롬프트 수정, 모델 교체, 품질 평가 | [prompt-and-eval](.claude/skills/prompt-and-eval/SKILL.md) |
| 문서 기반 답변, 임베딩, 벡터 검색 | [rag-pipeline](.claude/skills/rag-pipeline/SKILL.md) |

> 프롬프트 수정 전에는 평가 셋을 준비합니다. 이유와 절차는 `prompt-and-eval` 0장을 참고하세요.

### 배포 및 문서

| 작업 | 스킬 |
|---|---|
| CI/CD, Dockerfile, 배포·롤백 | [deploy-pipeline](.claude/skills/deploy-pipeline/SKILL.md) |
| 앱 스토어 등록, 심사 대응 | [app-store-release](.claude/skills/app-store-release/SKILL.md) |
| `docs/` 구조와 문서 위치 | [deliverable-structure](.claude/skills/deliverable-structure/SKILL.md) |
| 도메인 비즈니스 로직 문서 | [deliverable-write](.claude/skills/deliverable-write/SKILL.md) |
| 코드 변경 후 문서 동기화 | [deliverable-sync](.claude/skills/deliverable-sync/SKILL.md) |
| 이슈·주간보고 정리 | [report-style](.claude/skills/report-style/SKILL.md) |

## 규칙 수정

- **제품 전용 규칙**은 [프로젝트 스킬](.claude/skills/ai-picture-diary/SKILL.md)에서 직접 수정합니다.
- **범용 규칙**은 [dev-skills](https://github.com/Minchae0322/dev-skills)에서 수정한 뒤 다시 설치합니다. 이 저장소에서 직접 고치면 다음 동기화 때 덮어써집니다.

원본 저장소가 없다면 먼저 복제합니다.

```bash
git clone https://github.com/Minchae0322/dev-skills ../dev-skills
```

프로젝트 루트에서 동기화하고 frontmatter를 검사합니다. 아래 설치 명령은 Bash 환경에서 실행합니다.

```bash
../dev-skills/install.sh . backend docs mobile frontend infra ai
python3 .claude/check-skills.py .
```

규칙이 맞지 않으면 먼저 논의합니다. 반복되는 예외는 규칙 자체를 수정할 신호입니다.

## 주의사항

- **DB 접속·SQL 실행 금지**: 환경과 관계없이 스키마 변경은 SQL 파일과 문서로 작성하고, 실행은 사람이 합니다.
- **시크릿 커밋 금지**: `.env`, `*.jks`, `*.p8`, 서비스 계정 JSON, `google-services.json`을 커밋하지 않습니다.
- **범용 스킬 직접 수정 금지**: 원본 저장소에서 수정한 뒤 동기화합니다.
- **프리셋 혼용 금지**: 한 화면에서 서로 다른 프리셋을 섞지 않습니다.
- **규칙이 맞지 않으면 논의**: 말없이 어기거나, 명백히 맞지 않는 규칙을 기계적으로 따르지 않습니다.

## 남은 작업

- [ ] [프로젝트 스킬](.claude/skills/ai-picture-diary/SKILL.md)의 `{{...}}` 채우기: 도메인 어휘, 불변 규칙, 확정 사항
- [ ] [CLAUDE.md](CLAUDE.md)의 `{{...}}` 채우기: 패키지 경로, 빌드 명령
- [ ] 애플리케이션 코드 추가
- [ ] `docs/` 초기 구성: `deliverable-structure`의 템플릿 참고

[요약과 목차로 돌아가기](#요약)
