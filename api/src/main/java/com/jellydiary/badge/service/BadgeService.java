package com.jellydiary.badge.service;

import com.jellydiary.badge.domain.Badge;
import com.jellydiary.badge.domain.UserBadge;
import com.jellydiary.badge.repository.BadgeRepository;
import com.jellydiary.badge.repository.UserBadgeRepository;
import com.jellydiary.badge.type.BadgeCriteria;
import com.jellydiary.common.logging.AppLog;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 뱃지 획득 판정. 판정은 항상 서버가 하고 클라이언트는 결과만 본다(07 화면 문서 4장).
 *
 * <p>정의는 tb_badge 에서 읽는다 - 12행짜리 마스터라 매번 읽어도 된다. 늘어나면 그때 캐시한다
 * (ponytail: 지금 캐시를 넣으면 무효화 규칙부터 만들어야 한다).
 *
 * <p>같은 뱃지를 두 번 주지 않는 것은 부분 unique 인덱스가 보장한다. 동시에 두 이벤트가 같은 뱃지를 주려 하면
 * 한쪽이 제약에 걸리고, 그건 "이미 받았다"는 뜻이라 조용히 넘긴다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final Clock clock;

    /** @return 이번에 새로 얻은 뱃지 코드. 04 화면의 "획득!" 카드는 이 목록이 비어 있지 않을 때만 뜬다. */
    @Transactional
    public List<String> evaluate(Long userId, BadgeCriteria criteria) {
        Set<String> owned = earnedCodes(userId);
        List<String> newlyEarned =
                badgeRepository.findAllByOrderBySortOrderAsc().stream()
                        .filter(badge -> !owned.contains(badge.getCode()))
                        .filter(badge -> badge.isEarnedBy(criteria))
                        .map(Badge::getCode)
                        .toList();

        newlyEarned.forEach(code -> grant(userId, code));
        return newlyEarned;
    }

    public Set<String> earnedCodes(Long userId) {
        return userBadgeRepository.findByUserId(userId).stream()
                .map(UserBadge::getBadgeCode)
                .collect(Collectors.toSet());
    }

    private void grant(Long userId, String code) {
        try {
            userBadgeRepository.saveAndFlush(UserBadge.earn(userId, code, Instant.now(clock)));
            AppLog.event(log, "badge.earned").with("userId", userId).with("badge", code).info("badge earned");
        } catch (DataIntegrityViolationException e) {
            // 경쟁 상태에서 다른 이벤트가 먼저 줬다. 결과가 같으므로 실패가 아니다
            AppLog.event(log, "badge.already_earned")
                    .with("userId", userId)
                    .with("badge", code)
                    .debug("badge already earned");
        }
    }
}
