# test-writing-guide - 참고 자료

`SKILL.md`의 규칙에 대한 이유, 예시 코드, 참고 링크를 담는다. SKILL.md와 함께 읽는다.

## 테스트 계층과 선택 기준 - 이유

- 순수 로직은 스프링 없이 단위 테스트가 가장 빠르고 가장 많이 쓴다.
- 쿼리를 Mock으로 검증하면 SQL 오류를 잡을 수 없다. H2는 방언 차이로 운영과 다른 결과를 내므로 기본 선택지로 쓰지 않는다.
- 트랜잭션 전파, 이벤트 리스너, `@Async`는 `@SpringBootTest`에서만 실제 동작이 검증된다.
- 같은 모듈 안의 협력 객체까지 전부 Mock하면 구현에 결합된 테스트가 된다. 그래서 Mock은 외부 경계에만 쓴다.

## 경계값 테스트는 필수 - 이유

버그의 대부분은 정상 범위 한가운데가 아니라 **경계**에서 난다. 0, 최대값, 딱 넘는 값, 빈 값, null, 마지막 페이지, 자정, 월말. 행동 하나를 테스트할 때 "정상 1개"로 끝내지 않고, 입력마다 표를 훑어 해당하는 경계에 테스트를 둔다.

### 경계 결정 규칙 - 이유

- `<` vs `<=` 한 글자 차이가 가장 흔한 버그다. 그래서 포함/불포함이 애매한 경계는 양쪽 다 테스트한다.
- 애플리케이션 검증과 DB 제약이 다르면(앱은 200자 허용, 컬럼은 100자) 그게 버그다.
- 경계마다 테스트를 따로 두면 개수가 많아진다. `@ParameterizedTest`로 묶되, 하나의 파라미터 테스트에 예외 기대와 정상 기대를 섞지 않는다.

### 경계 테스트 예시

```java
@ParameterizedTest(name = "수량 {0}은 허용")
@ValueSource(ints = {1, 50})
void 수량_경계_허용(int qty) {
    assertThatCode(() -> OrderLine.of(product, qty)).doesNotThrowAnyException();
}

@ParameterizedTest(name = "수량 {0}은 거부")
@ValueSource(ints = {0, 51, -1})
void 수량_경계_거부(int qty) {
    assertThatThrownBy(() -> OrderLine.of(product, qty))
        .isInstanceOf(InvalidQuantityException.class);
}

@ParameterizedTest(name = "만료 {0}, 현재 {1} -> 만료 여부 {2}")
@CsvSource({
    "2026-09-08T10:00:00, 2026-09-08T09:59:59, false",
    "2026-09-08T10:00:00, 2026-09-08T10:00:00, true",    // 정각 포함/불포함은 코드 확인 후 확정
    "2026-09-08T10:00:00, 2026-09-08T10:00:01, true",
})
void 만료_경계(LocalDateTime expiresAt, LocalDateTime now, boolean expected) {
    assertThat(Token.of(expiresAt).isExpired(now)).isEqualTo(expected);
}
```

### 경계 테스트가 없으면 리뷰에서

숫자 제한, 길이 제한, 날짜 비교, 페이징, 상태 전이가 있는 코드에 경계 테스트가 없으면 `spring-code-review` 스킬 기준 `[MAJOR]`다. "정상 케이스 테스트는 있다"는 이유가 되지 않는다.

## 규칙 - 이유

- `@Nested`로 상황별 그룹핑을 하면 큰 테스트 클래스가 읽기 쉬워진다.
- 안 쓰는 스터빙은 `UnnecessaryStubbingException`으로 실패하게 두는 것이 맞다(strict stubs 기본값 유지).
- 내부 메서드 호출 횟수 검증은 구현 결합이다. 그래서 `verify`는 부수 효과에만 쓴다.
- `any()` 남용 금지: 실제 값으로 매칭 가능하면 실제 값을 쓴다.
- `@MockitoBean`은 컨텍스트 캐시를 깨서 느려진다.
- Boot 4에서 기존 `spring-boot-starter-test` 하나로 다 되던 방식은 과도기용 `spring-boot-starter-test-classic`이다.
- 통합 테스트를 Gradle 별도 태스크로 분리하는 이유: 단위 테스트를 빠르게 유지한다.

## 예시

단위 테스트 - 도메인 로직

```java
class OrderTest {

    @Test
    @DisplayName("재고가 부족하면 주문 생성에 실패한다")
    void 재고부족_주문생성_실패() {
        Product product = Product.of("keyboard", stock(0));

        assertThatThrownBy(() -> Order.create(product, quantity(1)))
            .isInstanceOf(OutOfStockException.class)
            .hasMessageContaining("keyboard");
    }
}
```

슬라이스 테스트 - 리포지토리 (Testcontainers)

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class ArticleRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @Autowired ArticleRepository articleRepository;

    @Test
    void 상태와_기간으로_조회하면_최신순으로_반환한다() {
        articleRepository.saveAll(List.of(
            article("old", PUBLISHED, at("2026-01-01")),
            article("new", PUBLISHED, at("2026-02-01")),
            article("draft", DRAFT,   at("2026-03-01"))));

        List<Article> result = articleRepository.findPublishedBetween(
            at("2026-01-01"), at("2026-12-31"));

        assertThat(result).extracting(Article::getTitle)
            .containsExactly("new", "old");
    }
}
```

컨트롤러 슬라이스 - 검증과 예외 핸들러

```java
@WebMvcTest(ArticleController.class)
class ArticleControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean ArticleService articleService;   // Boot 4: @MockBean 없음

    @Test
    void 제목이_비어있으면_400을_반환한다() throws Exception {
        mockMvc.perform(post("/api/articles")
                .contentType(APPLICATION_JSON)
                .content("""
                    {"title": "", "body": "content"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("title"));
    }
}
```

## 참고

- Spring Boot - Testing: https://docs.spring.io/spring-boot/reference/testing/index.html
- Spring Boot - Testcontainers Support: https://docs.spring.io/spring-boot/reference/testing/testcontainers.html
- JUnit 6 User Guide (패키지는 `org.junit.jupiter` 그대로, JUnit 4 vintage 제거, Java 17+): https://junit.org/
- Spring Boot 4.0 Migration Guide (테스트 스타터, @MockBean 제거): https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide
- Mockito - Strict stubs: https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/quality/Strictness.html
- AssertJ: https://assertj.github.io/doc/
