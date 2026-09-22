package com.jellydiary.profile.service;

import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;
import com.jellydiary.common.util.NicknameGenerator;
import com.jellydiary.profile.config.ProfileProperties;
import com.jellydiary.profile.domain.Profile;
import com.jellydiary.profile.repository.ProfileRepository;
import com.jellydiary.profile.service.result.ProfileResult;
import com.jellydiary.profile.service.result.StoreItemResult;
import com.jellydiary.profile.type.ProfilePolicy;
import com.jellydiary.profile.type.StoreCategory;
import com.jellydiary.profile.type.StoreItem;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 10 마이페이지와 09 꾸미기. 테마·캐릭터 선택은 "프로필의 표시 설정"이라 상점을 별도 도메인으로 나누지 않았다
 * (결제가 생기면 그때 나눈다).
 *
 * <p>인증이 없어 프로필 행이 미리 존재하지 않는다. 첫 조회에 만든다 - 회원가입이 붙으면 그쪽으로 옮길 자리다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final ProfileProperties properties;
    private final Clock clock;

    @Transactional
    public ProfileResult getOrCreate(Long userId) {
        return toResult(load(userId));
    }

    @Transactional
    public ProfileResult updateSettings(
            Long userId, String nickname, LocalTime reminderTime, String aiStyle, Boolean diaryLock) {
        Profile profile = load(userId);

        if (nickname != null) {
            profile.rename(nickname, policy());
        }
        profile.changeReminder(reminderTime);
        profile.changeAiStyle(aiStyle);
        if (diaryLock != null) {
            profile.changeDiaryLock(diaryLock);
        }

        return toResult(profile);
    }

    /** 09 테마·캐릭터 목록. 잠금 여부는 서버가 구독 상태를 보고 정한다 - 클라이언트 플래그를 믿지 않는다. */
    public List<StoreItemResult> storeItems(Long userId) {
        Profile profile = load(userId);

        return Arrays.stream(StoreItem.values())
                .map(
                        item ->
                                new StoreItemResult(
                                        item.name(),
                                        item.category(),
                                        item.displayName(),
                                        item.description(),
                                        item.plusOnly(),
                                        !profile.canUse(item),
                                        isSelected(profile, item)))
                .toList();
    }

    @Transactional
    public ProfileResult select(Long userId, String code) {
        StoreItem item =
                StoreItem.byCode(code)
                        .orElseThrow(() -> new BusinessException(ErrorCode.STORE_ITEM_NOT_FOUND));
        Profile profile = load(userId);
        profile.select(item);

        return toResult(profile);
    }

    private boolean isSelected(Profile profile, StoreItem item) {
        return item.category() == StoreCategory.THEME
                ? profile.getThemeCode().equals(item.name())
                : profile.getCharacterCode().equals(item.name());
    }

    /**
     * 첫 조회에서 만든다. 같은 사용자의 요청 두 개가 동시에 들어오면 한쪽이 unique 제약에 걸리는데,
     * 그건 "다른 쪽이 이미 만들었다"는 뜻이라 다시 읽으면 된다.
     */
    private Profile load(Long userId) {
        return profileRepository
                .findByUserId(userId)
                .orElseGet(() -> create(userId));
    }

    private Profile create(Long userId) {
        try {
            return profileRepository.saveAndFlush(
                    Profile.start(
                            userId,
                            LocalDate.now(clock),
                            NicknameGenerator.generate(ThreadLocalRandom.current()),
                            policy()));
        } catch (DataIntegrityViolationException e) {
            return profileRepository
                    .findByUserId(userId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.COMMON_CONFLICT));
        }
    }

    /** 도메인에 넘길 업무 규칙. 값의 출처는 설정 한 곳이다. */
    private ProfilePolicy policy() {
        return properties.policy();
    }

    private ProfileResult toResult(Profile profile) {
        return ProfileResult.of(profile, nameOf(profile.getThemeCode()), nameOf(profile.getCharacterCode()));
    }

    private String nameOf(String code) {
        return StoreItem.byCode(code).map(StoreItem::displayName).orElse(code);
    }
}
