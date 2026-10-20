package com.jellydiary.account.controller.dto;

import com.jellydiary.account.service.result.GuestAccountResult;

public final class GuestResponse {

    private GuestResponse() {}

    /**
     * @param userId 앱이 그 뒤 모든 요청의 X-User-Id 로 보낼 값
     * @param registered 이번에 새로 만들어졌는지. 이미 있던 기기면 false
     */
    public record Account(Long userId, boolean registered) {

        public static Account from(GuestAccountResult result) {
            return new Account(result.userId(), result.registered());
        }
    }
}
