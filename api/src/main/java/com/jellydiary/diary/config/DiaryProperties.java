package com.jellydiary.diary.config;

import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.domain.DiaryPolicy;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * app.* 설정. 빠지거나 범위를 벗어나면 기동 순간에 터진다(config-and-secrets 5장).
 * 일기의 업무 상한은 전부 여기 한 곳에 있고, 도메인에는 DiaryPolicy로 넘긴다.
 */
@Validated
@ConfigurationProperties(prefix = "app")
public record DiaryProperties(
        @NotBlank String timezone, @Valid @NotNull DiaryLimits diary, @Valid @NotNull Ai ai) {

    /** maxContentLength는 DB 컬럼 길이를 넘을 수 없다. 넘으면 저장 시점에 잘린다. */
    public record DiaryLimits(
            @Min(1) @Max(Diary.CONTENT_COLUMN_LENGTH) int maxContentLength,
            @Min(0) int dailyRegenerateLimit,
            int moodMin,
            int moodMax) {}

    public record Ai(@NotBlank String provider, @NotNull Duration mockDelay) {}

    public DiaryPolicy policy() {
        return new DiaryPolicy(
                diary.maxContentLength(), diary.dailyRegenerateLimit(), diary.moodMin(), diary.moodMax());
    }

    public ZoneId zone() {
        return ZoneId.of(timezone);
    }
}
