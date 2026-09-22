package com.jellydiary.community.type;

/**
 * 08 필터 줄의 정렬 축. 시안은 정렬(인기/최신)과 날씨 필터가 한 줄에 섞여 있지만 축이 둘이라
 * 정렬 1개 + 날씨 다중으로 나눠 받는다(feed-ranking 1장).
 */
public enum PostSort {
    /**
     * 내 오늘 기분과 비슷한 글 먼저. 오늘 기록이 없으면 LATEST 로 떨어진다(콜드 스타트).
     * 점수 규칙은 FeedTaste 한 곳에 있다.
     */
    RECOMMENDED,
    /** 좋아요 많은 순. 시간 감쇠 없는 단순 누적이다 - feed-ranking 6장의 1단계. */
    POPULAR,
    LATEST
}
