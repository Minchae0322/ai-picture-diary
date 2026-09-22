package com.jellydiary.badge.service;

import com.jellydiary.badge.domain.Badge;
import com.jellydiary.badge.repository.BadgeRepository;
import com.jellydiary.badge.repository.UserBadgeRepository;
import com.jellydiary.badge.service.result.BadgeCollectionResult;
import com.jellydiary.badge.service.result.BadgeResult;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 07 뱃지 컬렉션 조회. 정의된 뱃지는 잠금 상태로라도 전부 내려간다 - 빈 화면이 나오지 않는다. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BadgeQueryService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;

    public BadgeCollectionResult findCollection(Long userId) {
        Map<String, Instant> earned = earnedAtByCode(userId);
        List<Badge> badges = badgeRepository.findAllByOrderBySortOrderAsc();

        List<BadgeResult> results =
                badges.stream()
                        .map(
                                badge ->
                                        new BadgeResult(
                                                badge.getCode(),
                                                badge.getName(),
                                                badge.getConditionText(),
                                                earned.containsKey(badge.getCode()),
                                                earned.get(badge.getCode())))
                        .toList();

        // 획득 수는 "지금 정의된 뱃지 중" 받은 것만 센다. 정의가 사라진 옛 뱃지는 화면에 없으므로 세지 않는다
        long earnedCount = results.stream().filter(BadgeResult::earned).count();

        return new BadgeCollectionResult(results, (int) earnedCount, badges.size());
    }

    private Map<String, Instant> earnedAtByCode(Long userId) {
        Map<String, Instant> earned = new HashMap<>();
        userBadgeRepository
                .findByUserId(userId)
                .forEach(badge -> earned.put(badge.getBadgeCode(), badge.getEarnedAt()));
        return earned;
    }
}
