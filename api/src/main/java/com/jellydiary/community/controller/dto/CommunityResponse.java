package com.jellydiary.community.controller.dto;

import com.jellydiary.community.service.result.CommunityPostResult;
import java.time.Instant;

public final class CommunityResponse {

    private CommunityResponse() {}

    /**
     * 08 피드 카드. weather 는 문자열이다 - 커뮤니티는 일기 도메인을 참조하지 않는다. 값 목록은
     * docs/api 명세와 앱의 Weather 타입이 같이 관리한다.
     */
    public record Post(
            String id,
            String authorName,
            String weather,
            String content,
            int likeCount,
            int commentCount,
            boolean likedByMe,
            boolean mine,
            Instant createdAt) {

        public static Post from(CommunityPostResult result) {
            return new Post(
                    String.valueOf(result.id()),
                    result.authorName(),
                    result.weather(),
                    result.content(),
                    result.likeCount(),
                    result.commentCount(),
                    result.likedByMe(),
                    result.mine(),
                    result.createdAt());
        }
    }

    public record Shared(String id) {}
}
