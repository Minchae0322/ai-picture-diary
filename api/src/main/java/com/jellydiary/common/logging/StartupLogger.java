package com.jellydiary.common.logging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/** 기동 1줄. 설정값 덤프는 하지 않는다(config-and-secrets 6장). */
@Slf4j
@Component
public class StartupLogger {

    private final Environment environment;

    public StartupLogger(Environment environment) {
        this.environment = environment;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        AppLog.event(log, "app.started")
                .with("profile", String.join(",", environment.getActiveProfiles()))
                .info("application started");
    }
}
