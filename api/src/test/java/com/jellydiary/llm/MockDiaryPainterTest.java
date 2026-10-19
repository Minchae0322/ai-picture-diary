package com.jellydiary.llm;

import static org.assertj.core.api.Assertions.assertThat;

import com.jellydiary.diary.config.DiaryProperties;
import com.jellydiary.diary.type.Emotion;
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
    @DisplayName("키워드가 감정을 정한다")
    void detectsEmotionFromKeyword() {
        assertThat(painter.paint("오늘 회의 잘 끝나서 좋았다", null).emotion()).isEqualTo(Emotion.HAPPY);
        assertThat(painter.paint("속상해서 울었다", null).emotion()).isEqualTo(Emotion.SAD);
        assertThat(painter.paint("오늘 진짜 최고였다", null).emotion()).isEqualTo(Emotion.ENERGETIC);
        assertThat(painter.paint("너무 피곤하다", null).emotion()).isEqualTo(Emotion.TIRED);
        assertThat(painter.paint("짜증나는 하루", null).emotion()).isEqualTo(Emotion.ANGRY);
        // "화" 한 글자로 잡으면 영화·화요일에도 걸린다. 두 글자 이상으로 잡았는지 확인한다
        assertThat(painter.paint("영화를 봤다", null).emotion()).isEqualTo(Emotion.SOSO);
    }

    @Test
    @DisplayName("키워드가 없으면 사용자 힌트, 힌트도 없으면 기본값")
    void fallsBackToHint() {
        assertThat(painter.paint("ㅁㄴㅇㄹ", Emotion.TIRED).emotion()).isEqualTo(Emotion.TIRED);
        assertThat(painter.paint("ㅁㄴㅇㄹ", null).emotion()).isEqualTo(Emotion.SOSO);
    }

    @Test
    @DisplayName("점수는 항상 유효 범위 안이고 코멘트가 비지 않는다")
    void producesValidPainting() {
        DiaryPainting painting = painter.paint("오늘 진짜 최고였다", null);

        assertThat(painting.moodScore()).isBetween(-3, 3);
        assertThat(painting.comment()).isNotBlank();
        assertThat(painting.imageUrl()).startsWith("https://");
    }
}
