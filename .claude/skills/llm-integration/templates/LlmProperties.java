package com.example.app.infrastructure.ai;

import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.Map;
import java.util.Objects;

/**
 * LLM 설정. application.yml의 app.llm.* 를 바인딩한다.
 *
 * - apiKey는 반드시 ${LLM_API_KEY}로 주입한다. 기본값을 두지 않는다 (config-and-secrets).
 * - 상한 3종(maxInputChars, maxOutputTokens, maxCallsPerRequest)은 필수다.
 *   하나라도 없으면 무한 루프 한 번이 청구서가 된다 (llm-integration 4장).
 * - 모델명과 프롬프트 버전은 기능별로 둔다. 코드에 하드코딩하지 않는다.
 */
@Validated
@ConfigurationProperties("app.llm")
public record LlmProperties(

        @NotBlank String apiKey,

        /** 기능 -> 모델명. 예: {"summarize": "gpt-5-mini", "classify": "gpt-5-nano"} */
        @NotEmpty Map<String, String> models,

        /** 기능 -> 프롬프트 파일 버전. 예: {"summarize": 3} */
        @NotEmpty Map<String, Integer> promptVersions,

        /** 프롬프트에 넣을 사용자 입력 최대 길이(문자). 초과 시 자르거나 거절 */
        @Positive int maxInputChars,

        /** 응답 최대 토큰. 기본값에 맡기지 않는다 */
        @Positive int maxOutputTokens,

        /** 한 사용자 요청이 만들 수 있는 최대 호출 수. 에이전트 루프 방어 */
        @Positive int maxCallsPerRequest,

        /** 사용자별 일일 호출 한도 */
        @Positive int maxCallsPerUserPerDay,

        /** 단발 호출 타임아웃. 스트리밍은 별도 빈에서 더 길게 */
        @NotNull Duration timeout) {

    public String model(String feature) {
        return Objects.requireNonNull(models.get(feature), "모델 설정 없음: " + feature);
    }

    public int promptVersion(String feature) {
        return Objects.requireNonNull(promptVersions.get(feature), "프롬프트 버전 설정 없음: " + feature);
    }
}
