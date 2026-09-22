package com.jellydiary.badge.type;

/**
 * 뱃지가 무엇을 재는가. <b>지표는 코드, 임계값은 데이터</b>다.
 *
 * <p>이렇게 나눈 이유: 이름·문구·임계값·정렬은 운영이 바꾸지만, "무엇을 센다"는 그 값을 채워 주는
 * 코드가 있어야만 존재한다. 여기 없는 지표를 tb_badge 에 넣으면 그 뱃지는 영원히 안 걸린다.
 * 새 지표를 더할 때는 BadgeCriteria 에 값 채우는 자리도 같이 만든다.
 *
 * <p>0/1 지표(ALL_WEATHERS, DAWN_RECORD, PREMIUM)는 "했나/아닌가"를 1로 표현한다.
 * 임계값 1과 비교하면 되므로 판정식이 하나로 유지된다.
 */
public enum BadgeMetric {
    /** 누적 기록 수 */
    TOTAL_RECORDS,
    /** 연속 기록 일수 */
    STREAK_DAYS,
    /** 맑음으로 판정된 기록 수 */
    SUNNY_RECORDS,
    /** 비로 판정된 기록 수 */
    RAIN_RECORDS,
    /** 날씨 6종을 전부 모았으면 1. "전부"의 기준은 코드가 안다 - 임계값에 6을 적지 않는다 */
    ALL_WEATHERS,
    /** 새벽에 기록했으면 1 */
    DAWN_RECORD,
    /** 커뮤니티 공유 횟수 */
    SHARES,
    /** 커뮤니티 댓글 수 */
    COMMENTS,
    /** 구독 중이면 1 */
    PREMIUM
}
