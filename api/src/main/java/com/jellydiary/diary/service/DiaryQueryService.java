package com.jellydiary.diary.service;

import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.repository.DiaryRepository;
import com.jellydiary.diary.service.result.DiaryDetailResult;
import com.jellydiary.diary.service.result.DiarySummaryResult;
import com.jellydiary.profile.service.ProfileService;
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
    private final ProfileService profileService;

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

        // 첫 장은 날짜 조건 없이 조회한다. LocalDate.MAX 를 넘기면 MySQL DATE 상한(9999-12-31)을
        // 넘어 Incorrect DATE value 로 떨어진다(DiaryRepository 의 메서드 주석)
        List<Diary> rows =
                cursor == null
                        ? diaryRepository.findByUserIdOrderByEntryDateDesc(
                                userId, Limit.of(limit + 1))
                        : diaryRepository.findByUserIdAndEntryDateLessThanOrderByEntryDateDesc(
                                userId, DiaryCursor.decode(cursor), Limit.of(limit + 1));
        boolean hasNext = rows.size() > limit;
        List<Diary> items = hasNext ? rows.subList(0, limit) : rows;

        return new Page(
                items.stream().map(DiarySummaryResult::of).toList(),
                hasNext ? DiaryCursor.encode(items.getLast().getEntryDate()) : null);
    }

    private DiaryDetailResult toDetail(Diary diary) {
        return DiaryDetailResult.of(
                diary, diaryService.policy(), profileService.isGuest(diary.getUserId()));
    }

    public record Page(List<DiarySummaryResult> items, String nextCursor) {}
}
