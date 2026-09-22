package com.jellydiary.common.util;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Set;

/**
 * 연속 기록 일수. 02·06·10이 같은 값을 써야 하므로 계산은 이 한 곳에만 있다(프로젝트 스킬 3장).
 *
 * <p>오늘을 아직 안 썼어도 어제까지 이어졌으면 연속은 유지된다 - 자정부터 기록 전까지 0일로 보이면
 * "끊겼다"는 잘못된 신호를 준다.
 */
public final class StreakCalculator {

    private StreakCalculator() {}

    public static int count(Collection<LocalDate> entryDates, LocalDate today) {
        Set<LocalDate> dates = Set.copyOf(entryDates);
        LocalDate cursor = dates.contains(today) ? today : today.minusDays(1);

        int streak = 0;
        while (dates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }
}
