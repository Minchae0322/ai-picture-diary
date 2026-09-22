package com.jellydiary.community.service.result;

import java.time.Instant;

/** 08 피드 카드 한 장. 상대 시각("2시간 전")은 표시 규칙이라 프론트가 만든다. */
public record CommunityPostResult(
        Long id,
        String authorName,
        String weather,
        String content,
        int likeCount,
        int commentCount,
        boolean likedByMe,
        boolean mine,
        Instant createdAt) {}
