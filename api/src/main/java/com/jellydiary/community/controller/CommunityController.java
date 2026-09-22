package com.jellydiary.community.controller;

import com.jellydiary.common.auth.LoginUser;
import com.jellydiary.common.response.ApiResponse;
import com.jellydiary.community.controller.dto.CommunityRequest;
import com.jellydiary.community.controller.dto.CommunityResponse;
import com.jellydiary.community.type.PostSort;
import com.jellydiary.community.service.CommunityQueryService;
import com.jellydiary.community.service.CommunityService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/community/posts")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;
    private final CommunityQueryService communityQueryService;

    /**
     * 08 피드. 정렬 1개(RECOMMENDED/POPULAR/LATEST) + 날씨 다중(08 화면 문서 4장).
     * 추천을 요청했는데 오늘 기록이 없으면 <b>최신순으로 떨어진다</b>(feed-ranking 5장).
     */
    @GetMapping
    public ApiResponse<List<CommunityResponse.Post>> feed(
            @LoginUser Long userId,
            @RequestParam(defaultValue = "RECOMMENDED") PostSort sort,
            @RequestParam(required = false) List<String> weather,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int size) {
        CommunityQueryService.Page page =
                communityQueryService.findFeed(userId, sort, weather, cursor, size);

        return ApiResponse.cursor(
                page.items().stream().map(CommunityResponse.Post::from).toList(), page.nextCursor());
    }

    /** 04 "공유" -> 게시. */
    @PostMapping
    public ResponseEntity<ApiResponse<CommunityResponse.Shared>> share(
            @LoginUser Long userId, @Valid @RequestBody CommunityRequest.Share request) {
        Long postId = communityService.share(userId, request.diaryId());

        return ResponseEntity.created(URI.create("/api/v1/community/posts/" + postId))
                .body(ApiResponse.of(new CommunityResponse.Shared(String.valueOf(postId))));
    }

    /** 좋아요는 멱등이다. 연타해도 같은 결과이므로 204로 끝낸다. */
    @PostMapping("/{postId}/like")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void like(@LoginUser Long userId, @PathVariable Long postId) {
        communityService.like(userId, postId);
    }

    @DeleteMapping("/{postId}/like")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void unlike(@LoginUser Long userId, @PathVariable Long postId) {
        communityService.unlike(userId, postId);
    }

    /** 신고. 시안에 없지만 UGC 배포의 필수 동선이다(app-store-release). */
    @PostMapping("/{postId}/report")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void report(
            @LoginUser Long userId,
            @PathVariable Long postId,
            @Valid @RequestBody CommunityRequest.Report request) {
        communityService.report(userId, postId, request.reason(), request.detail());
    }

    @DeleteMapping("/{postId}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void delete(@LoginUser Long userId, @PathVariable Long postId) {
        communityService.delete(userId, postId);
    }
}
