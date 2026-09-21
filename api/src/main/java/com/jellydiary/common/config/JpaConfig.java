package com.jellydiary.common.config;

import com.jellydiary.common.auth.CurrentUser;
import java.util.Optional;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class JpaConfig {

    /** 감사 컬럼용 현재 사용자. 인증이 붙으면 SecurityContext에서 꺼내도록 이 빈만 바꾼다. */
    @Bean
    AuditorAware<Long> auditorAware() {
        return () -> Optional.of(CurrentUser.idOrSystem());
    }
}
