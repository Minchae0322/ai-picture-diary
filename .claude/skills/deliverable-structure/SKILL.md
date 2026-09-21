---
name: deliverable-structure
description: 프로젝트 문서(docs/) 폴더를 만들거나 정리할 때 자동 적용. "docs 폴더", "문서 구조", "이 문서 어디에 둬", "문서 정리", "산출물 폴더" 요청이나 새 프로젝트에 docs/를 처음 만들 때 트리거. 폴더별 역할과 현행/이력 구분, 파일명 규칙, 무엇을 어디에 두는지, 부트스트랩 체크리스트. deliverable-sync와 deliverable-write가 파일 위치를 판단할 때도 이 문서를 따른다.
---

# 산출물 폴더 구조 (deliverable-structure)

## 목적
모든 프로젝트에 같은 모양으로 적용하는 `docs/` 표준. `deliverable-sync`와 `deliverable-write`는 이 구조를 전제로 동작하고, 새 프로젝트는 이 구조로 시작한다.
기본 규칙 하나: **파일을 놓을 자리는 "무엇에 대한 문서인가"(도메인)와 "언제까지 유효한가"(현행/이력)로 결정한다.**

## 언제 적용
- 새 프로젝트에 `docs/`를 처음 만들 때 (부트스트랩)
- 기존 `docs/`를 정리할 때
- `deliverable-sync`/`deliverable-write`가 파일 위치나 파일명을 판단할 때

> 문서의 **문체**(개조식, 종결어미, 수치 표기)는 `report-style`. 이 스킬은 무엇을 쓸지를 정한다.

## 표준 구조
```
<repo>/
├── README.md                  # 프로젝트 소개, 실행 방법. 상세는 docs/로 링크
├── CHANGELOG.md               # Keep a Changelog. 코드 변경 기록
├── CLAUDE.md                  # 에이전트 지침. 산출물 아님
└── docs/
    ├── INDEX.md               # 현행 문서 <-> 코드 경로 (sync가 읽음)
    ├── BOARD.md               # 동기화 상태, 미분류, 할 일 (sync가 씀)
    ├── README.md              # docs/ 안내 + 도메인 폴더 목록
    ├── _templates/            # 현행문서.md, 이력문서.md, api-명세.md, adr.md
    ├── guide/                 # 프로젝트 전반 가이드 (도메인 무관, 현행): 개발/환경-설정/빌드/배포-가이드, 브랜치-전략, 디렉터리-아키텍처
    ├── domain/<도메인>/        # 도메인별 산출물. 폴더명 = 코드 패키지명. README.md + 현행 문서 + 이력 문서
    ├── api/                   # 외부/프론트 전달 API 명세 (이력)
    ├── adr/                   # 설계 결정 기록 (이력)
    ├── incident/              # 장애 분석 (이력). rca-procedure 형식
    ├── release-notes/         # 배포 단위 기록 (이력). INDEX.md + v<버전>.md
    ├── ops/                   # 운영 문서 (현행): 배치 목록, 로그 정의, 큐 정리, 모니터링
    ├── erd/                   # 스키마 (현행). dbml
    ├── handoff/               # 인수인계, 타 팀 전달 (이력)
    └── assets/                # 이미지, drawio, pdf. 문서명 접두어
```

## 폴더별 역할
| 폴더 | 성격 | 누가 갱신 | 파일명 |
|---|---|---|---|
| `INDEX.md`, `BOARD.md` | 스킬용 메타 | deliverable-sync | 고정 |
| `_templates/` | 템플릿 | 사람 | 고정 |
| `guide/` | 현행 | 사람 (규칙 바뀔 때) | `<주제>-가이드.md` |
| `domain/<도메인>/` 현행 문서 | 현행 | deliverable-sync/write | `<로직>-비즈니스로직.md` |
| `domain/<도메인>/` 이력 문서 | 이력 | 사람 (작성 후 불변) | `YYYY-MM-DD-<제목>.md` |
| `api/` | 이력 | 사람 (전달 시점) | `YYYY-MM-DD-<기능>-API-명세.md` |
| `db/` | 이력 | 사람 + AI (db-schema-and-migration) | `YYYY-MM-DD-<변경>.md` + 실행 기록 |
| `batch/` | 현행 + 이력 | 사람 + AI (batch-and-scheduler) | `배치-목록.md`(현행) + `YYYY-MM-DD-<작업>.md`(1회성 실행 계획서) |
| `adr/` | 이력 | 사람 (결정 시점) | `YYYY-MM-DD-<결정>.md` |
| `incident/` | 이력 | 사람 (rca-procedure) | `YYYY-MM-DD-<장애>-장애분석.md` |
| `release-notes/` | 이력 | 사람 (배포 시점) | `v<버전>.md` + `INDEX.md` |
| `ops/` | 현행 | 사람 (운영 변경 시) | `<대상>-<종류>.md` |
| `erd/` | 현행 | 도구/사람 | `schema-*.dbml` |
| `handoff/` | 이력 | 사람 | `YYYY-MM-DD-<대상>-핸드오프.md` |
| `assets/` | 첨부 | 사람 | 문서명 접두어 |

## 어디에 둘지 결정하는 질문
1. 특정 도메인의 로직인가? 예 -> `domain/<도메인>/`. 아니오 -> 3번.
2. 도메인 현행 -> `domain/<도메인>/<로직>-비즈니스로직.md`. 도메인 이력 -> `domain/<도메인>/YYYY-MM-DD-<제목>.md`.
3. 도메인 무관이면 종류로: 규칙/절차 `guide/`, 외부 전달 API `api/`, 결정 이유 `adr/`, 장애 `incident/`, 배포 `release-notes/`, 운영 참조 목록/정의 `ops/`, 남에게 넘기는 묶음 `handoff/`.
4. 여러 도메인에 걸친 로직(인증, 알림, 공통 응답)은 `domain/common/` 또는 기능 이름 도메인 폴더(`domain/auth/`). `common`은 최후 수단.

## 파일명 규칙
- 한국어 kebab-case: `기사삭제요청-비즈니스로직.md`. 영어는 원어 그대로(`DB2-LIKE-쿼리-성능-개선`).
- 이력 문서는 `YYYY-MM-DD-` 접두어 필수. 현행 문서는 날짜 없음, 접미어로 종류 표시: `-비즈니스로직`, `-가이드`, `-정의서`, `-목록`.
- 도메인 폴더명은 코드 패키지명과 **철자·대소문자까지 동일**(`requestVideo`). kebab으로 바꾸지 않는다.
- 공백, 괄호, `(1)` 복사본 표시 금지. 첨부도 같다. 첨부는 `assets/<문서명>-<용도>.<ext>`.

## 문서 상단 메타
현행 문서만. 프론트매터 대신 제목 아래 인용 블록 2줄:
```markdown
> 도메인: `app/<패키지>` · 엔티티 `<Entity>`(테이블 `<table>`)
> 코드: <INDEX.md와 같은 글롭> · 기준 커밋: <hash> · 갱신: YYYY-MM-DD
```
이력 문서는 메타 없이 제목 아래 한 줄: `> 2026-07-20 · 장애 분석 · 관련 커밋 abc1234`.

## 기존 프로젝트에 적용할 때 (정리 순서)
한 번에 갈아엎지 않는다.

1. `INDEX.md`, `BOARD.md`, `_templates/`, `README.md`를 먼저 만든다. 파일 이동 없이도 sync/write가 돌아가야 한다.
2. `docs/<도메인>/`이 이미 있으면 `docs/domain/<도메인>/`으로 옮길지 결정. 링크가 많으면 옮기지 않고 `domain/` 생략 변형으로.
3. 루트의 가이드를 `guide/`로 `git mv`. 링크를 같이 고친다(`grep -rl "빌드-가이드" docs/`).
4. `YYYY-MM-DD-*-API-명세.md`, `*-프론트-전달*.md` -> `api/`; `*-장애분석.md` -> `incident/`; `*-핸드오프*.md`, `*-전달-프롬프트*.md` -> `handoff/`.
5. 패키지명과 다르게 갈라진 도메인 폴더(`request-video` / `requestVideo`)는 패키지명 쪽으로 합친다.
6. 사실상 현행 문서인 이력 문서(`*-비즈니스로직-이력.md`)는 `deliverable-write` 승격 절차로.
7. 각 단계를 별도 커밋(`docs: guide/ 정리`, `docs: api/ 분리`).

## 변형 허용
- `domain/` 계층 생략: 기존 `docs/<도메인>/` 프로젝트. `docs/README.md`에 "도메인 폴더는 루트 직속" 명시, INDEX.md 경로도 맞춘다.
- 소규모 프로젝트(도메인 3개 이하, 토이): `domain/`과 `adr/`만. 필요해질 때 추가.
- 프론트엔드: `domain/` 대신 `pages/` 또는 `features/`. 현행 문서는 `<페이지>-동작.md`. 나머지 동일.
- 모노레포: 각 서비스 루트에 이 구조 통째로. 루트 `docs/`에는 서비스 목록과 공통 ADR만.

## 이 스킬 폴더의 파일
`templates/` 안에 부트스트랩 파일이 전부 있다. 프로젝트에 붙일 때 그대로 복사한다.

| 파일 | 복사 위치 |
|---|---|
| `templates/docs-README.md` | `docs/README.md` |
| `templates/INDEX.md` | `docs/INDEX.md` |
| `templates/BOARD.md` | `docs/BOARD.md` (`last_synced_commit`을 HEAD로) |
| `templates/현행문서.md`, `이력문서.md`, `api-명세.md`, `adr.md` | `docs/_templates/` |

## 새 프로젝트 부트스트랩 체크리스트
- [ ] `docs/README.md` - 구조 요약 + 도메인 목록 표
- [ ] `docs/INDEX.md` - 빈 표 (헤더만)
- [ ] `docs/BOARD.md` - `last_synced_commit: <현재 HEAD>`
- [ ] `docs/_templates/` 4개
- [ ] `docs/guide/개발-가이드.md` - 커밋 규칙, CHANGELOG 규칙, 문서 파일명 규칙
- [ ] `CHANGELOG.md` - Keep a Changelog 헤더
- [ ] `CLAUDE.md`에 "문서 위치: docs/ (구조는 docs/README.md)" 한 줄
- [ ] 첫 도메인 현행 문서 1개 (`deliverable-write`)

## 하지 말 것
- 도메인 폴더와 종류 폴더 섞기(`docs/article-api/`). 도메인은 `domain/` 아래, 종류는 루트 아래.
- 현행 문서에 날짜 붙이기, 이력 문서에서 날짜 빼기. 도메인 폴더명을 패키지명과 다르게 짓기.
- 루트 `docs/`에 파일 바로 두기(README, INDEX, BOARD 제외).
- 로그, 덤프, 대용량 바이너리를 `docs/`에 두기. `.gitignore`에 `docs/**/*.log`.
- 한 번에 전부 옮기는 대규모 정리 커밋.

## 관련 스킬
- `deliverable-sync` 스킬 - INDEX/BOARD를 읽고 쓰는 절차
- `deliverable-write` 스킬 - 현행 문서 작성/승격 절차
- `rca-procedure` 스킬 - `incident/` 문서 형식

## 더 보기
- 이유, 예시, 상세 표, 참고 링크: `reference.md` (판단이 안 서거나 처음 적용할 때만 읽는다)
