---
name: test-writing-guide
description: 테스트를 새로 쓰거나 고칠 때 자동 적용. "테스트 짜줘", "테스트 추가", "테스트 깨져", "Mock", "@MockitoBean", "Testcontainers", "커버리지", "통합 테스트" 요청이나 src/test 파일이 생기는 순간 트리거. 단위/슬라이스/통합 계층 선택, 경계값 테스트 필수, Mockito 규칙, 컨텍스트 캐싱, 무엇을 테스트하지 않는가. 프롬프트·모델 변경의 회귀 검증은 prompt-and-eval.
---

# 테스트 작성 가이드

## 목적

스프링 부트 프로젝트에서 **빠르고, 독립적이며, 실패 이유가 바로 읽히는** 테스트를 쓴다. 구현이 아니라 **행동(behavior)** 을 검증한다. 리팩터링해도 깨지지 않는 테스트가 좋은 테스트다.

## 언제 적용

새 기능/버그 수정에 테스트를 붙일 때, 느리거나 깨지기 쉬운 기존 테스트를 정리할 때, 리뷰의 "테스트가 없다" 코멘트에 답할 때.

## 테스트 계층과 선택 기준

| 계층 | 도구 | 대상 | 컨텍스트 로딩 | 비율 목표 |
|---|---|---|---|---|
| 단위 | JUnit Jupiter 6 + Mockito (또는 순수 자바) | 도메인 로직, 유틸, 서비스 분기 | 없음 | 가장 많이 |
| 슬라이스 | `@DataJpaTest`, `@WebMvcTest`, `@JsonTest` | 리포지토리 쿼리, 컨트롤러 매핑/검증, 직렬화 | 일부 | 중간 |
| 통합 | `@SpringBootTest` + Testcontainers | 트랜잭션 경계, 여러 컴포넌트 협력, 실제 DB 방언 | 전체 | 핵심 흐름만 |

- 순수 로직(계산, 상태 전이, 검증)은 스프링 없이 단위 테스트.
- 쿼리(JPQL, QueryDSL, 네이티브)는 반드시 실제 DB로. `@DataJpaTest` + Testcontainers(PostgreSQL/DB2). H2는 기본 선택지가 아니다.
- 트랜잭션 전파, 이벤트 리스너, `@Async`는 `@SpringBootTest`에서만.
- Mock은 **외부 경계**(외부 API, 메일, 시간, 랜덤)에만.

## 절차

1. 테스트 대상의 **행동**을 문장으로 먼저 쓴다. "재고가 0이면 주문 시 `OutOfStockException`이 난다".
2. 그 문장을 테스트 메서드 이름으로. `@DisplayName` 또는 한국어 메서드명, 팀 규칙에 맞춘다.
3. given / when / then. given이 10줄 넘으면 픽스처/빌더로 뺀다.
4. 검증은 **한 가지 행동**에 집중. 같은 행동이면 여러 단언 가능, `assertAll` 또는 AssertJ 체이닝으로 묶는다.
5. 실패 메시지가 읽히게. `assertTrue(list.size() == 3)`보다 `assertThat(list).hasSize(3)`.
6. **경계값을 반드시 넣는다.** 아래 표를 입력마다 훑고 해당 경계마다 테스트를 하나씩.
7. **실패하는 것을 먼저 본다**(버그 수정 테스트는 특히). 처음부터 통과하는 테스트는 의심한다.

## 경계값 테스트는 필수

정상 케이스 1개 + 경계 케이스 N개가 기본 단위다.

### 입력 유형별 필수 경계

| 입력 유형 | 반드시 넣을 값 | 예 |
|---|---|---|
| 정수/수량/금액 | 0, 1, 최소값, 최대값, 최대값+1, 음수(허용 안 하면 거부 확인) | 주문 수량 0 / 1 / 50(상한) / 51 / -1 |
| 범위 제한 (min~max) | min-1, min, max, max+1 | 비밀번호 길이 7 / 8 / 64 / 65 |
| 문자열 | null, 빈 문자열, 공백만, 최대 길이, 최대 길이+1, 앞뒤 공백, 특수문자/이모지/한글 조합 | 제목 `""`, `"   "`, 200자, 201자, `"  제목  "` |
| 컬렉션 | 빈 목록, 1개, 최대 개수, 최대+1, 중복 원소 | 주문 항목 0 / 1 / 50 / 51 / 같은 상품 2줄 |
| 페이징 | 첫 페이지, 마지막 페이지, 마지막+1(빈 결과), size 0, size 최대+1, 총 개수가 size의 배수일 때 | page 0 / 마지막 / 마지막+1, size 0 / 1000 |
| 날짜/시간 | 경계 시각 정확히(포함/불포함), 경계 1초 전/후, 자정, 월말(28/29/30/31), 윤년 2/29, 연말, 시간대 경계(KST 자정 = UTC 15시) | 마감 `23:59:59` / `00:00:00` / 만료 시각 정각 |
| 기간 (start~end) | start == end, start > end(거부), 하루짜리, 겹치는 기간, 맞닿는 기간 | 예약 10:00~10:00, 10:00~09:00 |
| 상태 전이 | 허용된 전이 전부, 허용 안 된 전이 전부(거부 확인), 같은 상태로 재전이 | DRAFT->PUBLISHED 가능, PUBLISHED->PUBLISHED 거부 |
| 돈/소수 | 0, 최소 단위(1원, 0.01), 반올림 경계(x.5), 큰 값(long/BigDecimal 범위), 나눗셈 나머지 | 할인 33.333원 반올림, 3명이 100원 분배 |
| ID/참조 | 존재하지 않는 ID, 삭제된 대상, 다른 사용자의 대상(권한), 자기 자신 참조 | 없는 주문 ID, 남의 주문 취소 |
| 동시성 (필요 시) | 같은 자원에 동시 요청, 재고 1개에 2명 | 낙관적 락 충돌 |

### 경계 결정 규칙

- 경계값은 **코드에서 숫자를 읽어** 정한다. `MAX_ITEMS = 50`이면 50/51이면 충분(49는 정상 범위). 매직 넘버면 먼저 상수로 뽑는다.
- 포함/불포함이 애매한 경계(`<` vs `<=`)는 **양쪽 다** 테스트한다.
- 검증 애노테이션(`@Size(max = 200)`, `@Min(1)`) 필드는 컨트롤러 슬라이스에서 400 확인. 서비스 단위 테스트에서 또 하지 않는다.
- 도메인 불변식(생성자/팩터리의 `throw`)은 도메인 단위 테스트에서 경계값으로.
- DB 제약(컬럼 길이, unique)에 기대는 경계는 `@DataJpaTest`로 실제 DB에서. 앱 검증과 DB 제약이 다르면 버그다.
- `@ParameterizedTest` + `@CsvSource`/`@ValueSource`로 묶되, **성공 경계와 실패 경계는 다른 테스트**로.
- 숫자/길이 제한, 날짜 비교, 페이징, 상태 전이 코드에 경계 테스트가 없으면 `spring-code-review` 스킬 기준 `[MAJOR]`.

## 규칙

### 이름과 구조
- 클래스: `{대상}Test`. 통합은 `{대상}IntegrationTest`.
- 메서드: `{상황}_{행동}_{결과}` 또는 `@DisplayName("재고가 없으면 주문에 실패한다")`. 프로젝트 안에서 하나로 통일.
- given/when/then 주석은 생략 가능, 블록 사이 빈 줄로 구분. `@Nested`로 상황별 그룹핑.

### 독립성
- 순서 의존 금지. `@TestMethodOrder`는 원칙적으로 쓰지 않는다. 공유 가변 상태(static 필드, 싱글톤 캐시) 금지.
- DB 테스트는 자기 데이터를 만들고 롤백. `@DataJpaTest`/`@SpringBootTest`의 `@Transactional`은 기본 롤백. 롤백 불가(별도 스레드, `REQUIRES_NEW`)는 `@Sql` 또는 `@AfterEach`로 정리.
- 시간은 `Clock` 주입으로 고정. `LocalDateTime.now()` 직접 호출은 테스트 불가 코드.

### Mockito
- `@ExtendWith(MockitoExtension.class)` + `@Mock` + `@InjectMocks`. 스프링 컨텍스트 없이.
- 스터빙은 필요한 것만. strict stubs 기본값 유지(`UnnecessaryStubbingException`으로 실패하게).
- `verify`는 **부수 효과**(이벤트 발행, 외부 호출)에만. `any()` 남용 금지.
- `@MockitoBean`(Boot 4에서 `@MockBean` 제거. 3.4~3.5는 둘 다 가능)은 컨텍스트 캐시를 깬다. 통합 테스트에서 외부 경계 하나 정도만.

### 슬라이스 테스트
- `@DataJpaTest`는 기본 내장 DB로 교체. 실제 DB는 `@AutoConfigureTestDatabase(replace = NONE)` + Testcontainers.
- `@WebMvcTest(XController.class)`로 컨트롤러 하나만. 서비스는 `@MockitoBean`. 검증 대상: 요청 매핑, `@Valid`, 응답 상태/JSON 구조, 예외 핸들러.
- `@ServiceConnection`(Boot 3.1+)으로 Testcontainers 접속 정보 자동 주입. Testcontainers 2.x 아티팩트는 `org.testcontainers:testcontainers-postgresql`처럼 `testcontainers-` 접두사(1.x의 `postgresql`과 다름).
- Boot 4는 슬라이스별 테스트 스타터: `@WebMvcTest`는 `spring-boot-starter-webmvc-test`, 시큐리티는 `spring-boot-starter-security-test`. 과도기용 `spring-boot-starter-test-classic`. 정확한 이름은 Boot 4.0 마이그레이션 가이드로 확인.

### 통합 테스트 속도
- 컨텍스트 캐싱 최대 활용. `@MockitoBean` 조합/`@TestPropertySource`가 다르면 새로 뜬다. 공통 베이스 클래스(`AbstractIntegrationTest`) 하나로 통일.
- Testcontainers는 `static` 컨테이너 또는 싱글톤 패턴으로 재사용.
- 통합 테스트는 Gradle 별도 태스크(`integrationTest`)로 분리.

### 무엇을 테스트하지 않는가
- Getter/Setter, Lombok 생성 코드. 프레임워크 자체 동작(`@Transactional`이 롤백하는지). 단순 위임 메서드(통합 테스트 하나로 커버).

## 하지 말 것

- `Thread.sleep`으로 비동기 대기. Awaitility(`await().atMost(...)`)를 쓴다.
- private 메서드를 리플렉션으로 호출. private을 테스트하고 싶다면 설계 신호다.
- 하나의 테스트에서 if/for로 여러 시나리오. `@ParameterizedTest`를 쓴다.
- 커버리지 숫자를 맞추기 위한 테스트. 커버리지는 결과 지표일 뿐 목표가 아니다.
- 정상 케이스 하나로 "테스트 있음". 경계값(0, 최대, 최대+1, 빈 값, null, 경계 시각) 없이는 없는 것과 같다.
- 경계값을 코드의 상수와 무관하게 고르는 것. `MAX = 50`인데 100으로 테스트하면 경계를 안 본 것이다.
- 운영 DB나 공용 개발 DB에 붙는 테스트.

관련: AI 기능의 품질은 단위 테스트로 잡히지 않는다. 프롬프트·모델 변경의 회귀는 `prompt-and-eval`의 평가 셋으로 검증하고, 비용 때문에 일반 테스트와 분리한다.

## 더 보기
- 이유, 예시 코드, 상세 표, 참고 링크: `reference.md` (판단이 안 서거나 처음 적용할 때만 읽는다)
