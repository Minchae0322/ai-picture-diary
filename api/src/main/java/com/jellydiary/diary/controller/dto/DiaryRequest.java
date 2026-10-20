package com.jellydiary.diary.controller.dto;

import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.type.Emotion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class DiaryRequest {

    private DiaryRequest() {}

    /**
     * 02 홈 입력.
     *
     * <p>{@code userHint} 는 <b>필수</b>다 - 오늘의 기분을 고르지 않으면 그리지 않는다(ADR 2026-10-20). 그래도 AI 판정을 대체하지는
     * 않는다. {@code @Size} 는 DB 컬럼 길이를 넘는 요청을 여기서 끊는 방어선이고, 사용자에게 적용되는 업무 상한(200자)은 도메인이 {@code
     * DiaryPolicy} 로 막는다.
     */
    public record Write(
            @NotBlank @Size(max = Diary.CONTENT_COLUMN_LENGTH) String content,
            @NotNull Emotion userHint) {}
}
