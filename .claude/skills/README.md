# 스킬 목록

> `.claude/skills/<이름>/SKILL.md` **평면 구조만 등록된다.** 분류는 이 문서로 한다.

## 왜 폴더로 안 나누나
- 중첩(`backend/ddd-spring/SKILL.md`)은 **스킬로 등록되지 않는다.** 실험으로 확인(2026-09-21).
- 폴더명이 곧 스킬 id다. frontmatter의 `name`은 무시되고 폴더명이 이긴다.
- 그래서 폴더를 옮기면 트리거가 죽거나 이름이 바뀐다. **폴더는 평면, 분류는 이 표.**
- 새 스킬은 `.claude/skills/<kebab-이름>/SKILL.md`로 만든다. 하위 폴더(`reference.md`, `templates/`)는 자유.

## 프로젝트 (최우선)
| 스킬 | 언제 |
|---|---|
| `ai-picture-diary` | **모든 작업 전 맨 먼저.** 도메인 어휘, 불변 규칙, 확정 사항, 화면 인덱스 |

화면별 규칙·명세는 `ai-picture-diary/screens/` + `docs/screen/`.

## 백엔드 (스프링)
| 스킬 | 언제 |
|---|---|
| `ddd-spring` | 새 기능, 패키지 배치, 엔티티·서비스 책임 |
| `api-design` | 엔드포인트, 응답 포맷, 에러 코드, 페이징 |
| `spring-auth` | 로그인, JWT, 소셜, 401/403 |
| `transaction-and-concurrency` | 트랜잭션 경계, 락, 중복 요청 |
| `external-api-client` | 외부 HTTP 호출, 타임아웃, 서킷 |
| `batch-and-scheduler` | @Scheduled, 크론, 대량 처리 |
| `notification` | 푸시·이메일·SMS, 수신 동의 |
| `file-upload-storage` | 업로드, presigned URL, 썸네일 |
| `config-and-secrets` | 환경변수, yml, 프로파일, 시크릿 |
| `logging-observability` | 로그, traceId/MDC, 메트릭 |
| `spring-code-review` | 리뷰, PR 코멘트 |
| `test-writing-guide` | 테스트 작성·수정 |
| `rca-procedure` | 장애 추적, 포스트모템 |
| `harness` | ArchUnit, hook, 정적 분석 |

## DB · 쿼리
| 스킬 | 언제 |
|---|---|
| `db-schema-and-migration` | 테이블·컬럼·인덱스, 마이그레이션 SQL, ERD |
| `jpa-query-optimization` | 느린 쿼리, N+1, 실행계획 |

## AI
| 스킬 | 언제 |
|---|---|
| `llm-integration` | LLM 호출 구조, 비용 상한, 스트리밍 |
| `prompt-and-eval` | 프롬프트 수정, 모델 교체, 품질 판단 |
| `rag-pipeline` | 임베딩, 벡터 검색, 출처 표시 |

## 프론트엔드
| 스킬 | 언제 |
|---|---|
| `frontend-architecture` | 컴포넌트·훅·타입, 폴더 구조 |
| `frontend-state` | 상태 위치, 서버 데이터 캐시·무효화 |
| `frontend-api-client` | API 호출, 토큰 갱신, 에러 처리 |

## 디자인
| 스킬 | 언제 |
|---|---|
| `ui-fundamentals` | 여백·라운드·대비·상태 5종·반응형 원칙 |
| `design-system` | 토큰, 테마, 다크 모드, 프리셋 |
| `figma-workflow` | 시안 읽기·그리기, Code Connect |

## 모바일
| 스킬 | 언제 |
|---|---|
| `expo-app-conventions` | React Native / Expo 코드 |
| `app-store-release` | 스토어 등록, 심사 리젝 |

## 인프라 · 배포
| 스킬 | 언제 |
|---|---|
| `deploy-pipeline` | GitHub Actions, Dockerfile, 롤백 |

## 문서 · 보고
| 스킬 | 언제 |
|---|---|
| `deliverable-structure` | docs/ 구조, 문서 위치 판단 |
| `deliverable-write` | 도메인 비즈니스 로직 문서 작성 |
| `deliverable-sync` | 산출물 동기화, 커밋 반영 |
| `report-style` | 개조식 문체로 정리 |
