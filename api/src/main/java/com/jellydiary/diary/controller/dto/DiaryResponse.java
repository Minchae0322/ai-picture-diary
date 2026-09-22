package com.jellydiary.diary.controller.dto;

import com.jellydiary.diary.type.DiaryStatus;
import com.jellydiary.diary.type.Weather;
import com.jellydiary.diary.service.result.DiaryDetailResult;
import com.jellydiary.diary.service.result.DiaryCalendarResult;
import com.jellydiary.diary.service.result.DiaryOverviewResult;
import com.jellydiary.diary.service.result.DiaryStatsResult;
import com.jellydiary.diary.service.result.DiarySummaryResult;
import java.time.LocalDate;
import java.util.List;

public final class DiaryResponse {

    private DiaryResponse() {}

    /** 04 결과 화면. 생성 중이면 weather 이하가 전부 null이다. ID는 문자열로 내려간다(api-design 5장). */
    public record Detail(
            String id,
            LocalDate entryDate,
            String content,
            DiaryStatus status,
            Weather weather,
            Integer moodScore,
            String aiComment,
            String imageUrl,
            boolean canRegenerate) {

        public static Detail from(DiaryDetailResult result) {
            return new Detail(
                    String.valueOf(result.id()),
                    result.entryDate(),
                    result.content(),
                    result.status(),
                    result.weather(),
                    result.moodScore(),
                    result.aiComment(),
                    result.imageUrl(),
                    result.canRegenerate());
        }
    }

    /** 02 최근 기록 목록. */
    public record Summary(String id, LocalDate entryDate, Weather weather, String content) {

        public static Summary from(DiarySummaryResult result) {
            return new Summary(
                    String.valueOf(result.id()), result.entryDate(), result.weather(), result.content());
        }
    }

    /** 05 감정 캘린더. month는 "2026-08" 형식 문자열로 내려간다. */
    public record Calendar(
            String month, List<Day> days, List<WeatherDays> summary, int recordedDays) {

        public static Calendar from(DiaryCalendarResult result) {
            return new Calendar(
                    result.month().toString(),
                    result.days().stream().map(Day::from).toList(),
                    result.summary().stream().map(WeatherDays::from).toList(),
                    result.recordedDays());
        }

        public record Day(LocalDate date, String diaryId, Weather weather, Integer moodScore) {

            static Day from(DiaryCalendarResult.Day day) {
                return new Day(
                        day.date(), String.valueOf(day.diaryId()), day.weather(), day.moodScore());
            }
        }

        public record WeatherDays(Weather weather, int days) {

            static WeatherDays from(DiaryCalendarResult.WeatherDays row) {
                return new WeatherDays(row.weather(), row.days());
            }
        }
    }

    /** 06 감정 그래프. 무기록일은 points에 없다 - 선을 끊으라는 뜻이다. */
    public record Stats(
            String period,
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

        public static Stats from(DiaryStatsResult result) {
            return new Stats(
                    result.period().name(),
                    result.from(),
                    result.to(),
                    result.points().stream().map(p -> new Point(p.date(), p.moodScore())).toList(),
                    result.average(),
                    result.previousAverage(),
                    result.bestDate(),
                    result.bestScore(),
                    result.streakDays(),
                    result.recordedDays(),
                    result.words().stream().map(w -> new Word(w.word(), w.count())).toList());
        }

        public record Point(LocalDate date, int moodScore) {}

        public record Word(String word, int count) {}
    }

    /** 02·06·10 공통 누적 지표. */
    public record Overview(long totalCount, int streakDays) {

        public static Overview from(DiaryOverviewResult result) {
            return new Overview(result.totalCount(), result.streakDays());
        }
    }

    /** 02 -> 03, 04 다시 그리기. 생성은 비동기라 항상 GENERATING으로 시작한다. */
    public record Created(String id, DiaryStatus status) {

        public static Created generating(Long diaryId) {
            return new Created(String.valueOf(diaryId), DiaryStatus.GENERATING);
        }
    }
}
