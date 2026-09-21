package com.jellydiary.diary.domain;

import com.jellydiary.common.domain.BaseEntity;
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

    /**
     * DB 컬럼 길이(스키마). sql/patch 의 DDL과 같아야 하며 애노테이션이 컴파일 상수를 요구해 여기 둔다.
     * 사용자에게 적용되는 업무 상한은 이 값이 아니라 app.diary.max-content-length 다.
     */
    public static final int CONTENT_COLUMN_LENGTH = 500;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_diary")
    @SequenceGenerator(name = "seq_diary", sequenceName = "seq_diary", allocationSize = 50)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate entryDate;

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
            throw new IllegalArgumentException("본문은 1~" + policy.maxContentLength() + "자");
        }
        return new Diary(userId, entryDate, trimmed, userHint);
    }

    /** 생성 성공. 그림만 실패했으면 imageUrl이 null인 채로 DONE이다. */
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

    /** 04 "다시 그리기". 상한을 넘으면 도메인이 막는다. */
    public void requestRegenerate(DiaryPolicy policy) {
        if (status == DiaryStatus.GENERATING) {
            throw new IllegalStateException("이미 그리는 중");
        }
        if (regenerateCount >= policy.dailyRegenerateLimit()) {
            throw new IllegalStateException("재생성 상한 초과");
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
