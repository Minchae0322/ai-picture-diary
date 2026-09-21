package com.jellydiary.diary.service;

import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Base64;

/** 불투명 커서. 하루 1건이므로 정렬 키는 entryDate 하나로 유일하다. */
public final class DiaryCursor {

    private DiaryCursor() {
    }

    public static String encode(LocalDate entryDate) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(entryDate.toString().getBytes(StandardCharsets.UTF_8));
    }

    public static LocalDate decode(String cursor) {
        try {
            return LocalDate.parse(new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8));
        } catch (IllegalArgumentException | DateTimeParseException e) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_CURSOR);
        }
    }
}
