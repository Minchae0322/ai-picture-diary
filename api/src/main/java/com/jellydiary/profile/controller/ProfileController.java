package com.jellydiary.profile.controller;

import com.jellydiary.common.auth.LoginUser;
import com.jellydiary.common.response.ApiResponse;
import com.jellydiary.profile.controller.dto.ProfileRequest;
import com.jellydiary.profile.controller.dto.ProfileResponse;
import com.jellydiary.profile.service.ProfileService;
import com.jellydiary.profile.type.StoreItem;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    /** 10 마이페이지. 없으면 기본값으로 만들어 준다(인증 도입 전 임시). */
    @GetMapping
    public ApiResponse<ProfileResponse.Me> me(@LoginUser Long userId) {
        return ApiResponse.of(ProfileResponse.Me.from(profileService.getOrCreate(userId)));
    }

    @PatchMapping("/settings")
    public ApiResponse<ProfileResponse.Me> updateSettings(
            @LoginUser Long userId, @Valid @RequestBody ProfileRequest.UpdateSettings request) {
        return ApiResponse.of(
                ProfileResponse.Me.from(
                        profileService.updateSettings(
                                userId,
                                request.nickname(),
                                request.reminderTime(),
                                request.aiStyle(),
                                request.diaryLock())));
    }

    /** 09 꾸미기 목록. */
    @GetMapping("/store/items")
    public ApiResponse<List<ProfileResponse.StoreItem>> storeItems(@LoginUser Long userId) {
        return ApiResponse.of(
                profileService.storeItems(userId).stream().map(ProfileResponse.StoreItem::from).toList());
    }

    /** 무료 항목은 즉시 적용, Plus 항목은 422 STORE_ITEM_LOCKED. 구독 유도 시트는 앱이 띄운다. */
    @PostMapping("/store/items/{code}/select")
    public ApiResponse<ProfileResponse.Me> select(@LoginUser Long userId, @PathVariable String code) {
        return ApiResponse.of(ProfileResponse.Me.from(profileService.select(userId, code)));
    }
}
