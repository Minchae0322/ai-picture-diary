package com.jellydiary.diary.service.result;

import com.jellydiary.diary.type.StatsPeriod;
import java.time.LocalDate;
import java.util.List;

/**
 * 06 감정 그래프. 무기록일은 points 에 없다 - 0으로 채우면 "보통"이라는 거짓이 된다(06 화면 문서 4장).
 * average 는 기록이 있는 날만의 평균이다.
 */
public record DiaryStatsResult(
        StatsPeriod period,
        LocalDate from,
        LocalDate to,
        List<Point> points,
        Double average,
        Double previousAverage,
        LocalDate bestDate,
        Integer bestScore,
        int streakDays,
        int recordedDays,
        List<Word> words) {

    public record Point(LocalDate date, int moodScore) {}

    public record Word(String word, int count) {}
}
