package com.jellydiary.community.type;

import java.time.Instant;

/**
 * 추천 정렬의 기준. "내 오늘이 어땠는가"를 한 번 읽어 요청 내내 고정한다 -
 * 페이지마다 다시 읽으면 2페이지에서 순서가 바뀌어 같은 글이 두 번 나온다(feed-ranking 2장).
 *
 * <p>유사도를 임베딩이 아니라 규칙으로 잰다(feed-ranking 3장의 1단계). 날씨와 기분 점수는
 * 이미 AI 판정을 거친 요약이라 500자 한 줄의 임베딩보다 덜 흔들리고, 호출 비용이 0이다.
 *
 * @param freshSince 이 시각 이후 글에 신선도 점수를 준다. 유사도만으로 정렬하면 오래된 글이 고인다(4장).
 */
public record FeedTaste(String weather, int moodScore, Instant freshSince) {

    public static final int WEATHER_MATCH_POINTS = 2;
    public static final int MOOD_NEAR_POINTS = 1;
    public static final int FRESH_POINTS = 1;

    /** 기분 점수가 이 차이 이내면 "비슷하다"로 본다. -3~+3 범위에서 1은 한 칸이다. */
    public static final int MOOD_TOLERANCE = 1;

    public static final int FRESH_DAYS = 3;

    /**
     * 정렬은 DB가 하고 커서 인코딩은 자바가 한다. 그래서 같은 규칙이 두 번 적는다 -
     * <b>여기 둘은 반드시 같은 답을 내야 하며</b>, CommunityFeedOrderTest(integration)가 그걸 묶는다.
     * 숫자는 위 상수를 그대로 이어 붙여 한쪽만 바뀌는 일을 막는다.
     */
    public static final String SCORE_JPQL =
            "(case when p.weather = :tasteWeather then " + WEATHER_MATCH_POINTS + " else 0 end"
                    + " + case when abs(p.moodScore - :tasteMood) <= " + MOOD_TOLERANCE
                    + " then " + MOOD_NEAR_POINTS + " else 0 end"
                    + " + case when p.createdAt >= :tasteFreshSince then " + FRESH_POINTS + " else 0 end)";

    public static FeedTaste of(String weather, int moodScore, Instant now) {
        return new FeedTaste(weather, moodScore, now.minus(java.time.Duration.ofDays(FRESH_DAYS)));
    }

    /**
     * SCORE_JPQL 과 같은 규칙. 커서에 실을 점수를 만든다.
     * 엔티티가 아니라 값 셋을 받는다 - 그래야 규칙만 따로 테스트할 수 있다.
     */
    public int score(String postWeather, int postMoodScore, Instant postCreatedAt) {
        int score = 0;
        if (weather.equals(postWeather)) {
            score += WEATHER_MATCH_POINTS;
        }
        if (Math.abs(postMoodScore - moodScore) <= MOOD_TOLERANCE) {
            score += MOOD_NEAR_POINTS;
        }
        if (!postCreatedAt.isBefore(freshSince)) {
            score += FRESH_POINTS;
        }
        return score;
    }
}
