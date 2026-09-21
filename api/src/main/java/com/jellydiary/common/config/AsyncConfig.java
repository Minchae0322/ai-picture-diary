package com.jellydiary.common.config;

import org.springframework.boot.task.ThreadPoolTaskExecutorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.support.ContextPropagatingTaskDecorator;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * AI 생성은 요청 스레드 밖에서 돈다. ContextPropagatingTaskDecorator 가 없으면 traceId가 여기서 끊긴다
     * (logging-observability 4장).
     */
    @Bean("aiExecutor")
    TaskExecutor aiExecutor(ThreadPoolTaskExecutorBuilder builder) {
        return builder
                .corePoolSize(2)
                .maxPoolSize(4)
                .queueCapacity(50)
                .threadNamePrefix("ai-")
                .taskDecorator(new ContextPropagatingTaskDecorator())
                .build();
    }
}
