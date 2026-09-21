package com.jellydiary.diary.repository;

import com.jellydiary.diary.domain.Diary;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DiaryRepository extends JpaRepository<Diary, Long> {

    Optional<Diary> findByUserIdAndEntryDate(Long userId, LocalDate entryDate);

    boolean existsByUserIdAndEntryDate(Long userId, LocalDate entryDate);

    /** 커서 페이징. 하루 1건이라 entryDate만으로 유일하다(api-design 4장). */
    List<Diary> findByUserIdAndEntryDateLessThanOrderByEntryDateDesc(Long userId, LocalDate cursor, Limit limit);
}
