# spring-auth - 참고 자료

`SKILL.md`의 규칙에 대한 이유, 상세 표, 참고 링크를 담는다. SKILL.md와 함께 읽는다.

## 버전별 차이 (Boot 2.7 / 3 / 4)

내용은 구버전 프로젝트에도 그대로 적용된다. 다른 점은 Security 설정 DSL과 패키지뿐이다.

| | Boot 2.7 / Security 5.7 | Boot 3.x / Security 6 | Boot 4.x / Security 7 |
|---|---|---|---|
| 경로 매칭 | `antMatchers` | `requestMatchers` | `requestMatchers` (내부가 `PathPatternRequestMatcher`로 바뀜. `AntPathRequestMatcher`/`MvcRequestMatcher` 제거) |
| 패턴 규칙 | ant 스타일 | ant/mvc 혼용 | 절대 경로만. 서블릿 컨텍스트 경로 제외, 별도 서블릿 경로는 `basePath()`로 명시 |
| 설정 DSL | 체이닝 + 람다 | 람다만 (`csrf(c -> c.disable())`) | 람다만 |
| 리다이렉트 URI | 절대 | 절대 | 상대 (`Location: /login`). 프록시 뒤에서 절대가 필요하면 `setFavorRelativeUris(false)` |
| 쿠키 설정 | `setCookieMaxAge()` 등 | 동일 | `setCookieCustomizer(c -> c.maxAge(...))` |
| HTTPS 강제 | `requiresChannel()` | 동일 | `redirectToHttps()` |
| JSON | Jackson 2 (`com.fasterxml`) | Jackson 2 | Jackson 3 (`tools.jackson`). 401/403 JSON 응답 직접 쓰는 코드의 import 주의 |
| 패키지 | `javax.servlet` | `jakarta.servlet` | `jakarta.servlet` (EE 11) |

## 1. 첫 분기 - 모놀리식이냐 MSA냐

**왜 미리 MSA로 짓지 않는가.** 모놀리식 -> MSA 전환 비용은 발급/검증을 가르고 클레임 계약을 문서화하는 정도다. 반대로 처음부터 MSA면 로컬 개발, 시크릿 배포, 클레임 드리프트 비용을 매일 낸다.

### MSA (a) 키 전략 비교

| | HS256 (시크릿 공유) | RS256 (JWKS) |
|---|---|---|
| 배포 | 전 서비스에 같은 `JWT_SECRET` | auth만 개인키, 나머지는 JWKS URL |
| 위험 | 아무 서비스나 토큰 발급 가능. 한 곳 유출 = 전체 위조 | 유출돼도 검증만 가능 |
| 키 교체 | 전 서비스 동시 재배포 | `kid`로 무중단 롤오버 |
| 구현량 | 검증 필터를 직접 작성 | `spring-boot-starter-oauth2-resource-server`가 다 해줌 |

서비스 3개 이하 + 한 팀이면 HS256으로 시작해도 된다. 그 외, 특히 외부 팀이 리소스 서비스를 만들면 RS256. RS256을 고르면 리소스 서비스에서 파서와 필터를 직접 짜지 않는다. `spring.security.oauth2.resourceserver.jwt.jwk-set-uri`만 설정하고 `JwtAuthenticationConverter`로 권한 접두사(`SCOPE_`)만 지운다.

### MSA (d) 사용자 정보가 더 필요할 때

user 테이블을 리소스 서비스에서 직접 읽지 않는다. 그 순간 DB 스키마가 서비스 간 계약이 되어 auth가 컬럼 하나 못 바꾼다. 클레임에 담거나(작고 잘 안 바뀌는 값만), auth에 벌크로 물어보고 캐시한다. 목록 API에서 단건 조회를 N번 부르는 코드가 반드시 생기니 처음부터 `findAllByIds`로 만든다.

## 2. 토큰 계약 - 이유

- `sub`에 username을 넣으면 username이 바뀔 때 발급된 토큰이 전부 미아가 된다.
- `hasRole("ADMIN")`은 내부적으로 `ROLE_ADMIN`을 찾으므로 접두사 없는 권한과 조용히 어긋난다. 팀 안에서 두 번 정하면 반드시 한쪽이 틀린다. 그래서 `ROLE_` 접두사를 붙이지 않고 `hasAuthority('ADMIN')`으로 통일한다.
- access를 길게 잡아 리프레시를 생략하면 로그아웃과 권한 회수가 불가능해진다.
- access를 쿼리스트링으로 받으면 서버 로그, Referer에 남는다.

## 3. 클레임 드리프트 - 이유

발급 측이 넣지 않는 클레임을 검증 측이 읽으면 `claims.get("userId")`가 조용히 `null`을 반환하고, 필터는 인증을 통과시키고, 한참 뒤 엉뚱한 곳에서 NPE가 난다. 컴파일도 단위 테스트도 못 잡는다.

MSA에서 클레임을 추가할 때 읽는 쪽을 먼저 올리면 그 사이 모든 요청이 `null`을 본다. 그래서 발급 측을 먼저 배포하고, 제거는 반대 순서다.

`JwtClaims`를 공유 jar로 만들면 라이브러리 버전 하나 때문에 전 서비스를 동시 배포해야 하는 결합이 생긴다. 파일 하나 복사가 낫다.

## 4. 리프레시 토큰 - 이유

- 재사용 감지: 서명은 유효한데 저장소에 없다 = 이미 회전됐거나 로그아웃된 토큰의 재사용 = 탈취 의심.
- 해시 저장: DB가 유출돼도 토큰을 못 쓴다.
- `userId` unique를 걸면 폰+PC 동시 로그인이 그 자리에서 깨진다.
- 쿠키 `Path`를 재발급 엔드포인트로 좁히는 이유: 모든 요청에 실려 가지 않게.
- 만료 행을 지우는 스케줄러가 없으면 테이블이 무한히 큰다.
- `jti` 블랙리스트를 넣으면 요청마다 Redis 왕복이 붙고 Redis가 인증의 단일 장애점이 된다. 그래서 access 무효화는 포기하고 TTL을 짧게 유지하는 게 기본이다.

## 5. Security 설정 - 이유

- `STATELESS`가 없으면 세션이 만들어져 JWT와 세션 인증이 섞인다.
- `AuthenticationEntryPoint`/`AccessDeniedHandler`가 없으면 기본 HTML 302 리다이렉트나 500이 난다.
- 공개 경로 목록을 필터에도 두면 `SecurityConfig`와 어긋난다(6장).
- 로그인 엔드포인트에 요청 제한이 없으면 비밀번호 대입 공격에 그대로 노출된다.

## 6. 하지 말 것 - 상세

- **`ResponseCookie.maxAge(long)`의 단위는 초다.** 밀리초 상수를 넣으면 80년짜리 쿠키가 나간다. `maxAge(Duration)`을 넘겨 실수를 원천 차단한다.
- **`SignatureException`은 jjwt 0.12+에서 `io.jsonwebtoken.security` 패키지다.** `io.jsonwebtoken.*` 와일드카드로 안 잡히고, `java.lang.SecurityException`을 잡으면 미포착으로 500이 난다. 검증 메서드는 `JwtException`(서명/만료/형식 오류의 공통 부모)과 `IllegalArgumentException`(빈 토큰)을 잡아 `false`를 반환하고, 만료만 구분이 필요하면 `ExpiredJwtException`을 먼저 잡는다.
- **리포지토리 구현을 `return Optional.empty();` 스텁으로 두지 않는다.** 컴파일이 되니 아무도 모르고 리프레시가 통째로 죽는다. Spring Data가 만들어주는 인터페이스를 직접 구현하지 않는 게 답이고, 굳이 비워둘 거면 `UnsupportedOperationException`을 던져 실행 즉시 터지게 한다.
- **필터에서 `sendError(401)`을 직접 쏘지 않는다.** 공개 경로 목록이 필터와 `SecurityConfig` 두 곳으로 갈라져 반드시 어긋난다. 필터는 토큰이 있으면 인증만 채우고, 통과 여부는 `authorizeHttpRequests` 한 곳에서 정한다.
- **OAuth 성공 후 JSON 바디를 쓰지 않는다.** 브라우저 리다이렉트 흐름이라 SPA가 읽을 수 없다. 프론트 콜백으로 리다이렉트한다. 넘기는 방식은 두 가지 중 하나: (1) refresh는 쿠키, access는 URL 프래그먼트(`#access=`)로. 쿼리스트링은 서버 로그와 Referer에 남는다. (2) 더 안전하게는 일회용 코드만 URL로 넘기고 프론트가 그 코드로 토큰을 교환한다. 요구 보안 수준에 따라 고른다.
- **소셜 `providerId`를 `(String)` 캐스팅하지 않는다.** 카카오, 깃허브는 숫자, 구글은 문자열이다. `String.valueOf`로 통일.
- **크로스 도메인이면 쿠키에 `SameSite=None; Secure`가 필요하다.** 없으면 리프레시 쿠키가 아예 전송되지 않는다. 쿠키를 쓰므로 CORS `allowedOrigins`에 `"*"`를 못 쓴다(`allowCredentials=true`와 함께 쓰면 스프링이 기동 시 거부한다).
- **로그인 실패 메시지를 구분하지 않는다.** 없는 아이디와 틀린 비밀번호를 같은 문구로. 계정 열거 방지.
- **시크릿을 yml에 하드코딩하지 않는다.** 커밋되면 히스토리에 영구히 남아 키 재발급 외엔 방법이 없다. HS256 시크릿은 최소 256비트(32바이트). 짧으면 jjwt 0.12가 발급 시점에 `WeakKeyException`을 던진다.
- **비밀번호를 응답 DTO, 로그, `toString`에 싣지 않는다.** `User` 엔티티를 컨트롤러에서 직접 반환하는 순간 새어 나간다.

## 7. 확장 지점 - 이유

- 소셜 제공자 추가: provider별 attribute 파싱(`id`, `email`, `name` 꺼내는 위치)을 `enum + Function`으로 두고, 다른 곳에 `if/switch`를 만들지 않는다. `ddd-spring` 스킬 9번(전략 패턴 조건)에 해당한다.
- 권한이 역할 하나로 안 끝나고 리소스별 권한(부서, 프로젝트 단위)이 필요해지면 클레임에 넣지 말고 리소스 서비스에서 조회한다. 클레임이 커지면 헤더 크기 제한에 걸린다.

## 8. 관측성 - 이유

- MDC를 `finally`에서 지우지 않으면 스레드 풀 재사용 때문에 남의 요청 로그에 다른 사용자 id가 찍힌다.
- 인증 실패 로그 문구가 서비스마다 다르면 로그 기반 알림이 조용히 0건을 보고한다.
- 401 급증의 원인은 대개 셋이다: 시크릿 드리프트 / 키 롤오버 실패 / 프론트가 리프레시를 안 태움. 로그 문구로 셋이 구분되게 남긴다. 이 로그가 없으면 원인 찾는 데 하루가 든다.

## 9. 완료 기준

전부 통과해야 끝난 것이다. MSA면 SKILL.md의 마지막 두 항목이 추가된다.

## 참고

- `ddd-spring` 스킬 - 패키지 구조, 엔티티 규칙(`@Setter` 금지 등은 거기서), 전략 패턴 조건
- `test-writing-guide` 스킬 - 클레임 계약 테스트, 필터 슬라이스 테스트
- Spring Security - JWT Resource Server: https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html
- jjwt README (0.12에서 바뀐 패키지, WeakKeyException): https://github.com/jwtk/jjwt
- Spring Security 7 마이그레이션 (PathPatternRequestMatcher, 상대 리다이렉트, 쿠키 커스터마이저): https://docs.spring.io/spring-security/reference/migration/
- OWASP - JWT Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
