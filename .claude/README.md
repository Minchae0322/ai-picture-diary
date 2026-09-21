# .claude/skills

`dev-skills` 저장소(https://github.com/Minchae0322/dev-skills)에서 복사해 온 **범용 스킬** 모음.

## 두 층

| 층 | 어디에 | git |
|---|---|---|
| 범용 스킬 | `ai-picture-diary`를 제외한 전부 | 추적하지 않는다. `install.sh`로 받는다 |
| 프로젝트 스킬 | `ai-picture-diary/` | **추적한다.** 이 저장소의 것이다 |

읽는 순서: `CLAUDE.md` → `ai-picture-diary` → 거기서 지정한 범용 스킬.
충돌하면 프로젝트 스킬이 이긴다.

## 갱신

```bash
git clone https://github.com/Minchae0322/dev-skills ../dev-skills
../dev-skills/install.sh . backend docs mobile frontend infra ai
```

범용 스킬을 여기서 직접 고치지 않는다. `dev-skills`에서 고치고 다시 받는다.
