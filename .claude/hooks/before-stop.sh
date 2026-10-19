#!/usr/bin/env bash
# 종료 전: (1) 단위 테스트 + ArchUnit, (2) 문서 미갱신 확인, (3) 구성도 미갱신 확인
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

# 3층: 구성도 갱신 확인. 상자와 화살표가 바뀌는 변경에서만 운다
#   - 새 도메인 / 새 기술 컨텍스트 (api 바로 아래 폴더가 생김)
#   - 외부 연동·인증·큐·캐시·배치가 코드에 처음 등장
#   - 배포 토폴로지(CI, Dockerfile) 가 생김
#   - ADR 이 새로 쓰임 = 구조를 바꾸는 결정
arch_marker=".git/.arch-reminded"
arch_hit=""

# 기존 도메인에 파일이 하나 는 것은 아키텍처 변경이 아니다.
# HEAD 에 없던 최상위 컨텍스트 폴더가 생긴 경우에만 센다
known=$(git ls-tree -d --name-only HEAD api/src/main/java/com/jellydiary/ 2>/dev/null | xargs -r -n1 basename | sort -u)
now=$(echo "$changed" | grep -E '^(\?\?|A ) ?api/src/main/java/com/jellydiary/' \
  | grep -oE 'com/jellydiary/[a-z]+/' | cut -d/ -f3 | sort -u)
new_ctx=$(comm -13 <(echo "$known") <(echo "$now") 2>/dev/null)
[ -n "$new_ctx" ] && arch_hit="${arch_hit}새 도메인·기술 컨텍스트: $(echo "$new_ctx" | tr '\n' ' ')\n"

echo "$changed" | grep -qE '^(\?\?|A ) ?(\.github/workflows|Dockerfile|api/Dockerfile|compose)' \
  && arch_hit="${arch_hit}배포·CI 구성 파일이 생겼습니다\n"

echo "$changed" | grep -qE '^(\?\?|A ) ?docs/adr/' \
  && arch_hit="${arch_hit}ADR 이 새로 쓰였습니다 - 구조를 바꾸는 결정입니다\n"

# 코드에 처음 등장하는 외부 의존. 이미 있던 것은 세지 않는다
for probe in "RestClient|WebClient|HttpExchange:외부 HTTP 호출" \
             "SecurityFilterChain|OAuth2|JwtDecoder:인증" \
             "RedisTemplate|@Cacheable:캐시" \
             "@Scheduled|JobBuilder:배치·스케줄러" \
             "AmazonS3|S3Client|MinioClient:오브젝트 스토리지" \
             "FirebaseMessaging|ApnsClient:푸시"; do
  pat=${probe%%:*}; label=${probe##*:}
  staged=$(echo "$changed" | grep -E '^( M|M |A |\?\?).*api/src/main/.*\.java$' | awk '{print $NF}')
  [ -z "$staged" ] && continue
  if echo "$staged" | xargs -r grep -lE "$pat" 2>/dev/null | head -1 | grep -q .; then
    arch_hit="${arch_hit}${label} 가 코드에 등장했습니다\n"
  fi
done

if [ -n "$arch_hit" ] && [ ! -f "$arch_marker" ]; then
  touch "$arch_marker"
  {
    echo "아키텍처가 바뀐 것으로 보입니다. 시스템 구성도를 보세요."
    printf "%b" "$arch_hit"
    echo "  -> docs/시스템구성도.drawio (상자·화살표가 바뀌었으면 구성도를 갱신)"
    echo "구성도가 그대로여도 되는 변경이면 그 이유를 한 줄 말하고 다시 종료하면 통과합니다."
  } >&2
  exit 2
fi
exit 0
