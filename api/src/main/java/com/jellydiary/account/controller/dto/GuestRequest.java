package com.jellydiary.account.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class GuestRequest {

    private GuestRequest() {}

    /**
     * 기기 등록. deviceUuid 는 앱이 기기에서 만든 UUID v4 다.
     *
     * <p>길이만 본다. 모양을 UUID 로 못 박으면 앱이 식별자 방식을 바꿀 때 서버부터 고쳐야 한다. 서버는 어차피 해시해서 쓴다.
     */
    public record Register(@NotBlank @Size(min = 8, max = 100) String deviceUuid) {}
}
