---
name: config-and-secrets
description: 백엔드에서 환경변수, application.yml, 프로파일, 시크릿(API 키, DB 비밀번호, JWT 시크릿, 외부 서비스 키)을 추가하거나 읽거나 바꾸는 모든 작업에서 자동 적용. "환경변수", "설정값", ".env", "application-prod.yml", "시크릿", "API 키 어디에", "프로파일" 같은 요청이나, 코드에 @Value / @ConfigurationProperties / System.getenv 가 등장하는 순간 트리거된다. 어디에 무엇을 두고, 어떻게 이름 짓고, 기동 시 검증하고, 커밋과 로그에서 새지 않게 하는 규칙.
---

# 환경변수와 시크릿 (config-and-secrets)

## 목적

설정값은 "잘 돌아가는 것"과 "새지 않는 것"을 동시에 만족해야 한다. 설정값이 하나라도 들어갈 때 **어디에(위치), 어떤 이름으로(네이밍), 어떻게 읽고(바인딩), 언제 터지게(검증), 어떻게 감출지(마스킹)** 를 정한다. 코드 리뷰와 하네스가 같은 기준으로 잡는다.
기본 스택: Spring Boot 4.x (3.x 동일). Boot 2.7은 `spring.config.import` 유무만 다르다.

## 언제 적용

`application*.yml`/`.properties` 키 추가·변경, `@Value`/`@ConfigurationProperties`/`Environment`/`System.getenv` 코드 작성, 외부 서비스 키(OpenAI, 카카오, AWS, PG사)/DB 접속 정보/JWT 시크릿 추가, 새 프로파일(local/dev/prod)·배포 환경 추가, `.env`/`gradle.properties`/K8s Secret/CI 변수 작업, "로컬에서는 되는데 서버에서 안 되는" 조사.

## 1. 값의 분류 - 이것부터 정한다

| 분류 | 정의 | 예 | 위치 | 커밋 |
|---|---|---|---|---|
| **공개 설정** | 유출돼도 피해 없음. 환경마다 다를 수 있음 | 포트, 로그 레벨, 타임아웃, 페이지 크기, 기능 플래그, 외부 API의 base URL | `application.yml` + 프로파일 파일 | O |
| **환경 의존값** | 비밀은 아니지만 환경마다 반드시 다름 | DB 호스트, Redis 호스트, Kafka 브로커, 프론트 도메인(CORS) | 프로파일 파일에 기본값 + 환경변수로 덮어쓰기 | O (기본값만) |
| **시크릿** | 유출 시 즉시 피해 | DB 비밀번호, JWT 시크릿, API 키, OAuth client secret, 서비스 계정 키, 암호화 키, 웹훅 서명 키 | **환경변수 또는 시크릿 저장소만.** yml에는 `${ENV_NAME}` 참조만 | **절대 X** |

애매하면 시크릿으로 취급한다.

## 2. 위치 규칙

```
src/main/resources/
├── application.yml            # 공통. 모든 환경에 같은 값 + 시크릿은 ${ENV} 참조
├── application-local.yml      # 로컬 개발 (H2/도커 DB, 더미 키). 커밋 O
├── application-dev.yml        # 개발 서버
└── application-prod.yml       # 운영. 값이 아니라 ${ENV} 참조가 대부분

프로젝트 루트/
├── .env.example               # 필요한 환경변수 목록 + 설명 + 더미값. 커밋 O
├── .env                       # 로컬 실제 값. 커밋 X (.gitignore)
└── gradle.properties.example  # Gradle에서 읽는 값이 있을 때. 실제 gradle.properties는 커밋 X
```

- 시크릿은 `application-prod.yml`에도 값으로 쓰지 않는다. `${DB_PASSWORD}` **환경변수 참조만**. 값은 배포 환경(K8s Secret, systemd EnvironmentFile, CI 변수, AWS Secrets Manager)이 주입.
- 로컬 더미 시크릿(`application-local.yml`의 `jwt.secret: local-only-not-a-secret-...`)은 허용. **운영에서 절대 쓸 수 없는 값** + 이름에 `local` 포함. 32바이트 이상 키(JWT HS256)는 더미도 길이를 맞춘다.
- 프로파일은 실제 있는 환경만 만든다(보통 local/dev/prod). 스테이징이 없으면 파일도 만들지 않는다. 프로파일 파일에는 **그 환경에서만 다른 값**만.
- 프로파일 그룹(`prod` = `prod-db` + `prod-mq`)은 `spring.profiles.group`. 파일 분리(`application-prod-db.yml`)는 파일 6개 초과일 때만.
- 기본 활성 프로파일은 **`local`** (`spring.profiles.default: local`). 운영은 배포 환경이 `SPRING_PROFILES_ACTIVE=prod`.

## 3. 네이밍

- **yml 키**: `<도메인>.<대상>.<속성>` 소문자 kebab-case. 프로젝트 접두사(`app.`) 하나로 스프링 기본 키와 구분. 예시 yml은 `reference.md`.
- **환경변수**: yml 키를 대문자 스네이크로. `app.jwt.secret` -> `APP_JWT_SECRET`. relaxed binding으로 자동 매핑되지만 **시크릿은 `${JWT_SECRET}`처럼 명시적으로 참조**.
- 시크릿 이름에는 `_SECRET`, `_KEY`, `_PASSWORD`, `_TOKEN` 중 하나. 마스킹(6장)이 이 접미사로 잡는다.
- 환경 이름을 변수명에 넣지 않는다. `PROD_DB_PASSWORD` 아니라 `DB_PASSWORD`.
- 기본값 `${VAR:default}`는 **공개 설정에만**. 시크릿은 없으면 기동 실패해야 한다(5장).

## 4. 코드에서 읽기

- **`@ConfigurationProperties` + record + `@Validated`가 기본. `@Value`는 한두 개짜리 단순값에만.** 등록은 `@ConfigurationPropertiesScan` 또는 `@EnableConfigurationProperties`. 예시는 `reference.md`.
- 묶음 설정(JWT 3개, OpenAI 3개)은 반드시 `@ConfigurationProperties`. 생성자에 `@Value` 다섯 개면 이미 늦다.
- record 바인딩은 Boot 2.6+ (생성자 바인딩). 불변이라 테스트에서 `new JwtProperties(...)`로 바로 만든다.
- `Duration`, `DataSize`는 타입으로 받는다(`30m`, `10MB`). `long timeoutMs` 금지.
- `System.getenv()` 직접 호출 금지. 모든 값은 `Environment`를 거쳐 yml/프로퍼티 클래스로.
- 설정 클래스는 `infrastructure` 또는 `config` 패키지. `domain`이 설정 클래스를 알면 안 된다(`ddd-spring` 스킬). 도메인이 값이 필요하면 application 서비스가 꺼내 넘긴다.
- 기능 플래그는 `@ConditionalOnProperty`로 빈 교체 또는 프로퍼티 boolean. `if (env.getProperty(...))` 흩뿌리기 금지.


### 4-1. 업무 상한과 매직 넘버

- **업무 규칙의 수치는 코드 상수가 아니라 설정값이다.** 글자 수 제한, 하루 횟수 제한, 점수 범위, 페이지 크기, 유효 기간처럼 "정책이 바뀌면 바뀌는 값"은 `app.<도메인>.*`에 두고 한곳에서 관리한다. `private static final int MAX = 500`이 도메인에 박혀 있으면 배포해야 바뀐다.
- **도메인은 설정 클래스를 모른다.** 프로퍼티 record에서 **정책 값 객체**(`XxxPolicy` record)를 만들어 도메인 메서드에 넘긴다. 도메인은 그 값 객체만 알고, 응용 계층이 설정에서 꺼내 전달한다(`ddd-spring` 계층 규칙).
  ```
  DiaryProperties(설정) -> DiaryPolicy(도메인 값 객체) -> Diary.write(..., policy)
  ```
- **애노테이션은 컴파일 상수만 받는다.** `@Column(length=)`, `@Size(max=)`, `@Min/@Max`에는 설정값을 넣을 수 없다. 그래서 둘을 구분한다.

| 종류 | 어디에 | 예 | 바뀌는 주기 |
|---|---|---|---|
| **스키마 상수** | 엔티티의 `public static final`. DDL과 같은 값 | `CONTENT_COLUMN_LENGTH = 500` | 마이그레이션할 때만 |
| **업무 상한** | 설정 `app.<도메인>.*` -> 정책 값 객체 | `max-content-length: 500` | 기획이 바꿀 때 |

- 업무 상한이 스키마 상수를 넘으면 저장 시점에 잘린다. 프로퍼티에 `@Max(<스키마 상수>)`를 걸어 **기동 때** 잡는다.
- 테스트는 설정을 읽지 말고 정책 값 객체를 직접 만들어 경계를 검증한다(`test-writing-guide` 경계값).

## 5. 기동 시 검증 - 빠진 값은 기동 순간에 터져야 한다

- 모든 `@ConfigurationProperties`에 `@Validated` + Bean Validation. 시크릿 `@NotBlank`, 길이 `@Size(min=)`, URL `@Pattern` 또는 커스텀.
- 시크릿에 기본값 금지. 없으면 `Could not resolve placeholder`로 기동 실패. 이게 원하는 동작.
- 운영 프로파일에서 로컬 더미값 사용을 막는 `ProdConfigGuard`(`@Profile("prod")`) 하나 둔다. 예시는 `reference.md`.
- `application*.yml`의 `${...}` 참조를 전부 뽑아 `.env.example`과 비교하는 테스트 하나. 어긋나면 CI 실패.
- 컨텍스트 로딩 테스트(`@SpringBootTest` 빈 하나)를 `prod` 프로파일 + 더미 환경변수로 띄워 yml 문법/바인딩 타입/누락 키를 배포 전에 잡는다.

## 6. 새지 않게 하기

- **커밋**: `.gitignore`에 `.env`, `.env.*`(단 `!.env.example`), `gradle.properties`, `*.p8`, `*.jks`, `*.pem`, `credentials.json`, `*service-account*.json`, `application-*.local.yml`. pre-commit에 gitleaks 또는 `git secrets`(`harness` 스킬: `gitleaks protect --staged`). 이미 커밋된 시크릿은 **즉시 폐기·재발급**, 히스토리 정리(`git filter-repo`)는 그다음.
- **로그**: 기동 시 설정값 전체 출력 금지. 필요하면 `_SECRET|_KEY|_PASSWORD|_TOKEN`을 `****`로 마스킹. Actuator `/env`, `/configprops`는 운영 비노출, 노출 시 `management.endpoint.env.show-values=never`(Boot 3+) 명시. 예외 메시지에 URL 통째 금지, DB URL과 자격 증명 분리(`spring.datasource.username/password`). 시크릿 필드가 있는 record는 `toString` 재정의하거나 로그에 넘기지 않는다.
- **앱 밖**: 환경변수보다 **시크릿 저장소**(AWS Secrets Manager, Vault, K8s Secret + 외부 시크릿 오퍼레이터) 우선. 작으면 환경변수로 시작하되 위치를 한 곳으로. 시크릿 저장소는 `spring.config.import=aws-secretsmanager:...` 또는 `vault://`로 합류. 회전 가능하게: JWT 키는 `kid`로 신구 동시 검증, DB 비밀번호는 시크릿 저장소 SDK 갱신 훅. 개인 `.env` 키와 공용 개발 서버 키를 같은 값으로 쓰지 않는다.

## 7. 환경별 차이를 다루는 방법

- DB/Redis/Kafka 주소: 프로파일 yml + 환경변수 덮어쓰기. 코드 `if (profile.equals("prod"))` 금지.
- 외부 API 실제/모의: 인터페이스 + `@Profile`/`@ConditionalOnProperty`로 구현체 교체.
- 로그 레벨: 프로파일 yml `logging.level`. 스케줄러 on/off: `app.scheduler.enabled` + `@ConditionalOnProperty`, 로컬 기본값 false.
- CORS: `app.cors.allowed-origins` 목록, `*` 금지. 기능 플래그: 프로퍼티 boolean(필요하면 원격 플래그 서비스), 하드코딩 상수 금지.
- `@Profile("!prod")` 부정 조건 금지. 양성 조건(`@Profile({"local","dev"})`) 또는 명시적 프로퍼티(`app.mock.payment=true`).

## 8. 새 설정값 추가 체크리스트

1. 분류: 공개 / 환경 의존 / 시크릿 (1장)
2. yml 키 이름과 환경변수 이름 (3장). 시크릿이면 접미사 확인
3. `application.yml`에 키 추가. 시크릿은 `${VAR}` 참조만, 기본값 없이
4. 프로파일별로 값이 다르면 해당 프로파일 파일에만
5. `.env.example`에 변수 추가 + 한 줄 설명 + 더미값
6. `application-local.yml`에 로컬 더미값(시크릿이면 `local-only-` 접두사)
7. 프로퍼티 record에 필드 추가 + 검증 애노테이션
8. 배포 환경(K8s Secret / CI 변수 / 시크릿 저장소)에 실제 값 등록. **코드 배포보다 먼저**
9. 문서: 운영 가이드(`docs/guide/환경-설정-가이드.md` 등)에 변수 표 갱신
10. 커밋 전 `git diff --staged | grep -iE "secret|password|key|token"`로 값이 안 들어갔는지 한 번 더

## 하지 말 것

- 시크릿을 yml, 코드, 테스트 리소스, 커밋 메시지, PR 설명, 이슈, 슬랙에 값으로 적는 것.
- 시크릿에 `${VAR:default}` 기본값. `System.getenv()` 직접 호출. `@Value` 다섯 개 이상을 한 클래스에.
- 프로파일 없이 기동했을 때 운영 설정이 잡히는 구조. 기본은 `local`.
- `if (activeProfile.equals("prod"))` 분기. 환경 이름을 변수명에 넣는 것(`PROD_DB_PASSWORD`).
- Actuator `/env`를 인증 없이 열어두는 것.
- 유출된 키를 "히스토리에서 지웠으니 됐다"로 끝내는 것. 재발급이 먼저.
- `.env.example`을 안 고치고 새 변수를 추가하는 것.

관련: `spring-auth`(JWT 시크릿 길이, `kid` 회전), `harness`(gitleaks), `spring-code-review`(하드코딩 체크), `deploy-pipeline`(환경별 시크릿 주입, OIDC), `llm-integration`(LLM API 키·모델 설정), `file-upload-storage`(버킷·스토리지 자격증명), `notification`(FCM 서비스 계정, APNs 키).

## 더 보기
- 이유, 예시 코드, 상세 표, 참고 링크: `reference.md` (판단이 안 서거나 처음 적용할 때만 읽는다)
