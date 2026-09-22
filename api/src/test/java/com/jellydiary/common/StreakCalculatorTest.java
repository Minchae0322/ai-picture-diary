package com.jellydiary.common;

import static org.assertj.core.api.Assertions.assertThat;

import com.jellydiary.common.util.StreakCalculator;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** 02·06·10이 같은 값을 보여야 하는 계산이라 경계를 전부 고정한다. */
class StreakCalculatorTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 8, 24);

    @Test
    @DisplayName("오늘까지 이어졌으면 오늘을 포함해 센다")
    void countsIncludingToday() {
        List<LocalDate> dates = List.of(TODAY, TODAY.minusDays(1), TODAY.minusDays(2));

        assertThat(StreakCalculator.count(dates, TODAY)).isEqualTo(3);
    }

    @Test
    @DisplayName("오늘을 아직 안 썼어도 어제까지 이어졌으면 연속은 유지된다")
    void keepsStreakBeforeTodayIsWritten() {
        List<LocalDate> dates = List.of(TODAY.minusDays(1), TODAY.minusDays(2));

        assertThat(StreakCalculator.count(dates, TODAY)).isEqualTo(2);
    }

    @Test
    @DisplayName("그제까지만 있으면 끊긴 것이라 0")
    void breaksWhenYesterdayMissing() {
        List<LocalDate> dates = List.of(TODAY.minusDays(2), TODAY.minusDays(3));

        assertThat(StreakCalculator.count(dates, TODAY)).isZero();
    }

    @Test
    @DisplayName("중간이 비면 그 앞은 세지 않는다")
    void stopsAtTheFirstGap() {
        List<LocalDate> dates =
                List.of(TODAY, TODAY.minusDays(1), TODAY.minusDays(3), TODAY.minusDays(4));

        assertThat(StreakCalculator.count(dates, TODAY)).isEqualTo(2);
    }

    @Test
    @DisplayName("기록이 없으면 0")
    void zeroWithoutRecords() {
        assertThat(StreakCalculator.count(Set.of(), TODAY)).isZero();
    }

    @Test
    @DisplayName("오늘 하루만 있으면 1")
    void singleDay() {
        assertThat(StreakCalculator.count(List.of(TODAY), TODAY)).isEqualTo(1);
    }
}
