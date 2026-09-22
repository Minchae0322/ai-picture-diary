package com.jellydiary.profile.controller.dto;

import com.jellydiary.profile.domain.Profile;
import jakarta.validation.constraints.Size;
import java.time.LocalTime;

public final class ProfileRequest {

    private ProfileRequest() {}

    /**
     * 10 설정. 보낸 필드만 바꾼다(부분 수정). reminderTime 을 비우려면 null 로 보낸다 - "설정 안 함"이
     * 유효한 값이라 생략과 구분하지 않는다.
     */
    public record UpdateSettings(
            @Size(max = Profile.NICKNAME_COLUMN_LENGTH) String nickname,
            LocalTime reminderTime,
            @Size(max = 40) String aiStyle,
            Boolean diaryLock) {}
}
