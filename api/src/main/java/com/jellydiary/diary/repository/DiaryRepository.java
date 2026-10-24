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

    /**
     * 커서 페이징의 <b>첫 장</b>. 날짜 조건을 아예 걸지 않는다.
     *
     * <p>전에는 첫 장도 위 메서드에 {@code LocalDate.MAX} 를 넘겨 한 메서드로 처리했다. PostgreSQL 에서는 통했지만 <b>MySQL 의 DATE 상한은
     * 9999-12-31</b> 이라 {@code +999999999-12-31} 이 드라이버에서 뭉개져 {@code Incorrect DATE value} 로 떨어진다 - 최근 기록이
     * 늘 비어 보였다. 2026-10-14 MySQL 전환 때 들어와 2026-10-24 에 처음 띄워 보고 잡혔다.
     *
     * <p>9999-12-31 같은 보초값으로 때우지 않는 이유는, 그 날짜의 일기가 사라지는 경계가 생기고 "왜 이 숫자인가"를 아는 사람이 곧 없어지기 때문이다.
     */
    List<Diary> findByUserIdOrderByEntryDateDesc(Long userId, Limit limit);

    /** 05 캘린더 / 06 그래프. 기간이 제한돼 있어 전체 로드가 아니다. */
    List<Diary> findByUserIdAndEntryDateBetweenOrderByEntryDate(
            Long userId, LocalDate from, LocalDate to);

    long countByUserId(Long userId);

    /**
     * 그 날 이미 쓴 <b>AI 생성 횟수</b>. <b>소프트 삭제된 행까지 센다.</b>
     *
     * <p>네이티브 쿼리인 이유는 엔티티에 걸린 {@code @SQLRestriction("deleted_at IS NULL")} 때문이다 -
     * JPQL 로는 지워진 행이 보이지 않는다. 여기서는 <b>지워진 것이야말로 세야 하는 대상</b>이다.
     *
     * <p>한 행이 쓰는 호출 수는 처음 1회 + 다시 그린 횟수다. 지우고 새로 쓰면 엔티티의
     * {@code regenerateCount} 는 0 으로 돌아가므로, 이 값을 이월하지 않으면 지우기만 반복해
     * <b>하루 상한을 무한히 우회</b>할 수 있다(프로젝트 스킬 5장: 상한 없이 AI 호출 금지).
     */
    @Query(
            value =
                    "SELECT COALESCE(SUM(regenerate_count + 1), 0) FROM tb_diary"
                            + " WHERE user_id = :userId AND entry_date = :entryDate",
            nativeQuery = true)
    int countGenerationsOn(
            @Param("userId") Long userId, @Param("entryDate") LocalDate entryDate);

    /**
     * 연속 기록 계산용 날짜만. 본문·이미지를 끌어오지 않는다. ponytail: 조회 창을 잘라 쓴다(DiaryStatsService.STREAK_WINDOW_DAYS).
     * 그보다 긴 연속은 그 값을 늘린다.
     */
    @Query("select d.entryDate from Diary d where d.userId = :userId and d.entryDate >= :from")
    List<LocalDate> findEntryDatesFrom(@Param("userId") Long userId, @Param("from") LocalDate from);

    /** 뱃지 판정용. 감정 9종을 각각 세지 않고 한 번에 묶어 온다. */
    @Query(
            "select new com.jellydiary.diary.repository.EmotionCount(d.emotion, count(d))"
                    + " from Diary d where d.userId = :userId and d.emotion is not null group by d.emotion")
    List<EmotionCount> countByEmotion(@Param("userId") Long userId);
}
