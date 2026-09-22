package com.jellydiary.diary.config;

import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.type.DiaryPolicy;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * app.diary.* 설정. 빠지거나 범위를 벗어나면 기동 순간에 터진다(config-and-secrets 5장).
 * 일기의 업무 상한은 전부 여기 한 곳에 있고, 도메인에는 DiaryPolicy로 넘긴다.
 *
 * <p>시간대(app.timezone)는 여기 없다. 특정 도메인의 값이 아니라 Clock 빈이 통째로 물고 있다(ClockConfig).
 */
@Validated
@ConfigurationProperties(prefix = "app.diary")
public record DiaryProperties(
        /** DB 컬럼 길이를 넘을 수 없다. 넘으면 저장 시점에 잘린다. */
        @Min(1) @Max(Diary.CONTENT_COLUMN_LENGTH) int maxContentLength,
        @Min(0) int dailyRegenerateLimit,
        int moodMin,
        int moodMax) {

    public DiaryPolicy policy() {
        return new DiaryPolicy(maxContentLength, dailyRegenerateLimit, moodMin, moodMax);
    }
}
