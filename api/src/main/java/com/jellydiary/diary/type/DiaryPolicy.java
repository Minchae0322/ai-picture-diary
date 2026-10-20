package com.jellydiary.diary.type;

/**
 * 일기의 업무 상한. 값은 설정(app.diary.*)에서 오고 도메인은 받아서 쓴다. 도메인이 설정 클래스를 알지 않게 하기 위한 값 객체다(ddd-spring 계층 규칙).
 */
public record DiaryPolicy(
        int maxContentLength,
        int dailyRegenerateLimit,
        int guestDailyGenerateLimit,
        int moodMin,
        int moodMax) {

    public DiaryPolicy {
        if (maxContentLength < 1 || moodMin > moodMax || guestDailyGenerateLimit < 1) {
            throw new IllegalArgumentException("일기 정책 값이 올바르지 않다");
        }
    }

    /**
     * 다시 그리기를 몇 번까지 허용하는가.
     *
     * <p>게스트 상한은 <b>그림을 그리는 총 횟수</b>라 최초 생성 1회가 이미 들어 있다. 그래서 다시 그리기는 그보다 하나 적다 - 하루 2회면 최초 1회 + 다시
     * 그리기 1회다(ADR 2026-10-20). 일기 건수는 로그인 여부와 무관하게 하루 1건이다.
     */
    public int regenerateLimitFor(boolean guest) {
        return guest ? guestDailyGenerateLimit - 1 : dailyRegenerateLimit;
    }

    public boolean allowsContent(String content) {
        return !content.isEmpty() && content.length() <= maxContentLength;
    }

    public boolean allowsMoodScore(int moodScore) {
        return moodScore >= moodMin && moodScore <= moodMax;
    }
}
