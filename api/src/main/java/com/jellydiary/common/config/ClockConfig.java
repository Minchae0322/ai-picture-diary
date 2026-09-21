package com.jellydiary.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/** 현재 시각은 주입받는다. 도메인/서비스가 now()를 직접 부르지 않는다(ddd-spring). */
@Configuration
public class ClockConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
