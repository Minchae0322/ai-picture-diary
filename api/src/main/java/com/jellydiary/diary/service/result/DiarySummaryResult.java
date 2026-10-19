package com.jellydiary.diary.service.result;

import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.type.Emotion;
import java.time.LocalDate;

/** 최근 기록 목록 한 줄. */
public record DiarySummaryResult(Long id, LocalDate entryDate, Emotion emotion, String content) {

    public static DiarySummaryResult of(Diary diary) {
        return new DiarySummaryResult(
                diary.getId(), diary.getEntryDate(), diary.getEmotion(), diary.getContent());
    }
}
