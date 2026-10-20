package com.jellydiary.profile;

import static org.assertj.core.api.Assertions.assertThat;

import com.jellydiary.profile.service.ProfileService;
import java.lang.reflect.Method;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;

/**
 * 인증이 붙기 전까지 프로필은 "첫 조회에 만든다". 그래서 겉보기에 읽기인 메서드가 쓰기를 한다.
 *
 * <p>이 테스트는 어노테이션을 본다 - 실제 실패는 진짜 커넥션에서만 재현되고(읽기 전용 커넥션의 INSERT), 그 검증에는 DB 가 필요해 `./gradlew test`
 * 에서는 돌지 않기 때문이다. 값이 싼 대신 회귀는 정확히 잡는다.
 */
class ProfileServiceTransactionTest {

    @Test
    @DisplayName("프로필을 만들 수 있는 조회는 읽기 전용이면 안 된다")
    void 프로필을_만드는_조회는_읽기전용이_아니다() throws NoSuchMethodException {
        Method storeItems = ProfileService.class.getMethod("storeItems", Long.class);
        Transactional annotation = storeItems.getAnnotation(Transactional.class);

        assertThat(annotation).as("storeItems 는 프로필을 만들 수 있어 클래스의 readOnly 를 덮어써야 한다").isNotNull();
        assertThat(annotation.readOnly()).isFalse();
    }
}
