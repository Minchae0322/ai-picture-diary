package com.jellydiary.profile.config;

import com.jellydiary.profile.domain.Profile;
import com.jellydiary.profile.type.ProfilePolicy;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * app.profile.* 설정. 빠지거나 범위를 벗어나면 기동 순간에 터진다(config-and-secrets 5장).
 *
 * <p>테마·캐릭터 기본값은 여기 없다. 그건 수치가 아니라 카탈로그의 한 항목이라 설정으로 두면
 * 존재하지 않는 코드를 넣을 수 있게 된다 - {@link com.jellydiary.profile.type.StoreItem} 의 상수로 남긴다.
 */
@Validated
@ConfigurationProperties(prefix = "app.profile")
public record ProfileProperties(
        @Min(1) @Max(Profile.NICKNAME_COLUMN_LENGTH) int maxNicknameLength,
        @NotBlank String defaultAiStyle) {

    public ProfilePolicy policy() {
        return new ProfilePolicy(maxNicknameLength, defaultAiStyle);
    }
}
