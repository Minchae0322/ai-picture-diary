package com.jellydiary.diary.repository;

import com.jellydiary.diary.domain.Diary;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DiaryRepository extends JpaRepository<Diary, Long> {

    Optional<Diary> findByUserIdAndEntryDate(Long userId, LocalDate entryDate);

    boolean existsByUserIdAndEntryDate(Long userId, LocalDate entryDate);

    /** 커서 페이징. 하루 1건이라 entryDate만으로 유일하다(api-design 4장). */
    List<Diary> findByUserIdAndEntryDateLessThanOrderByEntryDateDesc(
            Long userId, LocalDate cursor, Limit limit);

    /** 05 캘린더 / 06 그래프. 기간이 제한돼 있어 전체 로드가 아니다. */
    List<Diary> findByUserIdAndEntryDateBetweenOrderByEntryDate(
            Long userId, LocalDate from, LocalDate to);

    long countByUserId(Long userId);

    /**
     * 연속 기록 계산용 날짜만. 본문·이미지를 끌어오지 않는다.
     * ponytail: 조회 창을 잘라 쓴다(DiaryStatsService.STREAK_WINDOW_DAYS). 그보다 긴 연속은 그 값을 늘린다.
     */
    @Query("select d.entryDate from Diary d where d.userId = :userId and d.entryDate >= :from")
    List<LocalDate> findEntryDatesFrom(@Param("userId") Long userId, @Param("from") LocalDate from);

    /** 뱃지 판정용. 날씨 6종을 각각 세지 않고 한 번에 묶어 온다. */
    @Query(
            "select new com.jellydiary.diary.repository.WeatherCount(d.weather, count(d))"
                + " from Diary d where d.userId = :userId and d.weather is not null group by d.weather")
    List<WeatherCount> countByWeather(@Param("userId") Long userId);
}
