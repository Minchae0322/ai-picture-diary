# config-and-secrets - 참고 자료

`SKILL.md`의 규칙에 대한 이유, 예시 코드, 상세 표, 참고 링크를 담는다. SKILL.md와 함께 읽는다.

## 1. 값의 분류 - 이유

설정값을 넣기 전에 셋(공개 설정 / 환경 의존값 / 시크릿) 중 어디인지 정한다. 위치와 취급이 전부 여기서 갈린다. 애매하면 시크릿으로 취급한다. 나중에 완화하는 건 쉽고, 반대는 히스토리에서 지울 수 없다.

## 2. 위치 규칙 - 이유

- 프로파일별 파일에 공통값을 복사해 두면 한쪽만 고쳐지는 사고가 난다. 그래서 프로파일 파일에는 그 환경에서만 다른 값만 둔다.
- 기본 활성 프로파일을 `local`로 박는 이유: 프로파일 없이 띄웠을 때 운영 설정이 잡히는 사고를 막는다.

## 3. 네이밍 - 예시

```yaml
app:
  jwt:
    secret: ${JWT_SECRET}
    access-ttl: 30m
    refresh-ttl: 14d
  openai:
    api-key: ${OPENAI_API_KEY}
    base-url: https://api.openai.com/v1
    timeout: 30s
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000}
```

- 스프링의 relaxed binding이 자동으로 매핑하므로 `${...}`를 안 써도 되지만, 시크릿은 `${JWT_SECRET}`처럼 명시적으로 참조한다. 그래야 "이 값은 환경변수에서 온다"가 yml만 보고 보인다.
- 환경 이름을 변수명에 넣지 않는 이유: 환경은 주입하는 쪽이 정한다.
- 시크릿에 기본값을 주면 환경변수가 빠져도 조용히 뜬다. 시크릿은 없으면 기동 실패해야 한다.

## 4. 코드에서 읽기 - 예시

```java
@ConfigurationProperties(prefix = "app.jwt")
@Validated
public record JwtProperties(
    @NotBlank @Size(min = 32) String secret,
    @NotNull Duration accessTtl,
    @NotNull Duration refreshTtl
) {}
```

```java
@SpringBootApplication
@ConfigurationPropertiesScan          // 또는 @EnableConfigurationProperties(JwtProperties.class)
public class Application { ... }
```

- 서비스 생성자에 `@Value` 다섯 개가 늘어서면 이미 늦은 것이다. 묶음으로 쓰이는 설정은 반드시 `@ConfigurationProperties`.
- `System.getenv()`를 코드에서 직접 부르면 테스트에서 바꿀 수 없고 스프링 프로파일과 어긋난다.
- 기능 플래그(`app.feature.new-search: true`)는 `@ConditionalOnProperty`로 빈 자체를 바꾸거나, 프로퍼티 클래스의 boolean으로. `if (env.getProperty(...))`를 서비스 안에 흩뿌리지 않는다.

## 5. 기동 시 검증 - 예시

빠진 값은 배포 직후가 아니라 기동 순간에 터져야 한다.

운영 프로파일에서 로컬 더미값이 쓰이는 걸 막는 검증:

```java
@Component
@Profile("prod")
class ProdConfigGuard {
    ProdConfigGuard(JwtProperties jwt, DataSourceProperties ds) {
        if (jwt.secret().startsWith("local-only")) throw new IllegalStateException("prod에 로컬 JWT 시크릿이 들어왔다");
        if (ds.getUrl().contains("localhost") || ds.getUrl().contains("h2:")) throw new IllegalStateException("prod가 로컬 DB를 본다");
    }
}
```

- `.env.example`과 실제 사용 키가 어긋나지 않게, 테스트 하나로 잡는다: `application*.yml`에서 `${...}` 참조를 전부 뽑아 `.env.example`에 있는지 비교. 새 시크릿을 추가하고 `.env.example`을 안 고치면 CI가 실패한다.
- 컨텍스트 로딩 테스트(`@SpringBootTest` 빈 하나)를 `prod` 프로파일 + 더미 환경변수로 한 번 띄워 본다. yml 문법 오류, 바인딩 타입 오류, 누락 키를 배포 전에 잡는다.

## 6. 새지 않게 하기 - 이유

**커밋**

- 시크릿 스캐너를 pre-commit에 건다. gitleaks 또는 `git secrets`. `harness` 스킬의 pre-commit에 한 줄 추가: `gitleaks protect --staged`.
- 이미 커밋된 시크릿은 즉시 폐기하고 재발급한다. 히스토리 정리(`git filter-repo`)는 그다음이고, 정리해도 "이미 유출된 것"으로 취급한다.

**로그**

- Actuator `/env`, `/configprops`를 노출해야 하면 Boot의 sanitize 기능이 기본으로 `_SECRET|_KEY|_PASSWORD|_TOKEN` 접미사를 가리지만, `management.endpoint.env.show-values=never`(Boot 3+)를 명시한다.
- `jdbc:postgresql://user:pass@host/...` 형태의 URL은 비밀번호가 로그에 남는다. 예외 메시지에 URL을 통째로 넣지 않고, DB URL과 자격 증명을 분리(`spring.datasource.username/password`)한다.
- 프로퍼티 record의 `toString()`은 자동 생성되어 시크릿이 그대로 찍힌다. 시크릿 필드가 있는 record는 `toString`을 재정의해 마스킹하거나, 로그에 프로퍼티 객체를 넘기지 않는다.

**앱 밖**

- 환경변수는 `ps eww`, `/proc/<pid>/environ`, 크래시 덤프에 남는다. 그래서 시크릿 저장소가 우선이다. 규모가 작으면 환경변수로 시작하되 위치를 한 곳(배포 스크립트/K8s 매니페스트)으로 모은다.
- 시크릿 저장소를 쓰면 `spring.config.import=aws-secretsmanager:...` 또는 `vault://`로 스프링 프로퍼티에 그대로 합류시킨다. 코드는 바뀌지 않는다.
- 회전(rotation) 가능하게 만든다: JWT 서명 키는 `kid`로 신구 키 동시 검증, DB 비밀번호는 커넥션 풀 재시작 없이 바뀌도록 시크릿 저장소 SDK의 갱신 훅 사용. "회전하려면 전체 재배포"인 구조는 결국 회전을 안 하게 된다.
- 개발자 개인 키(로컬 `.env`)와 공용 개발 서버 키를 같은 값으로 쓰면 한 사람의 노트북 유출이 서버 유출이 된다.

## 7. 환경별 차이를 다루는 방법 - 상세 표

| 다르게 해야 할 것 | 방법 | 하지 말 것 |
|---|---|---|
| DB/Redis/Kafka 주소 | 프로파일 yml + 환경변수 덮어쓰기 | 코드에서 `if (profile.equals("prod"))` |
| 외부 API 실제/모의 | 인터페이스 + `@Profile`/`@ConditionalOnProperty`로 구현체 교체 | 서비스 안에서 URL 비교 |
| 로그 레벨 | 프로파일 yml의 `logging.level` | 코드에서 레벨 변경 |
| 스케줄러 on/off | `app.scheduler.enabled` + `@ConditionalOnProperty` | 로컬에서 스케줄러가 운영 큐를 먹는 사고. 로컬 기본값은 false |
| CORS 허용 도메인 | `app.cors.allowed-origins` 목록 | `*` (인증 쿠키와 같이 못 씀) |
| 기능 플래그 | 프로퍼티 boolean, 필요하면 원격 플래그 서비스 | 하드코딩 상수 |

`@Profile("!prod")`처럼 부정 조건은 나중에 프로파일이 추가될 때(스테이징 등) 의도와 어긋나기 쉽다. 양성 조건(`@Profile({"local","dev"})`)이나 명시적 프로퍼티(`app.mock.payment=true`)로 쓴다.

## 8. 새 설정값 추가 체크리스트

값 하나 넣을 때마다 SKILL.md 8장의 순서로 간다. 5분이면 끝난다.

## 하지 말 것 - 이유

- `.env.example`을 안 고치고 새 변수를 추가하면 다음 사람이 기동 실패로 알게 된다.

## 참고

- `spring-auth` 스킬 - JWT 시크릿 길이, 키 회전(`kid`), 시크릿 하드코딩 사고
- `harness` 스킬 - pre-commit에 gitleaks 추가
- `spring-code-review` 스킬 - 하드코딩 URL/키/타임아웃 체크
- Spring Boot - Externalized Configuration: https://docs.spring.io/spring-boot/reference/features/external-config.html
- Spring Boot - Type-safe Configuration Properties (record 바인딩, `@Validated`): https://docs.spring.io/spring-boot/reference/features/external-config.html#features.external-config.typesafe-configuration-properties
- Spring Boot - Actuator sanitization: https://docs.spring.io/spring-boot/reference/actuator/endpoints.html#actuator.endpoints.sanitization
- gitleaks: https://github.com/gitleaks/gitleaks
- 12-Factor App - Config: https://12factor.net/ko/config
