package com.jellydiary.diary.type;

/**
 * 일기의 업무 상한. 값은 설정(app.diary.*)에서 오고 도메인은 받아서 쓴다.
 * 도메인이 설정 클래스를 알지 않게 하기 위한 값 객체다(ddd-spring 계층 규칙).
 */
public record DiaryPolicy(int maxContentLength, int dailyRegenerateLimit, int moodMin, int moodMax) {

    public DiaryPolicy {
        if (maxContentLength < 1 || moodMin > moodMax) {
            throw new IllegalArgumentException("일기 정책 값이 올바르지 않다");
        }
    }

    public boolean allowsContent(String content) {
        return !content.isEmpty() && content.length() <= maxContentLength;
    }

    public boolean allowsMoodScore(int moodScore) {
        return moodScore >= moodMin && moodScore <= moodMax;
    }
}
