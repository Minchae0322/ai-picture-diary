# deploy-pipeline - 참고

SKILL.md의 절 번호와 같은 순서.

## 0. 액션 버전 고정

액션의 최신 메이저 태그는 계속 올라간다(2026-09 확인 시점 `actions/checkout` v7, `actions/setup-java` v5 계열). **이 문서의 숫자를 믿지 말고 적용 시점에 각 리포지토리의 릴리스를 확인한다.**

고정 방법은 셋 중 하나다.

```yaml
- uses: actions/checkout@v7                   # 메이저 태그. 편하지만 태그가 움직인다
- uses: actions/checkout@v7.0.1               # 정확한 버전
- uses: actions/checkout@08eba0b27e820071cd993cb5d5c7cd52a3c1d9d1  # 커밋 SHA (권장)
```

서드파티 액션은 **커밋 SHA로 고정한다.** 태그는 작성자가 옮길 수 있고, 그 순간 남의 코드가 내 CI에서 시크릿에 접근한다. Dependabot을 켜면 SHA도 자동으로 갱신 PR이 온다.

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: "/"
    schedule: { interval: weekly }
```

## 1. CI 워크플로 해설

`workflows/ci.yml` 참고. 핵심만:

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true          # 같은 브랜치 이전 실행 취소
```

```yaml
permissions:
  contents: read                    # 기본을 최소로. 필요한 job에서만 올린다
```

```yaml
- uses: gradle/actions/setup-gradle@v4    # Gradle 캐시를 알아서 관리
```

- Gradle 캐시는 `setup-gradle`에 맡기는 편이 `actions/cache`를 직접 쓰는 것보다 안정적이다.
- 테스트 리포트는 실패해도 올라가야 하므로 `if: always()`.
- 단위 테스트와 통합 테스트를 다른 job으로 나누면 병렬로 돌고 실패 원인이 분명해진다. 다만 job마다 셋업 비용이 있으니 프로젝트 규모를 보고 정한다.

## 3. 환경과 승인

GitHub Environments는 리포지토리 Settings > Environments에서 만든다.

| 설정 | dev | prod |
|---|---|---|
| Required reviewers | 없음 | **1명 이상 필수** |
| Wait timer | 없음 | 선택 |
| Deployment branches | 모든 브랜치 | main 또는 태그만 |
| Secrets | dev용 | prod용 |

스테이징이 있는 프로젝트면 dev와 prod 사이에 같은 형태로 하나 더 만든다.

```yaml
jobs:
  deploy-prod:
    environment:
      name: prod                    # 이 한 줄이 승인 게이트를 건다
      url: https://api.example.com
```

`environment`를 지정한 job은 승인될 때까지 대기한다. 승인 기록이 배포 이력으로 남는다.

## 4. 시크릿

### 이미지에 남지 않게

```dockerfile
# 나쁜 예 - docker history에 그대로 보인다
ARG API_KEY
RUN ./configure --key=$API_KEY

# 좋은 예 - BuildKit secret mount, 레이어에 남지 않는다
RUN --mount=type=secret,id=api_key \
    ./configure --key=$(cat /run/secrets/api_key)
```

```yaml
- uses: docker/build-push-action@v6
  with:
    secrets: |
      api_key=${{ secrets.API_KEY }}
```

대부분의 JVM 애플리케이션은 **빌드 시점에 시크릿이 필요 없다.** 런타임 환경변수로 주입하면 된다(`config-and-secrets`). 빌드에 시크릿이 필요하다면 그 이유를 먼저 의심한다.

### OIDC (장기 키 제거)

```yaml
permissions:
  id-token: write                   # OIDC 토큰 발급
  contents: read

steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::<account>:role/github-actions-deploy
      aws-region: ap-northeast-2
```

클라우드 쪽에 GitHub OIDC 신뢰 관계를 설정하면 액세스 키를 저장할 필요가 없다. 리포지토리·브랜치 조건을 신뢰 정책에 넣어 범위를 좁힌다.

## 5. 이미지

### Dockerfile (`workflows/Dockerfile` 참고)

레이어 캐시의 핵심은 **변경 빈도가 낮은 것을 먼저** 두는 것이다.

```dockerfile
COPY gradle/ gradle/
COPY gradlew build.gradle.kts settings.gradle.kts ./
RUN ./gradlew dependencies --no-daemon     # 의존성만 먼저 (자주 안 바뀜)
COPY src/ src/                             # 소스는 나중 (자주 바뀜)
RUN ./gradlew bootJar --no-daemon
```

Spring Boot의 레이어드 JAR을 쓰면 더 잘게 나눌 수 있다.

```dockerfile
RUN java -Djarmode=tools -jar app.jar extract --layers --launcher
# 또는 Boot 3.x: java -Djarmode=layertools -jar app.jar extract
```

`jarmode` 옵션 이름이 Boot 버전에 따라 다르다. 사용 중인 Boot 버전 문서를 확인한다.

### 태깅과 승격

```yaml
- uses: docker/metadata-action@v5
  id: meta
  with:
    images: ghcr.io/${{ github.repository }}
    tags: |
      type=sha,format=long,prefix=          # 불변 태그. 롤백의 근거
      type=ref,event=branch
      type=semver,pattern={{version}}
```

```bash
# 승격 - 재빌드 없이 태그만 추가
docker buildx imagetools create \
  ghcr.io/org/app:abc1234 \
  --tag ghcr.io/org/app:prod
```

환경마다 빌드하면 같은 커밋에서 다른 바이너리가 나올 수 있다(의존성 해석 시점 차이, 빌드 환경 차이). **한 번 빌드해 승격**이 원칙인 이유다.

## 6. 마이그레이션 순서

파이프라인이 DDL을 실행하는 경우:

```yaml
- name: Run migration (expand only)
  run: ./gradlew flywayMigrate
  env:
    FLYWAY_URL: ${{ secrets.DB_URL }}
```

- **하위 호환 변경만** 자동화한다(컬럼 추가, 인덱스 추가). 컬럼 삭제·이름 변경은 사람이 판단한다.
- 마이그레이션 job을 배포 job보다 앞에 두고 `needs`로 연결한다.
- 락 대기 시간 상한을 둔다. 마이그레이션이 운영 트래픽을 막고 몇 분씩 서 있으면 장애다.

회사처럼 **수동 실행 관행**이면 파이프라인은 여기까지만 한다.

```yaml
- name: Collect migration SQL
  run: |
    mkdir -p build/migration
    cp sql/patch/*.sql build/migration/ 2>/dev/null || true
- uses: actions/upload-artifact@v4
  with: { name: migration-sql, path: build/migration/ }
```

산출물로 올리고 실행은 DBA/담당자가 절차대로 한다(`db-schema-and-migration` 4장).

## 7. 스모크 테스트와 롤백

```yaml
- name: Smoke test
  run: |
    for i in $(seq 1 30); do
      code=$(curl -s -o /dev/null -w '%{http_code}' https://api.example.com/actuator/health/readiness || true)
      [ "$code" = "200" ] && break
      sleep 5
    done
    [ "$code" = "200" ] || { echo "readiness 실패"; exit 1; }

    curl -sf https://api.example.com/api/v1/ping > /dev/null

- name: Rollback on failure
  if: failure()
  run: kubectl rollout undo deployment/app -n prod
```

- 스모크는 **빠르고 확실한 것 2~3개**만. 전체 E2E를 배포 게이트에 두면 배포가 못 나간다.
- 자동 롤백을 켤지는 정책이다. 자동 롤백이 마이그레이션과 엇갈리면 더 나빠질 수 있다(6장). 스키마가 관련된 배포는 수동 판단이 안전하다.

```bash
# 이미지 SHA로 롤백 (환경 무관하게 통하는 형태)
kubectl set image deployment/app app=ghcr.io/org/app:<이전 SHA> -n prod
```

배포 기록을 `docs/ops/`에 남기거나 배포 알림을 채널로 보낸다. 장애가 나면 가장 먼저 보는 것이 "최근 무엇이 바뀌었나"다(`rca-procedure`).

## 8. 캐시와 플레이키

```yaml
- uses: docker/build-push-action@v6
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

GitHub Actions 캐시에는 용량 제한이 있고 오래된 항목이 밀려난다. 캐시가 원인인 실패가 의심되면 캐시 키에 접미사를 붙여 무효화하는 경로를 둔다.

```yaml
env:
  CACHE_BUSTER: v1          # 문제가 생기면 v2로 올린다
```

플레이키 테스트는 `@Tag("flaky")`로 격리하고 별도 job에서 `continue-on-error: true`로 돌려 추세만 본다. 격리한 테스트 목록과 기한을 이슈로 관리한다. 재시도로 초록불을 만들면 진짜 회귀를 놓친다.

## 참고

- GitHub Actions - Workflow syntax: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- GitHub Actions - Security hardening: https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions
- GitHub Actions - Deployment environments: https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment
- OIDC in GitHub Actions: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect
- docker/build-push-action: https://github.com/docker/build-push-action
- Spring Boot - Container images: https://docs.spring.io/spring-boot/reference/packaging/container-images/index.html
