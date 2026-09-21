# .claude/skills

## 배치

```
skills/
├── ai-picture-diary/    ★ 프로젝트 스킬. 최상위에 둔다 (아래 "왜 최상위인가")
├── backend/   (16)
├── design/    (3)
├── frontend/  (3)
├── mobile/    (2)
├── ai/        (3)
├── infra/     (1)
└── docs/      (4)
```

영역 폴더는 **사람이 찾기 쉬우라고** 나눈 것이다. 스킬의 이름은 **폴더 경로가 아니라 맨 안쪽 폴더 이름**이다. `backend/api-design/SKILL.md`의 이름은 `api-design`이고, 다른 스킬에서 부를 때도 `api-design`이다.

**이름은 영역을 넘어 전부 달라야 한다.** `design/design-system`과 `frontend/design-system`을 동시에 둘 수 없다.

## 왜 프로젝트 스킬만 최상위인가

공식 문서는 `.claude/skills/<이름>/SKILL.md` 한 단계만 예로 든다. **여러 단계 중첩이 항상 자동 로드되는지는 문서에 명시돼 있지 않다.**

그래서 진입점인 프로젝트 스킬(`ai-picture-diary`)은 확실히 로드되는 최상위에 두었다. 이게 로드되면 나머지는 그 안의 라우팅 표를 보고 읽게 된다.

### 중첩이 동작하는지 확인하는 법

Claude Code를 이 저장소에서 열고 물어본다.

```
/skills
```

또는 그냥 "`api-design` 스킬 읽어줘"라고 시켜 본다. 못 찾으면 아래로 평탄화한다.

### 평탄화 (중첩이 안 될 때)

```bash
cd .claude/skills
for d in backend design frontend mobile ai infra docs; do
  [ -d "$d" ] && mv "$d"/*/ . && rmdir "$d"
done
```

Windows PowerShell:

```powershell
cd .claude\skills
'backend','design','frontend','mobile','ai','infra','docs' | % {
  if (Test-Path $_) { Get-ChildItem $_ -Directory | Move-Item -Destination .; Remove-Item $_ }
}
```

이름이 전부 다르므로 충돌 없이 평탄해진다.

## 두 층

| 층 | 어디에 | 고치는 곳 |
|---|---|---|
| 프로젝트 스킬 | `ai-picture-diary/` | **여기서 바로** |
| 범용 스킬 | 영역 폴더 안 전부 | [dev-skills](https://github.com/Minchae0322/dev-skills)에서 고치고 다시 받는다 |

읽는 순서: `CLAUDE.md` → `ai-picture-diary` → 거기서 지정한 범용 스킬. 충돌하면 프로젝트 스킬이 이긴다.

## 갱신

```bash
git clone https://github.com/Minchae0322/dev-skills ../dev-skills
../dev-skills/install.sh . backend docs mobile frontend infra ai
python3 .claude/check-skills.py .
```

`install.sh`는 **평탄하게** 설치한다. 받은 뒤 영역 폴더로 다시 옮기거나, 평탄한 채로 두어도 동작에는 차이가 없다.

## 검사

```bash
python3 .claude/check-skills.py .
```

모든 `SKILL.md`의 frontmatter를 파싱하고 `name`이 폴더 이름과 같은지 본다. 중첩 깊이와 무관하게 동작한다.
