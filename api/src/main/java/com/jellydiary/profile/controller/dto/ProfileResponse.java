package com.jellydiary.profile.controller.dto;

import com.jellydiary.profile.type.StoreCategory;
import com.jellydiary.profile.service.result.ProfileResult;
import com.jellydiary.profile.service.result.StoreItemResult;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public final class ProfileResponse {

    private ProfileResponse() {}

    /** 10 프로필 카드 + 설정 현재값. 누적 통계는 /diaries/overview 와 /badges 가 따로 준다. */
    public record Me(
            String nickname,
            String themeCode,
            String themeName,
            String characterCode,
            String characterName,
            boolean plus,
            LocalDate joinedOn,
            LocalTime reminderTime,
            String aiStyle,
            boolean diaryLock) {

        public static Me from(ProfileResult result) {
            return new Me(
                    result.nickname(),
                    result.themeCode(),
                    result.themeName(),
                    result.characterCode(),
                    result.characterName(),
                    result.plus(),
                    result.joinedOn(),
                    result.reminderTime(),
                    result.aiStyle(),
                    result.diaryLock());
        }
    }

    /** 09 꾸미기 목록. */
    public record StoreItem(
            String code,
            StoreCategory category,
            String name,
            String description,
            boolean plusOnly,
            boolean locked,
            boolean selected) {

        public static StoreItem from(StoreItemResult result) {
            return new StoreItem(
                    result.code(),
                    result.category(),
                    result.name(),
                    result.description(),
                    result.plusOnly(),
                    result.locked(),
                    result.selected());
        }
    }
}
