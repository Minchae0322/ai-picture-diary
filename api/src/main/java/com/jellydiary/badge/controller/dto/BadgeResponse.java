package com.jellydiary.badge.controller.dto;

import com.jellydiary.badge.service.result.BadgeCollectionResult;
import java.time.Instant;
import java.util.List;

public final class BadgeResponse {

    private BadgeResponse() {}

    /** 07 화면 전체. 진행 요약과 그리드를 한 번에 준다. */
    public record Collection(List<Badge> badges, int earnedCount, int totalCount) {

        public static Collection from(BadgeCollectionResult result) {
            return new Collection(
                    result.badges().stream()
                            .map(
                                    badge ->
                                            new Badge(
                                                    badge.code(),
                                                    badge.name(),
                                                    badge.condition(),
                                                    badge.earned(),
                                                    badge.earnedAt()))
                            .toList(),
                    result.earnedCount(),
                    result.totalCount());
        }
    }

    public record Badge(String code, String name, String condition, boolean earned, Instant earnedAt) {}
}
