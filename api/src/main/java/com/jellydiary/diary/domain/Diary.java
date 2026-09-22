package com.jellydiary.diary.domain;

import com.jellydiary.common.domain.BaseEntity;
import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;
import com.jellydiary.diary.type.DiaryPolicy;
import com.jellydiary.diary.type.DiaryStatus;
import com.jellydiary.diary.type.Weather;
import com.jellydiary.llm.painter.DiaryPainting;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/** 하루치 그림일기. 사용자 x 날짜로 하나(불변 규칙). 업무 상한은 DiaryPolicy로 받는다. */
@Getter
@Entity
@Table(name = "tb_diary")
@SQLDelete(sql = "UPDATE tb_diary SET deleted_at = now() WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Diary extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_diary")
    @SequenceGenerator(name = "seq_diary", sequenceName = "seq_diary", allocationSize = 50)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate entryDate;

    /**
     * DDL의 varchar(500)과 같은 값. 애노테이션이 컴파일 상수를 요구해 여기 있다.
     * 사용자에게 적용되는 업무 상한은 이 값이 아니라 app.diary.max-content-length 다.
     */
    public static final int CONTENT_COLUMN_LENGTH = 500;

    @Column(nullable = false, length = CONTENT_COLUMN_LENGTH)
    private String content;

    /** 02 화면의 빠른 감정 칩. 사용자가 고른 힌트이며 AI 판정을 대체하지 않는다. */
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Weather userHint;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Weather weather;

    private Integer moodScore;

    @Column(length = 300)
    private String aiComment;

    @Column(length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DiaryStatus status;

    @Column(nullable = false)
    private int regenerateCount;

    private Diary(Long userId, LocalDate entryDate, String content, Weather userHint) {
        this.userId = userId;
        this.entryDate = entryDate;
        this.content = content;
        this.userHint = userHint;
        this.status = DiaryStatus.GENERATING;
    }

    public static Diary write(
            Long userId, LocalDate entryDate, String content, Weather userHint, DiaryPolicy policy) {
        String trimmed = content == null ? "" : content.strip();
        if (!policy.allowsContent(trimmed)) {
            throw new BusinessException(
                    ErrorCode.COMMON_INVALID_REQUEST, "본문은 1~" + policy.maxContentLength() + "자예요.");
        }
        return new Diary(userId, entryDate, trimmed, userHint);
    }

    /**
     * 생성 성공. 그림만 실패했으면 imageUrl이 null인 채로 DONE이다.
     *
     * <p>점수 범위 위반은 <b>시스템 예외</b>다 - 사용자가 만든 상황이 아니라 AI 어댑터가 계약을 어긴 것이라
     * ErrorCode 로 감싸지 않는다(spring-code-review: 비즈니스 예외와 시스템 예외를 구분한다).
     */
    public void applyPainting(DiaryPainting painting, DiaryPolicy policy) {
        if (!policy.allowsMoodScore(painting.moodScore())) {
            throw new IllegalArgumentException(
                    "기분 점수 범위: " + policy.moodMin() + "~" + policy.moodMax());
        }
        this.weather = painting.weather();
        this.moodScore = painting.moodScore();
        this.aiComment = painting.comment();
        this.imageUrl = painting.imageUrl();
        this.status = DiaryStatus.DONE;
    }

    public void failGeneration() {
        this.status = DiaryStatus.FAILED;
    }

    /** 04 "다시 그리기". 거절 사유가 둘이고 사용자에게 다르게 보여야 해서 코드도 다르다. */
    public void requestRegenerate(DiaryPolicy policy) {
        if (status == DiaryStatus.GENERATING) {
            throw new BusinessException(ErrorCode.DIARY_NOT_DONE);
        }
        if (regenerateCount >= policy.dailyRegenerateLimit()) {
            throw new BusinessException(ErrorCode.DIARY_REGENERATE_LIMIT);
        }
        this.regenerateCount++;
        this.status = DiaryStatus.GENERATING;
    }

    public boolean isOwnedBy(Long otherUserId) {
        return userId.equals(otherUserId);
    }

    public boolean canRegenerate(DiaryPolicy policy) {
        return status != DiaryStatus.GENERATING && regenerateCount < policy.dailyRegenerateLimit();
    }
}
