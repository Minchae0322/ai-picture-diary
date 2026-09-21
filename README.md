# ai-picture-diary

하루를 한 줄로 적으면 AI가 감정을 읽어 날씨로 보여주는 그림일기.

> 이 문단은 임시입니다. 제품 정의가 확정되면 `.claude/skills/ai-picture-diary/SKILL.md` 1장과 함께 고칩니다.

## 이 저장소에서 작업하기 전에

**`.claude/skills/ai-picture-diary/SKILL.md`를 먼저 읽습니다.**

읽는 순서는 `CLAUDE.md` → 프로젝트 스킬 → 거기서 지정한 범용 스킬이고, 충돌하면 프로젝트 스킬이 이깁니다.

## 스킬 구조

| 층 | 위치 | 성격 |
|---|---|---|
| 프로젝트 스킬 | `.claude/skills/ai-picture-diary/` | 이 제품의 도메인·확정 사항·금지. **이 저장소의 것** |
| 범용 스킬 (32개) | `.claude/skills/` 나머지 | 어디서나 맞는 판단 기준. [dev-skills](https://github.com/Minchae0322/dev-skills)에서 이식 |

범용 스킬은 **여기서 직접 고치지 않습니다.** `dev-skills`에서 고치고 다시 받습니다.

```bash
git clone https://github.com/Minchae0322/dev-skills ../dev-skills
../dev-skills/install.sh . backend docs mobile frontend infra ai
python3 .claude/check-skills.py .      # frontmatter 검사
```

## 영역별 스킬

| 영역 | 스킬 |
|---|---|
| backend | api-design, ddd-spring, spring-auth, db-schema-and-migration, transaction-and-concurrency, jpa-query-optimization, external-api-client, batch-and-scheduler, file-upload-storage, notification, config-and-secrets, logging-observability, test-writing-guide, spring-code-review, rca-procedure, harness |
| frontend | ui-fundamentals, design-system, frontend-architecture, frontend-state, frontend-api-client, figma-workflow |
| mobile | expo-app-conventions, app-store-release |
| ai | llm-integration, prompt-and-eval, rag-pipeline |
| infra | deploy-pipeline |
| docs | deliverable-structure, deliverable-write, deliverable-sync, report-style |

## 다음 할 일

- [ ] `.claude/skills/ai-picture-diary/SKILL.md`의 `{{...}}` 채우기 (도메인 어휘, 불변 규칙, 확정 사항)
- [ ] `CLAUDE.md`의 `{{...}}` 채우기 (패키지 경로, 빌드 명령)
- [ ] 실제 코드 올리기
