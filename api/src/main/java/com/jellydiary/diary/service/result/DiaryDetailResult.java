package com.jellydiary.diary.service.result;

import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.domain.DiaryPolicy;
import com.jellydiary.diary.domain.DiaryStatus;
import com.jellydiary.diary.domain.Weather;
import java.time.LocalDate;

/**
 * 일기 상세 조회 결과. "다시 그릴 수 있는가"는 상한(설정값)을 아는 service가 판단해서 넣는다 - 컨트롤러가 규칙을 알 필요가 없다.
 */
public record DiaryDetailResult(
        Long id,
        LocalDate entryDate,
        String content,
        DiaryStatus status,
        Weather weather,
        Integer moodScore,
        String aiComment,
        String imageUrl,
        boolean canRegenerate) {

    public static DiaryDetailResult of(Diary diary, DiaryPolicy policy) {
        return new DiaryDetailResult(
                diary.getId(),
                diary.getEntryDate(),
                diary.getContent(),
                diary.getStatus(),
                diary.getWeather(),
                diary.getMoodScore(),
                diary.getAiComment(),
                diary.getImageUrl(),
                diary.canRegenerate(policy));
    }
}
