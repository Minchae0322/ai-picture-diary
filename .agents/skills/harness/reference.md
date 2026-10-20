# harness - 참고 자료

`SKILL.md`의 규칙에 대한 이유, 설정/스크립트 예시, 상세 설명을 담는다. 절 번호는 SKILL.md와 같다.

## 목적 - 왜

스킬 문서는 "이렇게 하라"는 규칙이고, 하네스는 그 규칙이 지켜졌는지 사람 대신 기계가 즉시 확인하는 안전망이다. 새 도구를 들이는 것이 아니라 이미 있는 명령(`compileJava`, `test`)이 빠짐없이, 변경 직후에, 통과 못 하면 다음 단계로 못 가게 돌아가도록 배선하는 것이 핵심이다.

하네스가 잡는 것 세 가지:

1. "돌려봤다"는 말과 실제 결과의 차이. 컴파일/테스트가 자동으로 돌아 결과가 남는다.
2. 컴파일도 테스트도 못 잡는 구조 규칙 위반(`domain`이 `application`을 import, 엔티티 `@Setter`). ArchUnit이 테스트로 바꿔 잡는다.
3. 실행해야만 드러나는 버그 패턴(널 역참조, 닫지 않은 리소스, 무시된 반환값). 정적 분석이 실행 전에 잡는다.

## 언제 적용 - 상세

- 새 프로젝트를 시작할 때 (부트스트랩 체크리스트에 포함)
- Claude가 코드를 수정하는 프로젝트에 처음 붙일 때
- "테스트 통과했다"고 했는데 깨진 채 푸시된 일이 생겼을 때
- ddd-spring 규칙을 리뷰에서 눈으로 잡는 게 반복될 때

## 다섯 층 - 원칙의 이유

빠른 검사는 자주, 느린 검사는 경계에서. compile은 매 수정마다, unit test와 ArchUnit은 커밋 전, integration과 정적 분석 전체는 푸시/CI에서. 느린 검사를 매번 돌리면 작업이 느려져 결국 끄게 된다.

## 1층. compile - 이유

이미 있다. 배선만 한다. Boot 4 프로젝트는 Gradle 9 + Java 25 툴체인(`java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }`)을 기준으로 한다.

- `compileJava`뿐 아니라 `compileTestJava`도 같이. 테스트 코드가 깨진 걸 테스트 실행 때까지 모르는 일이 흔하다.
- QueryDSL Q타입, Lombok처럼 annotationProcessor 산출물에 의존하는 프로젝트는 `compileJava`가 곧 Q타입 재생성이다. 엔티티를 고쳤으면 반드시 돌린다.
- 경고를 오류로: `options.compilerArgs << '-Xlint:all' << '-Werror'`는 기존 프로젝트에 갑자기 켜면 수백 개가 터진다. 새 프로젝트에만. 기존은 `-Xlint:unchecked,deprecation`부터.

## 2층. test - 설정 예시

`test-writing-guide.md`가 테스트를 어떻게 쓰는지라면, 여기는 어떻게 나눠 돌리는지다.

```groovy
// build.gradle - 단위/통합 분리
tasks.named('test') {
    useJUnitPlatform {
        excludeTags 'integration'
    }
}

tasks.register('integrationTest', Test) {
    useJUnitPlatform {
        includeTags 'integration'
    }
    shouldRunAfter test
}
```

```java
@Tag("integration")
@SpringBootTest
class OrderFlowIntegrationTest { ... }
```

- `@SpringBootTest`, Testcontainers를 쓰는 클래스는 전부 `@Tag("integration")`. 태그가 없으면 `test`에 섞여 들어와 매번 느려진다.
- 실패 출력은 요약만: `testLogging { events 'failed'; exceptionFormat 'short' }`. hook에서 읽는 출력이 길면 토큰만 먹는다.
- 커버리지(JaCoCo)는 숫자 목표가 아니라 "안 건드린 곳 찾기" 용도. 게이트로 쓰려면 새 코드에만(`jacocoTestCoverageVerification` + 변경 파일 필터).

## 3층. ArchUnit - 전체 코드

`ddd-spring.md`의 규칙 중 기계가 판정할 수 있는 것만 옮긴다. 판단이 필요한 규칙(값 객체 도입 조건, 전략 패턴 3갈래)은 리뷰로 남긴다.

```groovy
testImplementation 'com.tngtech.archunit:archunit-junit5:1.3.0'
```

```java
@AnalyzeClasses(packages = "com.company.service", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    // 1. 계층 의존 방향: interfaces -> application -> domain <- infrastructure
    @ArchTest
    static final ArchRule layers = layeredArchitecture().consideringOnlyDependenciesInLayers()
        .layer("interfaces").definedBy("..interfaces..")
        .layer("application").definedBy("..application..")
        .layer("domain").definedBy("..domain..")
        .layer("infrastructure").definedBy("..infrastructure..")
        .whereLayer("interfaces").mayNotBeAccessedByAnyLayer()
        .whereLayer("application").mayOnlyBeAccessedByLayers("interfaces", "infrastructure")
        .whereLayer("domain").mayOnlyBeAccessedByLayers("application", "infrastructure", "interfaces")
        .whereLayer("infrastructure").mayNotBeAccessedByAnyLayer();

    // 2. domain은 상위 계층과 외부 시스템을 모른다
    @ArchTest
    static final ArchRule domainIsolation = noClasses().that().resideInAPackage("..domain..")
        .should().dependOnClassesThat().resideInAnyPackage(
            "..interfaces..", "..application..",
            "org.springframework.web..", "org.springframework.kafka..", "org.apache.kafka..");

    // 3. 도메인 간 직접 참조 금지 (order.domain -> member.domain)
    @ArchTest
    static final ArchRule noCrossDomain = slices().matching("com.company.service.(*)..")
        .should().notDependOnEachOther()
        .ignoreDependency(resideInAPackage("..application.."), alwaysTrue())   // application에서의 조합은 허용
        .ignoreDependency(alwaysTrue(), resideInAPackage("..common.."));

    // 4. 엔티티에 @Setter / @Data 금지
    @ArchTest
    static final ArchRule noSetterOnEntity = noClasses().that().areAnnotatedWith(Entity.class)
        .should().beAnnotatedWith(Setter.class).orShould().beAnnotatedWith(Data.class);

    // 5. @Transactional은 application에만 (도메인/컨트롤러 금지)
    @ArchTest
    static final ArchRule transactionalOnlyInApplication = noClasses().that()
        .resideInAnyPackage("..domain..", "..interfaces..")
        .should().beAnnotatedWith(Transactional.class)
        .orShould().containAnyMethodsThat(annotatedWith(Transactional.class));

    // 6. 컨트롤러는 엔티티를 반환하지 않는다
    @ArchTest
    static final ArchRule noEntityInController = noMethods().that()
        .areDeclaredInClassesThat().areAnnotatedWith(RestController.class)
        .should().haveRawReturnType(annotatedWith(Entity.class));

    // 7. 컨트롤러는 리포지토리를 직접 쓰지 않는다
    @ArchTest
    static final ArchRule noRepositoryInController = noClasses().that().areAnnotatedWith(RestController.class)
        .should().dependOnClassesThat().areAssignableTo(Repository.class);

    // 8. 필드 주입 금지
    @ArchTest
    static final ArchRule noFieldInjection = noFields().should().beAnnotatedWith(Autowired.class);

    // 9. Util 클래스는 final + private 생성자 + 스프링 빈 아님
    @ArchTest
    static final ArchRule utilShape = classes().that().haveSimpleNameEndingWith("Utils")
        .should().haveOnlyPrivateConstructors().andShould().haveModifier(JavaModifier.FINAL)
        .andShould().notBeAnnotatedWith(Component.class);
}
```

- 규칙 5(`@Transactional` 위치)는 ddd-spring에서 "기본 위치"로 완화했으므로, 팀이 예외를 두기로 했으면 `orShould` 대신 `.allowEmptyShould(true)`로 두거나 규칙에서 뺀다. 문서와 하네스는 같은 말을 해야 한다.
- 기존 프로젝트(`controller/service/repository` 구조)는 패키지 패턴만 바꾸면 그대로 쓴다. `..interfaces..` -> `..controller..`, `..application..` -> `..service..`, `..infrastructure..` -> `..repository..`.
- 처음 켜면 위반이 수십 개 나온다. `FreezingArchRule.freeze(rule)` 로 감싸면 현재 위반은 저장해 두고 새 위반만 실패시킨다. 기존 프로젝트는 이걸로 시작해서 저장된 위반을 조금씩 줄인다.
- ArchUnit은 Java 8+ 에서 동작한다. Java 11 / Boot 2.7 프로젝트에도 그대로 붙는다. Boot 4(Jakarta EE 11)는 `jakarta.persistence.Entity`, Boot 2.7은 `javax.persistence.Entity`로 import만 바꾼다.

## 4층. 정적 분석 - 상세 표와 설정

세 종류가 있고 역할이 다르다. 전부 켤 필요 없다.

| 도구 | 잡는 것 | 추천 |
|---|---|---|
| Spotless (+ google-java-format 또는 팀 포맷) | 포맷. 논쟁을 없앤다 | 새 프로젝트 필수. 기존은 `ratchetFrom 'origin/main'`으로 바뀐 파일만 |
| Error Prone | 컴파일 시점 버그 패턴(널, 미사용 반환값, equals 오류, 잘못된 포맷 문자열) | 추천. 오탐이 적고 컴파일에 붙어 별도 단계가 없다. Java 11+ |
| SpotBugs | 바이트코드 기반 버그 패턴 | Error Prone과 겹친다. 둘 중 하나 |
| Checkstyle | 네이밍, 구조 규칙(중첩 깊이, 메서드 길이, 매직 넘버) | `if` 중첩 3단, 메서드 100줄 같은 ddd-spring "코드 작성 지향"을 숫자로 강제하고 싶을 때만. 규칙 10개 이내로 |
| SonarLint/SonarQube | 복잡도, 중복, 보안 취약점 | IDE 플러그인으로 개인이 쓰고, 서버는 팀 결정 |

```groovy
plugins {
    id 'com.diffplug.spotless' version '7.x'      // 버전은 플러그인 포털에서 최신 확인
    id 'net.ltgt.errorprone' version '4.x'
}

spotless {
    java {
        target 'src/**/*.java'
        googleJavaFormat().aosp()            // 4칸 들여쓰기. 버전 미지정 시 플러그인 기본
        removeUnusedImports()
        ratchetFrom 'origin/main'            // 기존 프로젝트: 변경된 파일만 검사
    }
}

dependencies {
    errorprone 'com.google.errorprone:error_prone_core:2.x'   // Java 25 지원 버전(2.41+ 추정, 릴리즈 노트 확인)
}

tasks.withType(JavaCompile).configureEach {
    options.errorprone {
        disableWarningsInGeneratedCode = true
        excludedPaths = '.*/build/generated/.*'   // QueryDSL Q타입 제외
    }
}
```

- 정적 분석은 경고 0개를 유지할 수 있는 규칙만 켠다. 경고 300개가 쌓인 도구는 아무도 안 본다. 기존 프로젝트는 `ratchetFrom`, `-XepDisableAllChecks` + 필요한 체크만 `-Xep:NullAway:ERROR`처럼 하나씩.
- 포맷은 검사(`spotlessCheck`)가 아니라 적용(`spotlessApply`)을 hook에 건다. 검사만 걸면 사람이 손으로 고쳐야 한다.

## 5층. hooks - 설정과 스크립트 전문

### Claude Code hook (Claude가 수정할 때)

`.claude/settings.json` (프로젝트) 또는 `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/after-edit.sh",
            "timeout": 120
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/before-stop.sh",
            "timeout": 600
          }
        ]
      }
    ]
  }
}
```

```bash
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
```

```bash
# .claude/hooks/before-stop.sh - 작업 종료 전 단위 테스트 + ArchUnit
cd "$(git rev-parse --show-toplevel)" || exit 0
git diff --quiet HEAD -- '*.java' && exit 0     # 자바 변경 없으면 통과
if ! ./gradlew -q test 2>&1 | grep -E "FAILED|tests completed|BUILD" | tail -20; then
  echo "테스트 실패. 결과를 확인하고 고친 뒤 종료하세요." >&2
  exit 2
fi
```

- `PostToolUse`에는 컴파일만. 테스트를 매 수정마다 돌리면 작업이 멈춘다.
- `Stop`에 unit test + ArchUnit. 통합 테스트는 걸지 않는다.
- hook 출력은 `tail`/`grep`으로 잘라서 넘긴다. Gradle 전체 출력을 넘기면 토큰 낭비다.
- `exit 2`가 "Claude에게 피드백을 돌려주는" 종료 코드다. `exit 1`은 그냥 실패로 끝난다. hook 스펙은 버전마다 바뀔 수 있으니 Claude Code 문서에서 현재 `PostToolUse`/`Stop` 입력 형식과 종료 코드 의미를 확인하고 쓴다.

### git hook (사람이 커밋/푸시할 때)

Gradle 프로젝트라면 스크립트를 저장소에 두고 `core.hooksPath`로 연결한다. 팀원 모두에게 같은 hook이 걸린다.

```bash
# .githooks/pre-commit
#!/usr/bin/env bash
set -e
./gradlew -q spotlessApply
git diff --name-only --cached -- '*.java' | xargs -r git add   # 포맷 결과를 스테이징에 반영
./gradlew -q compileJava compileTestJava
./gradlew -q test --tests '*ArchitectureTest'
command -v gitleaks >/dev/null && gitleaks protect --staged --no-banner   # 시크릿 커밋 차단 (config-and-secrets 스킬)
```

```bash
# .githooks/pre-push
#!/usr/bin/env bash
set -e
./gradlew -q test
```

```bash
git config core.hooksPath .githooks && chmod +x .githooks/*
```

- pre-commit은 10초 안에 끝나야 한다. 넘으면 사람들이 `--no-verify`를 쓰기 시작하고 그 순간 하네스는 없는 것과 같다.
- pre-push에 unit test 전체. integration은 CI.
- Windows 팀원이 있으면 bash 대신 Gradle 태스크로 감싸고(`./gradlew preCommit`) hook에서는 그것만 호출한다.

### CI (모두가 통과해야 하는 최종 관문)

```yaml
# .gitlab-ci.yml 또는 GitHub Actions - 순서는 빠른 것부터
stages: [check, test, integration]
check:       { script: ./gradlew spotlessCheck compileJava compileTestJava errorprone }
test:        { script: ./gradlew test }                     # unit + ArchUnit
integration: { script: ./gradlew integrationTest, only: [merge_requests, main, develop] }
```

## 도입 순서 (기존 프로젝트) - 상세

한 번에 다 켜지 않는다. 각 단계는 별도 커밋이고, 단계마다 일주일쯤 써 보고 다음으로.

1. **Claude Code hook: compile** - `after-edit.sh`만. 반나절. 효과가 즉시 보인다.
2. **테스트 분리 + Stop hook** - `@Tag("integration")` 붙이고 `test`/`integrationTest` 나눈 뒤 `before-stop.sh`. 통합 테스트가 태그 없이 섞여 있으면 이 단계가 제일 오래 걸린다.
3. **ArchUnit 5개** - 위 규칙 중 1(계층), 2(domain 격리), 4(엔티티 Setter), 7(컨트롤러-리포지토리), 8(필드 주입). `freeze`로 시작. 나머지 규칙은 위반 0이 되면 추가.
4. **git pre-commit** - Spotless(`ratchetFrom`) + compile + ArchUnit.
5. **Error Prone** - 기본 체크만. 경고가 아니라 오류로 두되, 처음엔 `-XepAllErrorsAsWarnings`로 규모 파악 후.
6. **CI 정리** - 위 표대로 stage 분리.

새 프로젝트는 1~6을 부트스트랩 때 한 번에 넣되, ArchUnit 규칙은 9개 전부, 정적 분석은 `-Werror` 포함.

## 하지 말 것 - 이유

- 매 수정마다 전체 테스트를 돌리는 hook. 작업이 멈추고 결국 끈다.
- pre-commit이 10초를 넘는 것. `--no-verify`가 습관이 된다.
- 경고가 수백 개인 채로 정적 분석을 켜 두는 것. 0을 유지할 수 있는 규칙만.
- 문서(ddd-spring)와 ArchUnit 규칙이 다른 말을 하는 것. 규칙을 완화했으면 둘 다 고친다.
- hook 출력을 자르지 않고 Gradle 로그 전체를 Claude에게 넘기는 것.
- 하네스가 있으니 리뷰를 생략하는 것. 하네스는 기계가 판정할 수 있는 것만 잡는다. 값 객체 도입 시점, 애그리거트 경계, 이름 짓기는 여전히 사람이 본다.
- 통과 못 한 검사를 "나중에 고치겠다"며 비활성화하는 것. 비활성화는 `freeze`나 `ratchetFrom`처럼 기존은 봐주고 새 위반만 막는 방식으로만.

## 참고

- `ddd-spring` 스킬 - ArchUnit 규칙의 원본. 두 문서는 같은 규칙을 말해야 한다.
- `test-writing-guide` 스킬 - 단위/슬라이스/통합 구분. 태그 기준.
- ArchUnit User Guide: https://www.archunit.org/userguide/html/000_Index.html
- ArchUnit FreezingArchRule: https://www.archunit.org/userguide/html/000_Index.html#_freezing_arch_rules
- Spotless Gradle: https://github.com/diffplug/spotless/tree/main/plugin-gradle
- Error Prone: https://errorprone.info/
- Claude Code Hooks: https://docs.claude.com/en/docs/claude-code/hooks
- Gradle - JUnit Platform 태그 필터: https://docs.gradle.org/current/userguide/java_testing.html#test_filtering
