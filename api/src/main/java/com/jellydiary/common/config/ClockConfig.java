package com.jellydiary.common.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 현재 시각은 주입받는다. 도메인/서비스가 now()를 직접 부르지 않는다(ddd-spring).
 *
 * <p>시계의 존은 app.timezone("오늘"의 경계)이다. 이걸 UTC로 두면 날짜를 다루는 쪽마다 withZone 을 기억해야
 * 하고, 한 군데라도 빠지면 자정 근처에서만 틀리는 버그가 된다.
 */
@Configuration
public class ClockConfig {

    @Bean
    Clock clock(@Value("${app.timezone}") String timezone) {
        return Clock.system(ZoneId.of(timezone));
    }
}
