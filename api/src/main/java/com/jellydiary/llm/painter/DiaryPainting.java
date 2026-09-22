package com.jellydiary.llm.painter;

import com.jellydiary.diary.type.Weather;

/**
 * AI가 만들어 낸 결과. 그림 생성만 실패하면 imageUrl이 null이고 나머지는 유효하다.
 * 점수 범위 검증은 정책을 아는 Diary.applyPainting 이 한다.
 */
public record DiaryPainting(Weather weather, int moodScore, String comment, String imageUrl) {

    public DiaryPainting {
        if (weather == null) {
            throw new IllegalArgumentException("weather는 필수");
        }
    }
}
