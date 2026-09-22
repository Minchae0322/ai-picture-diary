---
name: harness
description: 스프링/Gradle 프로젝트에 자동 검증 하네스(compile, test, ArchUnit, 정적 분석, hooks)를 구성하거나 점검할 때. "규칙이 지켜졌는지 기계가 확인하게" 만드는 배선. 각 층의 역할, 언제 무엇을 돌리는지, ddd-spring 규칙을 ArchUnit으로 옮기는 목록, Claude Code hook과 git hook 설정 예시, 단계별 도입 순서.
---

# 검증 하네스 (harness)

## 목적

하네스는 **스킬 규칙이 지켜졌는지 사람 대신 기계가 즉시 확인하는 안전망**이다. 새 도구가 아니라 이미 있는 명령(`compileJava`, `test`)이 **빠짐없이, 변경 직후에, 통과 못 하면 다음 단계로 못 가게** 돌아가도록 배선한다. 잡는 것: (1) "돌려봤다"와 실제 결과의 차이, (2) 컴파일/테스트가 못 잡는 구조 규칙 위반(ArchUnit), (3) 실행해야만 드러나는 버그 패턴(정적 분석).

## 언제 적용

새 프로젝트 부트스트랩, Claude가 코드를 수정하는 프로젝트에 처음 붙일 때, "테스트 통과했다"고 했는데 깨진 채 푸시된 일이 생겼을 때, ddd-spring 규칙을 리뷰에서 눈으로 잡는 게 반복될 때.

## 다섯 층

| 층 | 무엇을 잡나 | 명령 | 소요 | 언제 돌리나 |
|---|---|---|---|---|
| compile | 문법, 타입, 누락 import, 시그니처 불일치 | `./gradlew compileJava compileTestJava` | 수 초~수십 초 | 파일 수정 직후 (매번) |
| test (unit) | 동작 회귀. 스프링 컨텍스트 없는 테스트 | `./gradlew test --tests '*Test'` (통합 제외) | 수십 초 | 작업 단위 끝날 때, 커밋 전 |
| test (integration) | 트랜잭션, 쿼리, 컨텍스트 협력 | `./gradlew integrationTest` | 수 분 | 푸시 전, CI |
| ArchUnit | 계층 의존 방향, 애노테이션 위치, 네이밍 | `./gradlew test --tests '*ArchitectureTest'` | 수 초 | 커밋 전 (test에 포함) |
| static analysis | 포맷, 버그 패턴, 복잡도 | `./gradlew spotlessCheck errorprone` 등 | 수십 초 | 커밋 전, CI |
| hooks | 위 검사를 **언제 자동으로** 돌릴지 | Claude Code hook, git hook, CI | - | - |

원칙: **빠른 검사는 자주, 느린 검사는 경계에서.** compile은 매 수정, unit test와 ArchUnit은 커밋 전, integration과 정적 분석 전체는 푸시/CI.

## 이 스킬 폴더의 파일

| 파일 | 용도 | 복사 위치 |
|---|---|---|
| `archunit/ArchitectureTest.java` | 규칙 9개. 패키지명만 바꿔 쓴다 | `src/test/java/<base>/ArchitectureTest.java` |
| `claude-hooks/settings.json` | Claude Code hook 등록 | `.claude/settings.json` (기존 내용과 병합) |
| `claude-hooks/after-edit.sh` | 수정 직후 컴파일 | `.claude/hooks/after-edit.sh` |
| `claude-hooks/before-stop.sh` | 종료 전 단위 테스트 + ArchUnit | `.claude/hooks/before-stop.sh` |
| `githooks/pre-commit`, `pre-push` | git hook | `.githooks/` + `git config core.hooksPath .githooks` |

## 1층. compile

- 이미 있다. 배선만. Boot 4는 Gradle 9 + Java 25 툴체인(`java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }`) 기준.
- `compileJava` + `compileTestJava` 항상 같이. QueryDSL Q타입/Lombok 프로젝트는 엔티티를 고쳤으면 반드시 돌린다(Q타입 재생성).
- `-Xlint:all -Werror`는 새 프로젝트에만. 기존은 `-Xlint:unchecked,deprecation`부터.

## 2층. test

- `test-writing-guide`가 어떻게 쓰는지라면, 여기는 어떻게 나눠 돌리는지. `test` 태스크는 `excludeTags 'integration'`, 별도 `integrationTest` 태스크는 `includeTags 'integration'` + `shouldRunAfter test`.
- `@SpringBootTest`, Testcontainers 클래스는 전부 `@Tag("integration")`.
- 실패 출력은 요약만: `testLogging { events 'failed'; exceptionFormat 'short' }`.
- JaCoCo는 "안 건드린 곳 찾기" 용도. 게이트로 쓰려면 새 코드에만(`jacocoTestCoverageVerification` + 변경 파일 필터).

## 3층. ArchUnit

`ddd-spring` 규칙 중 **기계가 판정할 수 있는 것**만. 판단 필요한 규칙(값 객체 조건, 전략 패턴 3갈래)은 리뷰. 의존성 `com.tngtech.archunit:archunit-junit5:1.3.0`. 전체 코드는 `archunit/ArchitectureTest.java`.

| # | 규칙 |
|---|---|
| 1 | 계층 의존 방향 `interfaces -> application -> domain <- infrastructure` (`layeredArchitecture`) |
| 2 | `domain`은 `interfaces`/`application`/`org.springframework.web`/`kafka`를 모른다 |
| 3 | 도메인 간 직접 참조 금지 (`slices`, `application`에서의 조합과 `common`은 허용) |
| 4 | `@Entity`에 `@Setter`/`@Data` 금지 |
| 5 | `@Transactional`은 `application`에만 (`domain`/`interfaces` 금지) |
| 6 | `@RestController` 메서드가 `@Entity`를 반환하지 않는다 |
| 7 | `@RestController`가 `Repository`를 직접 쓰지 않는다 |
| 8 | 필드 주입(`@Autowired` 필드) 금지 |
| 9 | `*Utils`는 final + private 생성자 + `@Component` 아님 |

- 규칙 5는 ddd-spring에서 "기본 위치"로 완화됐으므로 팀이 예외를 두면 `.allowEmptyShould(true)` 또는 제외. 문서와 하네스는 같은 말을 해야 한다.
- **`domain`이 Spring Data를 모르게 하는 규칙을 임의로 추가하지 않는다.** `ddd-spring` 4장의 기본형(`domain/XxxRepository extends JpaRepository`)을 쓰면 도메인이 Spring Data에 의존하는 것이 정상이다. 그 규칙을 켜려면 리포지토리를 전부 포트+어댑터로 나눈 프로젝트여야 하고, 그 결정을 `CLAUDE.md`에 적어 둔다. 규칙을 먼저 켜고 코드를 맞추면 위임만 하는 어댑터가 생긴다.
- 기존 프로젝트는 패키지 패턴만 바꾼다: `..interfaces..` -> `..controller..`, `..application..` -> `..service..`, `..infrastructure..` -> `..repository..`.
- 처음 켜면 위반 수십 개. **`FreezingArchRule.freeze(rule)`**로 기존 위반은 저장, 새 위반만 실패. 조금씩 줄인다.
- Java 8+ 동작. Boot 4(Jakarta EE 11)는 `jakarta.persistence.Entity`, Boot 2.7은 `javax.persistence.Entity`.

## 4층. 정적 분석

| 도구 | 잡는 것 | 추천 |
|---|---|---|
| Spotless (+ google-java-format) | 포맷 | 새 프로젝트 필수. 기존은 `ratchetFrom 'origin/main'` |
| Error Prone | 컴파일 시점 버그 패턴 | 추천. 오탐 적음, 별도 단계 없음. Java 11+ |
| SpotBugs | 바이트코드 버그 패턴 | Error Prone과 겹침. 둘 중 하나 |
| Checkstyle | 네이밍, 중첩 깊이, 메서드 길이 | ddd-spring "코드 작성 지향"을 숫자로 강제할 때만. 규칙 10개 이내 |
| SonarLint/SonarQube | 복잡도, 중복, 보안 | IDE 플러그인 개인 사용, 서버는 팀 결정 |

- 플러그인 `com.diffplug.spotless` 7.x, `net.ltgt.errorprone` 4.x, `error_prone_core` 2.x(Java 25 지원 2.41+ 추정). Error Prone은 `disableWarningsInGeneratedCode`, `excludedPaths`로 Q타입 제외.
- **경고 0개를 유지할 수 있는 규칙만** 켠다. 기존은 `ratchetFrom`, `-XepDisableAllChecks` + `-Xep:NullAway:ERROR`처럼 하나씩.
- 포맷은 `spotlessCheck`가 아니라 `spotlessApply`를 hook에.

## 5층. hooks - 언제 자동으로 돌릴지

- **Claude Code hook** (`.claude/settings.json`): `PostToolUse`(matcher `Edit|Write|MultiEdit`, timeout 120) -> `after-edit.sh`(자바 파일만 `compileJava compileTestJava`, 출력 `tail -30`). `Stop`(timeout 600) -> `before-stop.sh`(자바 변경 있으면 `test`, 출력 `grep FAILED|tests completed|BUILD | tail -20`).
  - `PostToolUse`에는 **컴파일만**. `Stop`에 unit test + ArchUnit, 통합 테스트는 걸지 않는다. 출력은 `tail`/`grep`으로 잘라서.
  - `exit 2`가 Claude에게 피드백을 돌려주는 코드, `exit 1`은 그냥 실패. hook 스펙은 버전마다 바뀔 수 있으니 Claude Code 문서에서 입력 형식과 종료 코드를 확인.
- **git hook**: 스크립트를 저장소에 두고 `git config core.hooksPath .githooks && chmod +x .githooks/*`. **셰방(`#!/usr/bin/env bash`)은 반드시 파일의 첫 줄**이어야 한다. 주석을 위에 두면 셰방이 무시되고 예상과 다른 셸로 실행된다.
  - `pre-commit`: `spotlessApply` -> 포맷 결과 재스테이징 -> `compileJava compileTestJava` -> `test --tests '*ArchitectureTest'` -> `gitleaks protect --staged`(`config-and-secrets`). **10초 안에** 끝나야 한다.
  - `pre-push`: `./gradlew -q test`(unit 전체). integration은 CI.
  - Windows 팀원이 있으면 Gradle 태스크(`./gradlew preCommit`)로 감싸 hook은 그것만 호출.
- **CI** (최종 관문, 빠른 것부터): `check`(spotlessCheck, compile, errorprone) -> `test`(unit + ArchUnit) -> `integration`(MR/main/develop만).

## 어느 검사를 언제 (요약)

| 시점 | compile | unit test | ArchUnit | 포맷 | 정적 분석 | integration |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Claude 파일 수정 직후 | O | | | | | |
| Claude 작업 종료 | O | O | O | | | |
| git commit | O | | O | 적용 | | |
| git push | O | O | O | 검사 | | |
| CI (MR/main) | O | O | O | 검사 | O | O |

## 도입 순서 (기존 프로젝트)

한 번에 다 켜지 않는다. 단계마다 별도 커밋, 일주일쯤 써 보고 다음.
1. Claude Code hook: compile(`after-edit.sh`) 2. 테스트 분리 + Stop hook 3. ArchUnit 5개(1, 2, 4, 7, 8) + `freeze` 4. git pre-commit(Spotless `ratchetFrom` + compile + ArchUnit) 5. Error Prone(처음엔 `-XepAllErrorsAsWarnings`) 6. CI stage 분리.
새 프로젝트는 1~6을 부트스트랩 때 한 번에, ArchUnit 9개 전부, 정적 분석 `-Werror` 포함.

## 부록: 도구가 필요 없는 검사

문법·구조 규칙 중에는 컴파일러도 린터도 안 잡아 주는 것이 있다(이모지 금지, 금지 문자열, 파일명 규칙).
이런 건 **스테이지된 파일만 훑는 20줄짜리 스크립트**를 pre-commit 맨 앞에 둔다. 가장 싸고 도구 설치가 필요 없다.
규칙을 문서에만 적어 두면 사람이 기억해야 하고, 사람은 기억하지 못한다.

## 하지 말 것

- 매 수정마다 전체 테스트 hook. pre-commit 10초 초과(`--no-verify`가 습관이 된다). 경고 수백 개인 채로 정적 분석 유지.
- 문서(ddd-spring)와 ArchUnit이 다른 말. hook 출력을 자르지 않고 Gradle 로그 전체 전달.
- 하네스가 있으니 리뷰 생략(값 객체 도입 시점, 애그리거트 경계, 이름 짓기는 사람이 본다). 통과 못 한 검사를 비활성화("나중에"). 비활성화는 `freeze`/`ratchetFrom`처럼 **기존은 봐주고 새 위반만 막는 방식**으로만.

## 관련 스킬

`ddd-spring`(ArchUnit 규칙의 원본, 같은 규칙을 말해야 한다), `test-writing-guide`(단위/슬라이스/통합 구분, 태그 기준), `config-and-secrets`(gitleaks), `deploy-pipeline`(머지 이후 - CI에서 같은 규칙을 돌린다).

## 더 보기
- 이유, 예시 코드, 상세 표, 참고 링크: `reference.md` (판단이 안 서거나 처음 적용할 때만 읽는다)
