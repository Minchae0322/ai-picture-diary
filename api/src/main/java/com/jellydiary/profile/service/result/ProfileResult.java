package com.jellydiary.profile.service.result;

import com.jellydiary.profile.domain.Profile;
import java.time.LocalDate;
import java.time.LocalTime;

/** 10 프로필 카드 + 설정 목록의 현재값. */
public record ProfileResult(
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

    public static ProfileResult of(Profile profile, String themeName, String characterName) {
        return new ProfileResult(
                profile.getNickname(),
                profile.getThemeCode(),
                themeName,
                profile.getCharacterCode(),
                characterName,
                profile.isPlus(),
                profile.getJoinedOn(),
                profile.getReminderTime(),
                profile.getAiStyle(),
                profile.isDiaryLock());
    }
}
