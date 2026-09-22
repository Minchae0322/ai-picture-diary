package com.jellydiary.diary.type;

import java.time.LocalDate;

/** 06 그래프의 기간 세그먼트. 기준일(오늘)에서 시작일을 만드는 규칙까지 여기 둔다. */
public enum StatsPeriod {
    WEEK(7),
    MONTH(30),
    YEAR(365);

    private final int days;

    StatsPeriod(int days) {
        this.days = days;
    }

    public int days() {
        return days;
    }

    /** 오늘을 포함한 N일. "지난 기간과 비교"는 바로 앞의 같은 길이를 쓴다. */
    public LocalDate from(LocalDate today) {
        return today.minusDays(days - 1L);
    }

    public LocalDate previousFrom(LocalDate today) {
        return from(today).minusDays(days);
    }
}
