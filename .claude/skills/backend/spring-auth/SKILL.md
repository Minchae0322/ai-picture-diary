---
name: spring-auth
description: Spring Boot에 사용자 인증(회원가입/로그인/OAuth2/JWT/리프레시/로그아웃/인가)을 새로 붙이거나 기존 인증을 점검할 때. 첫 결정은 모놀리식이냐 MSA냐이고 그에 따라 구조가 갈린다. "로그인 붙여줘", "JWT", "소셜 로그인", "리프레시 토큰", "인증 서버", "401이 나요" 같은 요청에 사용. 구현 코드가 아니라 결정 사항과 사고 목록을 담는다.
---

# Spring Boot 사용자 인증

## 목적

세션 없는 JWT 인증을 붙일 때 **무엇을 결정하고 무엇을 하지 말아야 하는지**를 정한다. 구현 코드는 결정이 끝난 뒤 그 자리에서 쓴다. 이 순서대로 가면 빈 프로젝트에서도 사용자 도메인이 완성된다.
기본 스택: Java 25 / Spring Boot 4.1 / Spring Security 7.1 / jjwt 0.13.x(0.12와 API 동일). 구버전에도 그대로 적용된다. Boot 2.7/3/4 차이(DSL, 패키지, 경로 매칭)는 `reference.md` 표 참고.

## 언제 적용

새 프로젝트에 로그인/회원가입/인가 추가, 소셜 로그인(OAuth2) 추가, 리프레시/로그아웃/동시 로그인 정책 결정, 이유 없는 401/403 또는 특정 서비스만 인증이 깨질 때, MSA에서 인증 서비스와 리소스 서비스를 나눌 때.

## 1. 첫 분기 - 모놀리식이냐 MSA냐

여기서 갈린 게 나머지 전부를 정한다. 아래로 판단하고, 애매하면 그때만 묻는다.

| 신호 | 결론 |
|---|---|
| 앱 하나가 API 전부를 담당 | 모놀리식 |
| 인증 코드가 사용자 테이블을 직접 조회 가능 | 모놀리식 |
| 인증 전담 앱/레포가 있거나 만들 예정 | MSA |
| 리소스 서비스가 사용자 테이블에 접근 못 함 | MSA |
| 게이트웨이가 앞단에 있음 | MSA |

**나중에 쪼갤 것 같다고 미리 MSA로 짓지 않는다.**

**모놀리식이면**
- 한 앱이 발급하고 자기가 검증한다. 대칭키(HS256) 하나. 필터에서 DB를 볼 수 있으므로 클레임을 욕심내지 않는다.
- 구성 순서: `User`/`Role` -> `PasswordEncoder` -> `JwtProvider`(발급+검증) -> `RefreshToken` + 저장소 -> `AuthService` -> `AuthController` -> `JwtFilter` -> `SecurityConfig` -> (소셜) -> `@CurrentUserId`.
- 패키지는 `ddd-spring` 스킬의 4계층. `auth`가 하나의 바운디드 컨텍스트, `User`는 `member`(또는 `user`) 컨텍스트의 애그리거트이고 `auth`는 ID로 참조한다.

**MSA면** - 발급 서비스는 모놀리식 구성 그대로, **리소스 API만 갖지 않는다.** 달라지는 건 네 가지.
- (a) 키 전략: 서비스 3개 이하 + 한 팀이면 HS256 가능. 그 외, 특히 외부 팀이 리소스 서비스를 만들면 **RS256**(JWKS). RS256이면 리소스 서비스에서 파서/필터를 직접 짜지 않고 `spring.security.oauth2.resourceserver.jwt.jwk-set-uri` 설정 + `JwtAuthenticationConverter`로 `SCOPE_` 접두사만 지운다. 비교표는 `reference.md`.
- (b) 리소스 서비스가 가지면 안 되는 것(하나라도 있으면 경계 붕괴): `User` 엔티티 / 사용자 테이블 / `oauth2-client` 의존성 / `PasswordEncoder` / 토큰 **발급** 코드 / 리프레시 저장소.
- (c) 클레임 계약 유지(3장). MSA 인증 사고의 대부분이 여기서 난다.
- (d) 사용자 정보가 더 필요하면 user 테이블을 직접 읽지 않는다. 클레임에 담거나(작고 잘 안 바뀌는 값만) auth에 **벌크로**(`findAllByIds`) 물어보고 캐시한다.

## 2. 토큰 계약 - 두 분기 공통

```
sub       사용자 PK (문자열). username 아님
userId    Long. sub와 같은 값, 형변환 없이 쓰라고 중복 제공
username  표시용. 바뀌므로 식별자로 쓰지 않는다
auth      권한 콤마 구분. "USER" / "ADMIN"
provider  local | google | naver | kakao | github
jti       refresh에만. 회전·재사용 감지용
```

- **`sub`에 username을 넣지 않는다.**
- **`ROLE_` 접두사를 붙이지 않는다.** `"ADMIN"`으로 통일하고 인가는 `hasRole`이 아니라 **`hasAuthority('ADMIN')`**.
- **클레임 키는 `JwtClaims` 상수 클래스 한 곳에.** 문자열 리터럴을 두 번 쓰지 않는다. 공유 jar로 만들지 않는다(파일 복사가 낫다).
- **access 30분 / refresh 14일.** access를 길게 잡아 리프레시를 생략하지 않는다.
- access는 `Authorization: Bearer` 헤더로만. 쿼리스트링 금지.

## 3. 가장 비싼 사고 - 클레임 드리프트

- 발급 측이 넣지 않는 클레임을 검증 측이 읽는 사고. 컴파일도 단위 테스트도 못 잡는다.
- 막는 방법은 하나: **발급한 토큰을 검증 측 코드로 파싱해 모든 계약 클레임이 non-null인지 확인하는 테스트.** 인증 작업에서 테스트를 하나만 쓴다면 이것.
- MSA에서 클레임 추가는 **발급 측 먼저 배포**, 제거는 반대 순서.

## 4. 리프레시 토큰

- **회전한다.** 사용된 토큰은 즉시 폐기하고 새 쌍을 발급한다.
- **재사용을 감지한다.** 서명 유효 + 저장소에 없음 = 탈취 의심. 그 사용자의 전체 세션을 끊는다.
- **해시(SHA-256)로 저장한다.** 평문 저장 금지.
- **`userId`에 unique를 걸지 않는다.** 유니크는 토큰 해시에(동시 로그인).
- 웹 클라이언트면 refresh는 **`HttpOnly; Secure` 쿠키**, `Path`는 `/api/auth/refresh`로 좁힌다. 모바일/서버 간이면 바디로.
- 만료 행을 지우는 스케줄러를 둔다.
- access 무효화는 포기하고 TTL을 짧게. `jti` 블랙리스트는 즉시 차단이 **요구사항으로 명시됐을 때만**.

## 5. Security 설정 필수

- `SessionCreationPolicy.STATELESS`.
- API 서버면 `csrf().disable()`. 쿠키 refresh 엔드포인트는 `SameSite` + Origin 검증으로 방어한다는 것을 알고 끈다.
- `AuthenticationEntryPoint`(401)와 `AccessDeniedHandler`(403)를 JSON 응답으로 등록.
- `PasswordEncoder`는 `BCryptPasswordEncoder` 또는 `DelegatingPasswordEncoder`. 직접 해시 금지.
- 공개 경로(`/api/auth/**`, 헬스체크, 문서)는 `authorizeHttpRequests` **한 곳**에만.
- Security 7에서 `requestMatchers("api/**")`처럼 `/`가 빠진 패턴은 매칭되지 않는다. 절대 경로로. 6 -> 7 업그레이드 후 401이면 이것부터.
- 로그인 엔드포인트에 요청 제한(rate limit). 게이트웨이나 필터 한 줄이라도.

## 6. 하지 말 것 (전부 실제로 터진 것들)

- `ResponseCookie.maxAge(long)`의 단위는 초. `maxAge(Duration)`을 넘긴다.
- `SignatureException`은 jjwt 0.12+에서 `io.jsonwebtoken.security` 패키지. 검증은 `JwtException` + `IllegalArgumentException`을 잡아 `false`, 만료 구분이 필요하면 `ExpiredJwtException`을 먼저.
- 리포지토리 구현을 `return Optional.empty();` 스텁으로 두지 않는다. 비워둘 거면 `UnsupportedOperationException`.
- 필터에서 `sendError(401)`을 직접 쏘지 않는다. 필터는 인증만 채우고 통과 여부는 `authorizeHttpRequests`에서.
- OAuth 성공 후 JSON 바디 금지. 프론트 콜백으로 리다이렉트: (1) refresh 쿠키 + access URL 프래그먼트(`#access=`) 또는 (2) 일회용 코드 교환. 쿼리스트링 금지.
- 소셜 `providerId`를 `(String)` 캐스팅하지 않는다. `String.valueOf`로 통일.
- 크로스 도메인이면 쿠키에 `SameSite=None; Secure`. CORS `allowedOrigins`에 `"*"` 금지(`allowCredentials=true`와 충돌).
- 로그인 실패 메시지를 구분하지 않는다(계정 열거 방지).
- 시크릿을 yml에 하드코딩하지 않는다. HS256 시크릿은 최소 256비트(32바이트).
- 비밀번호를 응답 DTO, 로그, `toString`에 싣지 않는다. `User` 엔티티를 컨트롤러에서 직접 반환하지 않는다.

## 7. 확장 지점

- 소셜 제공자 추가는 enum 상수 하나로 끝나야 한다. attribute 파싱은 `enum + Function`, 다른 곳에 `if/switch` 금지(`ddd-spring` 스킬 9번).
- 리소스별 권한(부서, 프로젝트)은 클레임에 넣지 말고 리소스 서비스에서 조회한다.

## 8. 관측성

- 필터에서 `MDC.put("userId", ...)` 후 **`finally`에서 반드시 지운다.**
- 인증 실패 로그 접두사 통일(`[auth-jwt] ...`).
- 401 급증 원인 셋(시크릿 드리프트 / 키 롤오버 실패 / 프론트가 리프레시를 안 태움)이 로그 문구로 구분되게. HS256 MSA에서 "특정 서비스만 전부 401"이면 그 서비스의 `JWT_SECRET`부터.

## 9. 완료 기준

- [ ] 가입 -> 로그인 -> 보호된 API 호출이 통과
- [ ] 토큰 없으면 401, 권한 부족이면 403 (500 아님, JSON 응답)
- [ ] 만료된 access -> 401, 리프레시로 재발급 후 재시도 성공
- [ ] 리프레시가 회전되고, 폐기된 토큰 재사용 시 전체 세션이 끊긴다
- [ ] 로그아웃 후 그 리프레시로 재발급 실패
- [ ] 같은 계정 두 기기 동시 로그인 가능
- [ ] 소셜 신규 사용자 자동 가입, 재로그인 시 중복 생성 없음
- [ ] 일반 사용자가 관리자 엔드포인트 호출 시 403
- [ ] 없는 아이디와 틀린 비밀번호의 응답이 같다
- [ ] 시크릿이 전부 환경변수
- [ ] **클레임 계약 테스트가 있다** (3장)
- [ ] (MSA) 발급한 토큰을 **리소스 서비스 코드로** 파싱해 모든 계약 클레임이 non-null
- [ ] (MSA) 리소스 서비스에 사용자 테이블, 발급 코드, `oauth2-client`가 없다

관련: `ddd-spring` 스킬(패키지/엔티티 규칙/전략 패턴), `test-writing-guide` 스킬(클레임 계약 테스트, 필터 슬라이스 테스트).

## 더 보기
- 이유, 예시 코드, 상세 표, 참고 링크: `reference.md` (판단이 안 서거나 처음 적용할 때만 읽는다)
