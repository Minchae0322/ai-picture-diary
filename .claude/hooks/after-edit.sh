#!/usr/bin/env bash
# 자바 파일이 바뀌었을 때만 컴파일 (harness 1층)
input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // empty')
case "$file" in
  *.java) ;;
  *) exit 0 ;;
esac
root=$(git rev-parse --show-toplevel) || exit 0
cd "$root/api" || exit 0
[ -x ./gradlew ] || { echo "gradlew 없음: cd api && gradle wrapper 먼저" >&2; exit 0; }
if ! ./gradlew -q compileJava compileTestJava 2>&1 | tail -30; then
  echo "컴파일 실패. 위 오류를 고친 뒤 계속하세요." >&2
  exit 2
fi
