package com.jellydiary.llm;

import static org.assertj.core.api.Assertions.assertThat;

import com.jellydiary.diary.config.DiaryProperties;
import com.jellydiary.diary.type.Weather;
import com.jellydiary.llm.config.LlmProperties;
import com.jellydiary.llm.painter.DiaryPainting;
import com.jellydiary.llm.painter.MockDiaryPainter;
import java.time.Duration;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MockDiaryPainterTest {

    private static final LlmProperties LLM = new LlmProperties("mock", Duration.ZERO);
    private static final DiaryProperties DIARY = new DiaryProperties(500, 3, -3, 3);

    private final MockDiaryPainter painter = new MockDiaryPainter(LLM, DIARY);

    @Test
    @DisplayName("키워드가 날씨를 정한다")
    void detectsWeatherFromKeyword() {
        assertThat(painter.paint("오늘 회의 잘 끝나서 좋았다", null).weather()).isEqualTo(Weather.SUNNY);
        assertThat(painter.paint("너무 힘들었다", null).weather()).isEqualTo(Weather.RAIN);
        assertThat(painter.paint("합격했다", null).weather()).isEqualTo(Weather.RAINBOW);
    }

    @Test
    @DisplayName("키워드가 없으면 사용자 힌트, 힌트도 없으면 기본값")
    void fallsBackToHint() {
        assertThat(painter.paint("ㅁㄴㅇㄹ", Weather.CLOUDY).weather()).isEqualTo(Weather.CLOUDY);
        assertThat(painter.paint("ㅁㄴㅇㄹ", null).weather()).isEqualTo(Weather.PARTLY_CLOUDY);
    }

    @Test
    @DisplayName("점수는 항상 유효 범위 안이고 코멘트가 비지 않는다")
    void producesValidPainting() {
        DiaryPainting painting = painter.paint("합격했다", null);

        assertThat(painting.moodScore()).isBetween(-3, 3);
        assertThat(painting.comment()).isNotBlank();
        assertThat(painting.imageUrl()).startsWith("https://");
    }
}
