package com.jellydiary.badge.controller;

import com.jellydiary.badge.controller.dto.BadgeResponse;
import com.jellydiary.badge.service.BadgeQueryService;
import com.jellydiary.common.auth.LoginUser;
import com.jellydiary.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeQueryService badgeQueryService;

    /** 07 뱃지 컬렉션. 획득/미획득을 한 번에 내려 목록이 비는 일이 없다. */
    @GetMapping
    public ApiResponse<BadgeResponse.Collection> collection(@LoginUser Long userId) {
        return ApiResponse.of(BadgeResponse.Collection.from(badgeQueryService.findCollection(userId)));
    }
}
