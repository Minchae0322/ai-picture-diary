package com.jellydiary.diary;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;
import com.jellydiary.diary.domain.Diary;
import com.jellydiary.llm.painter.DiaryPainting;
import com.jellydiary.diary.type.DiaryPolicy;
import com.jellydiary.diary.type.DiaryStatus;
import com.jellydiary.diary.type.Weather;
import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class DiaryTest {

    private static final LocalDate DATE = LocalDate.of(2026, 8, 24);
    /** 상한은 설정에서 온다. 테스트는 그 값을 직접 만들어 경계를 잡는다. */
    private static final DiaryPolicy POLICY = new DiaryPolicy(500, 3, -3, 3);

    private Diary diary() {
        return Diary.write(1L, DATE, "오늘 팀 회의가 잘 끝나서 마음이 가볍다", Weather.SUNNY, POLICY);
    }

    @Test
    @DisplayName("작성 직후에는 GENERATING 이다")
    void writeStartsGenerating() {
        assertThat(diary().getStatus()).isEqualTo(DiaryStatus.GENERATING);
    }

    @Test
    @DisplayName("본문은 정책 상한까지. 공백뿐이거나 초과하면 거절한다")
    void contentBoundary() {
        int max = POLICY.maxContentLength();

        assertThatThrownBy(() -> Diary.write(1L, DATE, "   ", null, POLICY))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).errorCode())
                .isEqualTo(ErrorCode.COMMON_INVALID_REQUEST);
        assertThatThrownBy(() -> Diary.write(1L, DATE, "가".repeat(max + 1), null, POLICY))
                .isInstanceOf(BusinessException.class);
        assertThat(Diary.write(1L, DATE, "가".repeat(max), null, POLICY).getContent()).hasSize(max);
    }

    @Test
    @DisplayName("상한이 줄어든 정책에서는 짧은 글도 거절된다")
    void contentBoundaryFollowsPolicy() {
        DiaryPolicy tight = new DiaryPolicy(5, 3, -3, 3);

        assertThatThrownBy(() -> Diary.write(1L, DATE, "여섯 글자다", null, tight))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("그림만 실패해도(imageUrl null) DONE 으로 넘어간다")
    void doneWithoutImage() {
        Diary diary = diary();

        diary.applyPainting(new DiaryPainting(Weather.SUNNY, 2, "코멘트", null), POLICY);

        assertThat(diary.getStatus()).isEqualTo(DiaryStatus.DONE);
        assertThat(diary.getImageUrl()).isNull();
        assertThat(diary.getWeather()).isEqualTo(Weather.SUNNY);
    }

    @Test
    @DisplayName("기분 점수 범위 위반은 시스템 예외다 - 사용자가 만든 상황이 아니라 AI 어댑터의 계약 위반이다")
    void moodScoreRange() {
        Diary diary = diary();

        assertThatThrownBy(
                        () ->
                                diary.applyPainting(
                                        new DiaryPainting(Weather.SUNNY, POLICY.moodMax() + 1, "c", null), POLICY))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(
                        () ->
                                diary.applyPainting(
                                        new DiaryPainting(Weather.RAIN, POLICY.moodMin() - 1, "c", null), POLICY))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("다시 그리기: 생성 중과 상한 초과는 서로 다른 코드로 거절된다")
    void regenerateRejectionsAreDistinct() {
        Diary diary = diary();

        // 아직 그리는 중 - "오늘은 더 다시 그릴 수 없어요"가 아니다
        assertThatThrownBy(() -> diary.requestRegenerate(POLICY))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).errorCode())
                .isEqualTo(ErrorCode.DIARY_NOT_DONE);

        for (int i = 0; i < POLICY.dailyRegenerateLimit(); i++) {
            diary.applyPainting(new DiaryPainting(Weather.SUNNY, 1, "c", "u"), POLICY);
            diary.requestRegenerate(POLICY);
        }
        diary.applyPainting(new DiaryPainting(Weather.SUNNY, 1, "c", "u"), POLICY);

        assertThat(diary.canRegenerate(POLICY)).isFalse();
        assertThatThrownBy(() -> diary.requestRegenerate(POLICY))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).errorCode())
                .isEqualTo(ErrorCode.DIARY_REGENERATE_LIMIT);
    }

    @Test
    @DisplayName("남의 일기는 소유자가 아니다")
    void ownership() {
        assertThat(diary().isOwnedBy(2L)).isFalse();
    }
}
