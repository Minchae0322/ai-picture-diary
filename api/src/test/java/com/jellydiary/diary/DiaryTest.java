package com.jellydiary.diary;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;
import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.type.DiaryPolicy;
import com.jellydiary.diary.type.DiaryStatus;
import com.jellydiary.diary.type.Emotion;
import com.jellydiary.llm.painter.DiaryPainting;
import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class DiaryTest {

    private static final LocalDate DATE = LocalDate.of(2026, 8, 24);

    /** 상한은 설정에서 온다. 테스트는 그 값을 직접 만들어 경계를 잡는다(운영값과 같은 200자). */
    private static final DiaryPolicy POLICY = new DiaryPolicy(200, 3, 2, -3, 3);

    /** 로그인한 사람 / 게스트. 상한이 갈리는 인자다(ADR 2026-10-20) */
    private static final boolean MEMBER = false;

    private static final boolean GUEST = true;

    private Diary diary() {
        return Diary.write(1L, DATE, "오늘 팀 회의가 잘 끝나서 마음이 가볍다", Emotion.HAPPY, POLICY);
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

        assertThatThrownBy(() -> Diary.write(1L, DATE, "   ", Emotion.HAPPY, POLICY))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).errorCode())
                .isEqualTo(ErrorCode.COMMON_INVALID_REQUEST);
        assertThatThrownBy(() -> Diary.write(1L, DATE, "가".repeat(max + 1), Emotion.HAPPY, POLICY))
                .isInstanceOf(BusinessException.class);
        assertThat(Diary.write(1L, DATE, "가".repeat(max), Emotion.HAPPY, POLICY).getContent())
                .hasSize(max);
    }

    @Test
    @DisplayName("상한이 줄어든 정책에서는 짧은 글도 거절된다")
    void contentBoundaryFollowsPolicy() {
        DiaryPolicy tight = new DiaryPolicy(5, 3, 2, -3, 3);

        assertThatThrownBy(() -> Diary.write(1L, DATE, "여섯 글자다", Emotion.HAPPY, tight))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("오늘의 기분을 고르지 않으면 거절한다 - 본문 길이와 사유가 달라 코드도 다르다")
    void emotionIsRequired() {
        assertThatThrownBy(() -> Diary.write(1L, DATE, "오늘은 좋았다", null, POLICY))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).errorCode())
                .isEqualTo(ErrorCode.DIARY_EMOTION_REQUIRED);
    }

    @Test
    @DisplayName("고른 기분은 그대로 남는다 - AI 판정(emotion)과 다른 칸이다")
    void userHintIsKept() {
        Diary diary = Diary.write(1L, DATE, "오늘은 좋았다", Emotion.TIRED, POLICY);

        assertThat(diary.getUserHint()).isEqualTo(Emotion.TIRED);
        assertThat(diary.getEmotion()).isNull();
    }

    @Test
    @DisplayName("그림만 실패해도(imageUrl null) DONE 으로 넘어간다")
    void doneWithoutImage() {
        Diary diary = diary();

        diary.applyPainting(new DiaryPainting(Emotion.HAPPY, 2, "코멘트", null), POLICY);

        assertThat(diary.getStatus()).isEqualTo(DiaryStatus.DONE);
        assertThat(diary.getImageUrl()).isNull();
        assertThat(diary.getEmotion()).isEqualTo(Emotion.HAPPY);
    }

    @Test
    @DisplayName("기분 점수 범위 위반은 시스템 예외다 - 사용자가 만든 상황이 아니라 AI 어댑터의 계약 위반이다")
    void moodScoreRange() {
        Diary diary = diary();

        assertThatThrownBy(
                        () ->
                                diary.applyPainting(
                                        new DiaryPainting(
                                                Emotion.HAPPY, POLICY.moodMax() + 1, "c", null),
                                        POLICY))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(
                        () ->
                                diary.applyPainting(
                                        new DiaryPainting(
                                                Emotion.SAD, POLICY.moodMin() - 1, "c", null),
                                        POLICY))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("다시 그리기: 생성 중과 상한 초과는 서로 다른 코드로 거절된다")
    void regenerateRejectionsAreDistinct() {
        Diary diary = diary();

        // 아직 그리는 중 - "오늘은 더 다시 그릴 수 없어요"가 아니다
        assertThatThrownBy(() -> diary.requestRegenerate(POLICY, MEMBER))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).errorCode())
                .isEqualTo(ErrorCode.DIARY_NOT_DONE);

        for (int i = 0; i < POLICY.dailyRegenerateLimit(); i++) {
            diary.applyPainting(new DiaryPainting(Emotion.HAPPY, 1, "c", "u"), POLICY);
            diary.requestRegenerate(POLICY, MEMBER);
        }
        diary.applyPainting(new DiaryPainting(Emotion.HAPPY, 1, "c", "u"), POLICY);

        assertThat(diary.canRegenerate(POLICY, MEMBER)).isFalse();
        assertThatThrownBy(() -> diary.requestRegenerate(POLICY, MEMBER))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).errorCode())
                .isEqualTo(ErrorCode.DIARY_REGENERATE_LIMIT);
    }

    @Test
    @DisplayName("게스트는 하루 2회까지 그린다. 최초 1회가 이미 들어 있어 다시 그리기는 1회뿐이다")
    void guestGeneratesTwiceADay() {
        Diary diary = diary();
        diary.applyPainting(new DiaryPainting(Emotion.HAPPY, 1, "c", "u"), POLICY);

        // 2회 중 첫 번째는 작성 자체였다. 그래서 여기서 한 번만 더 된다
        assertThat(diary.canRegenerate(POLICY, GUEST)).isTrue();
        diary.requestRegenerate(POLICY, GUEST);
        diary.applyPainting(new DiaryPainting(Emotion.HAPPY, 1, "c", "u"), POLICY);

        assertThat(diary.canRegenerate(POLICY, GUEST)).isFalse();
        assertThatThrownBy(() -> diary.requestRegenerate(POLICY, GUEST))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).errorCode())
                // 사유가 다르면 코드도 다르다 - 앱이 "로그인하면 더" 를 띄울 근거가 된다
                .isEqualTo(ErrorCode.DIARY_GUEST_GENERATE_LIMIT);

        // 같은 일기라도 로그인한 사람에게는 아직 두 번 남아 있다
        assertThat(diary.canRegenerate(POLICY, MEMBER)).isTrue();
    }

    @Test
    @DisplayName("남의 일기는 소유자가 아니다")
    void ownership() {
        assertThat(diary().isOwnedBy(2L)).isFalse();
    }
}
