#!/usr/bin/env bash
# 종료 전: (1) 단위 테스트 + ArchUnit, (2) 코드만 고치고 문서를 안 고쳤는지 확인
root=$(git rev-parse --show-toplevel) || exit 0
cd "$root" || exit 0

changed=$(git status --porcelain)
code_changed=$(echo "$changed" | grep -E '^( M|\?\?|A |M ).*(api/src/main|app/src|app/app)/' | grep -cE '\.(java|tsx|ts)$')
[ "$code_changed" -eq 0 ] && exit 0

# 1층: 테스트 (wrapper가 있을 때만)
if [ -x api/gradlew ]; then
  (cd api && ./gradlew -q test 2>&1 | grep -E 'FAILED|tests completed|BUILD' | tail -20)
fi

# 2층: 산출물 갱신 확인. 한 세션에 한 번만 막는다
marker=".git/.docs-reminded"
docs_changed=$(echo "$changed" | grep -cE ' (docs/|CHANGELOG\.md)')
if [ "$docs_changed" -eq 0 ] && [ ! -f "$marker" ]; then
  touch "$marker"
  cat >&2 <<'MSG'
코드는 바뀌었는데 docs/ 와 CHANGELOG.md 가 그대로입니다.
프로젝트 스킬 4-2장(완료 정의)의 5~8번을 확인하세요.
  - docs/domain/<도메인>/<로직>-비즈니스로직.md  (동작이 바뀌었으면)
  - docs/BOARD.md  구현 현황 + 갱신 이력
  - docs/INDEX.md  신규 문서면 등록
  - CHANGELOG.md   Unreleased 한 줄
  - docs/api, docs/db, docs/screen  해당되면
갱신이 불필요한 변경이면 그 이유를 한 줄 말하고 다시 종료하면 통과합니다.
MSG
  exit 2
fi
exit 0
