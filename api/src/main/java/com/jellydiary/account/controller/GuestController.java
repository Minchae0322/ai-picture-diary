package com.jellydiary.account.controller;

import com.jellydiary.account.controller.dto.GuestRequest;
import com.jellydiary.account.controller.dto.GuestResponse;
import com.jellydiary.account.service.GuestAccountService;
import com.jellydiary.account.service.result.GuestAccountResult;
import com.jellydiary.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 로그인 전 기기 등록. <b>이 엔드포인트만 X-User-Id 없이 부른다</b> - 번호를 받으러 오는 자리라 아직 번호가 없다.
 *
 * <p>같은 기기가 다시 불러도 같은 번호를 준다. 그래서 201 이 아니라 200 이다 - 두 번째 호출은 아무것도 만들지 않는다.
 */
@RestController
@RequestMapping("/api/v1/guest")
@RequiredArgsConstructor
public class GuestController {

    private final GuestAccountService guestAccountService;

    @PostMapping("/devices")
    public ResponseEntity<ApiResponse<GuestResponse.Account>> register(
            @Valid @RequestBody GuestRequest.Register request) {
        GuestAccountResult result = guestAccountService.register(request.deviceUuid());

        return ResponseEntity.ok(ApiResponse.of(GuestResponse.Account.from(result)));
    }
}
