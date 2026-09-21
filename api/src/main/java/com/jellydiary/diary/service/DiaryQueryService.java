package com.jellydiary.diary.service;

import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.repository.DiaryRepository;
import com.jellydiary.diary.service.result.DiaryDetailResult;
import com.jellydiary.diary.service.result.DiarySummaryResult;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 조회 전용. 결과는 result record로 내보내고 엔티티는 이 계층 밖으로 나가지 않는다(ddd-spring 6장·8장). */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiaryQueryService {

    private static final int MAX_SIZE = 100;

    private final DiaryRepository diaryRepository;
    private final DiaryService diaryService;

    public Optional<DiaryDetailResult> findToday(Long userId) {
        return diaryRepository
                .findByUserIdAndEntryDate(userId, diaryService.today())
                .map(this::toDetail);
    }

    public DiaryDetailResult findDetail(Long userId, Long diaryId) {
        return toDetail(diaryService.load(userId, diaryId));
    }

    /** size+1을 읽어 hasNext를 판정한다. count 쿼리 없음(api-design 4장). */
    public Page findPage(Long userId, String cursor, int size) {
        int limit = Math.min(Math.max(size, 1), MAX_SIZE);
        LocalDate from = cursor == null ? LocalDate.MAX : DiaryCursor.decode(cursor);

        List<Diary> rows =
                diaryRepository.findByUserIdAndEntryDateLessThanOrderByEntryDateDesc(
                        userId, from, Limit.of(limit + 1));
        boolean hasNext = rows.size() > limit;
        List<Diary> items = hasNext ? rows.subList(0, limit) : rows;

        return new Page(
                items.stream().map(DiarySummaryResult::of).toList(),
                hasNext ? DiaryCursor.encode(items.getLast().getEntryDate()) : null);
    }

    private DiaryDetailResult toDetail(Diary diary) {
        return DiaryDetailResult.of(diary, diaryService.policy());
    }

    public record Page(List<DiarySummaryResult> items, String nextCursor) {}
}
