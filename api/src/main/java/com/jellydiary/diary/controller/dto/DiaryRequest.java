package com.jellydiary.diary.controller.dto;

import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.type.Weather;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class DiaryRequest {

    private DiaryRequest() {
    }

    /** 02 홈 입력. userHint는 빠른 감정 칩(선택). */
    public record Write(
            @NotBlank @Size(max = Diary.CONTENT_COLUMN_LENGTH) String content,
            Weather userHint) {
    }
}
