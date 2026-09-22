package com.jellydiary.diary.service.result;

import com.jellydiary.diary.type.Weather;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * 05 감정 캘린더. 월 집계는 서버가 계산해서 내려준다 - 클라이언트가 다시 세면 06 그래프와 값이 갈린다
 * (05 화면 문서 6장).
 */
public record DiaryCalendarResult(
        YearMonth month, List<Day> days, List<WeatherDays> summary, int recordedDays) {

    /** 기록이 있는 날만 담는다. 빈 칸은 그리드가 날짜로 채운다. */
    public record Day(LocalDate date, Long diaryId, Weather weather, Integer moodScore) {}

    public record WeatherDays(Weather weather, int days) {}
}
