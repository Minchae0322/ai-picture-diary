package com.jellydiary.diary.service;

import com.jellydiary.common.util.StreakCalculator;
import com.jellydiary.common.util.WordCounter;
import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.event.DiaryCompletedEvent;
import com.jellydiary.diary.repository.DiaryRepository;
import com.jellydiary.diary.service.result.DiaryCalendarResult;
import com.jellydiary.diary.service.result.DiaryOverviewResult;
import com.jellydiary.diary.service.result.DiaryStatsResult;
import com.jellydiary.diary.type.StatsPeriod;
import com.jellydiary.diary.type.Weather;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 05 캘린더 · 06 그래프 · 02/10 누적 지표의 집계. 세 화면이 같은 수치를 보여야 하므로 계산을 여기 모은다.
 *
 * <p>새 테이블 없이 tb_diary 를 기간으로 잘라 읽는다. 하루 1건이라 한 달 31행 · 1년 365행이 상한이고
 * 그 정도는 집계 테이블을 만들 이유가 되지 않는다(ponytail: 느려지면 그때 일별 집계 테이블).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiaryStatsService {

    /** 연속 기록 조회 창. "사계절 365일" 뱃지를 판정할 수 있는 최소값보다 넉넉하게 잡는다. */
    private static final int STREAK_WINDOW_DAYS = 400;

    /** 06 "자주 쓴 말" 노출 개수. 시안 4개 - 업무 상한이 아니라 표시 개수라 설정으로 빼지 않는다. */
    private static final int TOP_WORDS = 4;

    private final DiaryRepository diaryRepository;
    private final DiaryService diaryService;
    private final Clock clock;

    /** 02 연속 기록 배지 · 10 통계. */
    public DiaryOverviewResult overview(Long userId) {
        return new DiaryOverviewResult(diaryRepository.countByUserId(userId), streak(userId));
    }

    /** 02·06·10이 같은 값을 쓰는 단 하나의 출입구. */
    public int streak(Long userId) {
        LocalDate today = diaryService.today();
        return StreakCalculator.count(
                diaryRepository.findEntryDatesFrom(userId, today.minusDays(STREAK_WINDOW_DAYS)), today);
    }

    public DiaryCalendarResult calendar(Long userId, YearMonth month) {
        List<Diary> diaries = between(userId, month.atDay(1), month.atEndOfMonth());

        List<DiaryCalendarResult.Day> days =
                diaries.stream()
                        .filter(diary -> diary.getWeather() != null)
                        .map(
                                diary ->
                                        new DiaryCalendarResult.Day(
                                                diary.getEntryDate(),
                                                diary.getId(),
                                                diary.getWeather(),
                                                diary.getMoodScore()))
                        .toList();

        return new DiaryCalendarResult(month, days, summarize(diaries), days.size());
    }

    public DiaryStatsResult stats(Long userId, StatsPeriod period) {
        LocalDate today = diaryService.today();
        LocalDate from = period.from(today);
        List<Diary> diaries = painted(between(userId, from, today));

        List<DiaryStatsResult.Point> points =
                diaries.stream()
                        .map(diary -> new DiaryStatsResult.Point(diary.getEntryDate(), diary.getMoodScore()))
                        .toList();
        Diary best =
                diaries.stream().max(Comparator.comparingInt(Diary::getMoodScore)).orElse(null);

        return new DiaryStatsResult(
                period,
                from,
                today,
                points,
                average(diaries),
                average(painted(between(userId, period.previousFrom(today), from.minusDays(1)))),
                best == null ? null : best.getEntryDate(),
                best == null ? null : best.getMoodScore(),
                streak(userId),
                points.size(),
                words(diaries));
    }

    /** 일기가 DONE 이 된 순간의 뱃지 판정 스냅샷. 뱃지 도메인이 되묻지 않게 여기서 다 채운다. */
    public DiaryCompletedEvent snapshot(Diary diary) {
        Long userId = diary.getUserId();
        Map<Weather, Integer> counts = new EnumMap<>(Weather.class);
        diaryRepository
                .countByWeather(userId)
                .forEach(row -> counts.put(row.weather(), (int) row.days()));

        return new DiaryCompletedEvent(
                userId,
                diary.getId(),
                diary.getEntryDate(),
                diary.getWeather(),
                diary.getCreatedAt().atZone(clock.getZone()).getHour(),
                (int) diaryRepository.countByUserId(userId),
                streak(userId),
                counts);
    }

    private List<Diary> between(Long userId, LocalDate from, LocalDate to) {
        return from.isAfter(to)
                ? List.of()
                : diaryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDate(userId, from, to);
    }

    /** 그림이 실패해도 DONE 이지만, 날씨가 없는 GENERATING/FAILED 는 집계에서 뺀다. */
    private List<Diary> painted(List<Diary> diaries) {
        return diaries.stream()
                .filter(diary -> diary.getWeather() != null && diary.getMoodScore() != null)
                .toList();
    }

    private Double average(List<Diary> diaries) {
        OptionalDouble average = diaries.stream().mapToInt(Diary::getMoodScore).average();
        return average.isPresent() ? Math.round(average.getAsDouble() * 10) / 10.0 : null;
    }

    private List<DiaryCalendarResult.WeatherDays> summarize(List<Diary> diaries) {
        Map<Weather, Integer> counts = new EnumMap<>(Weather.class);
        diaries.stream()
                .map(Diary::getWeather)
                .filter(weather -> weather != null)
                .forEach(weather -> counts.merge(weather, 1, Integer::sum));

        return counts.entrySet().stream()
                .map(entry -> new DiaryCalendarResult.WeatherDays(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparingInt(DiaryCalendarResult.WeatherDays::days).reversed())
                .toList();
    }

    private List<DiaryStatsResult.Word> words(List<Diary> diaries) {
        return WordCounter.top(diaries.stream().map(Diary::getContent).toList(), TOP_WORDS).stream()
                .map(word -> new DiaryStatsResult.Word(word.word(), word.count()))
                .toList();
    }
}
