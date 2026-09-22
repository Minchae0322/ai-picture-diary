package com.jellydiary.llm.config;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * app.llm.* - 모델 배선. 도메인마다 다르지 않아 별도 컨텍스트(com.jellydiary.llm)로 뺐다.
 * 업무 도메인이 아니라 기술 컨텍스트다 - 그래서 여러 도메인이 참조해도 도메인 간 참조 금지에 걸리지 않는다.
 * 도메인 자신은 이 클래스를 모른다 - 어댑터(llm.painter)만 읽는다.
 *
 * <p>실제 모델을 붙일 때 여기에 함께 오는 것들: 모델명, 타임아웃, maxTokens, 하루 호출 상한, API 키 참조.
 * <b>상한 없이 배포하지 않는다</b>(llm-integration 4장) - 호출마다 돈이 나간다.
 * 지금은 대역만 있어 실제로 쓰이는 값만 둔다. 쓰지 않는 필드를 미리 만들면 기동 검증이 거짓말을 한다.
 */
@Validated
@ConfigurationProperties(prefix = "app.llm")
public record LlmProperties(@NotBlank String provider, @NotNull Duration mockDelay) {}
