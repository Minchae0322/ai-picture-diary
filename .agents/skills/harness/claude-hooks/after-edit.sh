#!/usr/bin/env bash
# .claude/hooks/after-edit.sh - 자바 파일이 바뀌었을 때만 컴파일
input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // empty')
case "$file" in
  *.java) ;;
  *) exit 0 ;;
esac
cd "$(git rev-parse --show-toplevel)" || exit 0
if ! ./gradlew -q compileJava compileTestJava 2>&1 | tail -30; then
  echo "컴파일 실패. 위 오류를 고친 뒤 계속하세요." >&2
  exit 2    # exit 2 = Claude에게 오류를 돌려주고 스스로 고치게 한다
fi
