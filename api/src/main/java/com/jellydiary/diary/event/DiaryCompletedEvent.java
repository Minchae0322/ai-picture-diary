package com.jellydiary.diary.event;

import com.jellydiary.diary.type.Weather;
import java.time.LocalDate;
import java.util.Map;

/**
 * 일기 한 건이 DONE 이 된 순간의 스냅샷. 뱃지 도메인이 이 값만으로 판정할 수 있게 집계를 담아 보낸다 -
 * 그래야 badge 가 diary 의 저장소를 되묻지 않는다(ddd-spring 7장, 도메인 간 직접 참조 금지).
 */
public record DiaryCompletedEvent(
        Long userId,
        Long diaryId,
        LocalDate entryDate,
        Weather weather,
        int createdHour,
        int totalCount,
        int streakDays,
        Map<Weather, Integer> weatherCounts) {

    public int countOf(Weather target) {
        return weatherCounts.getOrDefault(target, 0);
    }

    public int distinctWeatherCount() {
        return weatherCounts.size();
    }
}
