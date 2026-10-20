#!/usr/bin/env bash
# .claude/hooks/before-stop.sh - 작업 종료 전 단위 테스트 + ArchUnit
cd "$(git rev-parse --show-toplevel)" || exit 0
git diff --quiet HEAD -- '*.java' && exit 0     # 자바 변경 없으면 통과
if ! ./gradlew -q test 2>&1 | grep -E "FAILED|tests completed|BUILD" | tail -20; then
  echo "테스트 실패. 결과를 확인하고 고친 뒤 종료하세요." >&2
  exit 2
fi
