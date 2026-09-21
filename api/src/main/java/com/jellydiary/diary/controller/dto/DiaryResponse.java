package com.jellydiary.diary.controller.dto;

import com.jellydiary.diary.domain.DiaryStatus;
import com.jellydiary.diary.domain.Weather;
import com.jellydiary.diary.service.result.DiaryDetailResult;
import com.jellydiary.diary.service.result.DiarySummaryResult;
import java.time.LocalDate;

public final class DiaryResponse {

    private DiaryResponse() {}

    /** 04 결과 화면. 생성 중이면 weather 이하가 전부 null이다. ID는 문자열로 내려간다(api-design 5장). */
    public record Detail(
            String id,
            LocalDate entryDate,
            String content,
            DiaryStatus status,
            Weather weather,
            Integer moodScore,
            String aiComment,
            String imageUrl,
            boolean canRegenerate) {

        public static Detail from(DiaryDetailResult result) {
            return new Detail(
                    String.valueOf(result.id()),
                    result.entryDate(),
                    result.content(),
                    result.status(),
                    result.weather(),
                    result.moodScore(),
                    result.aiComment(),
                    result.imageUrl(),
                    result.canRegenerate());
        }
    }

    /** 02 최근 기록 목록. */
    public record Summary(String id, LocalDate entryDate, Weather weather, String content) {

        public static Summary from(DiarySummaryResult result) {
            return new Summary(
                    String.valueOf(result.id()), result.entryDate(), result.weather(), result.content());
        }
    }

    /** 02 -> 03, 04 다시 그리기. 생성은 비동기라 항상 GENERATING으로 시작한다. */
    public record Created(String id, DiaryStatus status) {

        public static Created generating(Long diaryId) {
            return new Created(String.valueOf(diaryId), DiaryStatus.GENERATING);
        }
    }
}
