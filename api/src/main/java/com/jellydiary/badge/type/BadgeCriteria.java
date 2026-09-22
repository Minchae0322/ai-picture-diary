package com.jellydiary.badge.type;

/**
 * 뱃지 판정에 필요한 사실만 모은 값. 일기·커뮤니티·구독 어디서 왔는지는 여기서 알 필요가 없다 -
 * 그래서 이 도메인은 다른 도메인을 참조하지 않는다(4-1장 도메인 간 직접 참조 금지).
 *
 * @param allWeathers 날씨 6종을 전부 모았으면 true. "6"은 날씨 enum이 알고, 여기까지 오면 참/거짓이다.
 * @param dawnRecord 방금 기록한 시각(Asia/Seoul)이 새벽이면 true.
 */
public record BadgeCriteria(
        int totalCount,
        int streakDays,
        int sunnyCount,
        int rainCount,
        boolean allWeathers,
        boolean dawnRecord,
        int shareCount,
        int commentCount,
        boolean plus) {

    /** 기록과 무관한 사건(공유·댓글·구독)으로 판정할 때. 기록 관련 값은 0이라 해당 뱃지는 걸리지 않는다. */
    public static BadgeCriteria ofShare(int shareCount) {
        return new BadgeCriteria(0, 0, 0, 0, false, false, shareCount, 0, false);
    }

    /** 지표 하나의 현재 값. 임계값과 비교할 수 있게 0/1 로 환산한다. */
    public int valueOf(BadgeMetric metric) {
        return switch (metric) {
            case TOTAL_RECORDS -> totalCount;
            case STREAK_DAYS -> streakDays;
            case SUNNY_RECORDS -> sunnyCount;
            case RAIN_RECORDS -> rainCount;
            case ALL_WEATHERS -> flag(allWeathers);
            case DAWN_RECORD -> flag(dawnRecord);
            case SHARES -> shareCount;
            case COMMENTS -> commentCount;
            case PREMIUM -> flag(plus);
        };
    }

    private int flag(boolean on) {
        return on ? 1 : 0;
    }
}
