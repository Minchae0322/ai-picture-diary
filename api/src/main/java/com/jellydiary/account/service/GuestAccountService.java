package com.jellydiary.account.service;

import com.jellydiary.account.domain.GuestDevice;
import com.jellydiary.account.repository.GuestDeviceRepository;
import com.jellydiary.account.service.result.GuestAccountResult;
import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;
import com.jellydiary.common.logging.AppLog;
import com.jellydiary.common.util.Sha256;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 로그인하지 않은 기기에 사용자 번호를 내준다. <b>권한은 여기서 보지 않는다</b> - 게스트인지 아닌지는 프로필이 들고 있다({@code Profile.role}). 기기
 * 등록 여부로 판단하면 로그인한 뒤에도 그 행이 남아 영원히 게스트로 읽힌다(ADR 2026-10-20).
 *
 * <p>같은 기기가 다시 물으면 <b>같은 번호</b>를 돌려준다(멱등). 앱이 번호를 잃어버리고 다시 등록해도 기록이 갈리지 않게 하려는 것이다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GuestAccountService {

    private final GuestDeviceRepository repository;

    @Transactional
    public GuestAccountResult register(String deviceUuid) {
        if (deviceUuid == null || deviceUuid.isBlank()) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST);
        }
        // 원문은 여기서 끝이다. 아래로는 해시만 흐르고 로그에도 남기지 않는다(ADR 2026-10-20)
        String hash = Sha256.hex(deviceUuid);

        return repository
                .findByDeviceHash(hash)
                .map(device -> new GuestAccountResult(device.getId(), false))
                .orElseGet(() -> create(hash));
    }

    /**
     * 같은 기기에서 두 요청이 동시에 오면 unique 인덱스가 한쪽을 막는다. 막힌 쪽은 **먼저 들어간 행을 다시 찾아** 같은 번호를 받는다 - 실패로 돌려주면 앱이
     * 새 기기인 줄 알고 다시 등록한다(transaction-and-concurrency 경쟁 조건).
     */
    private GuestAccountResult create(String hash) {
        try {
            GuestDevice saved = repository.save(GuestDevice.of(hash));
            AppLog.event(log, "guest.device_registered")
                    .with("userId", saved.getId())
                    .info("guest device registered");
            return new GuestAccountResult(saved.getId(), true);
        } catch (DataIntegrityViolationException e) {
            return repository
                    .findByDeviceHash(hash)
                    .map(device -> new GuestAccountResult(device.getId(), false))
                    .orElseThrow(() -> e);
        }
    }
}
