package com.jellydiary.profile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;
import com.jellydiary.common.util.NicknameGenerator;
import com.jellydiary.profile.domain.Profile;
import com.jellydiary.profile.type.ProfilePolicy;
import com.jellydiary.profile.type.StoreItem;
import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** 09 잠금 판정은 구독 상태를 아는 엔티티가 한다. 클라이언트 플래그로 뚫리지 않는지를 본다. */
class ProfileTest {

    /** 설정을 읽지 않고 정책 값 객체를 직접 만들어 경계를 본다(config-and-secrets 4-1장). */
    private static final ProfilePolicy POLICY = new ProfilePolicy(30, "수채화");

    @Test
    @DisplayName("프로필은 게스트로 시작한다 - 아무것도 묻지 않고 만들어지기 때문이다")
    void startsAsGuest() {
        assertThat(newProfile().isGuest()).isTrue();
    }

    @Test
    @DisplayName("로그인하면 권한만 올라간다. 사용자 번호도 꾸미기도 그대로다")
    void promoteKeepsEverythingElse() {
        Profile profile = newProfile();
        profile.select(StoreItem.MINT_SODA);
        Long userId = profile.getUserId();

        profile.promote();

        assertThat(profile.isGuest()).isFalse();
        assertThat(profile.getUserId()).isEqualTo(userId);
        assertThat(profile.getThemeCode()).isEqualTo(StoreItem.MINT_SODA.name());

        // 두 번 불려도 안전해야 한다 - 로그인 성공 자리가 재시도될 수 있다
        profile.promote();
        assertThat(profile.isGuest()).isFalse();
    }

    @Test
    @DisplayName("무료 테마는 바로 적용된다")
    void selectsFreeTheme() {
        Profile profile = newProfile();

        profile.select(StoreItem.MINT_SODA);

        assertThat(profile.getThemeCode()).isEqualTo(StoreItem.MINT_SODA.name());
    }

    @Test
    @DisplayName("구독이 없으면 Plus 테마를 고를 수 없다")
    void rejectsPlusThemeWithoutSubscription() {
        Profile profile = newProfile();

        assertThatThrownBy(() -> profile.select(StoreItem.NIGHT_JELLY))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).errorCode())
                .isEqualTo(ErrorCode.STORE_ITEM_LOCKED);
        assertThat(profile.getThemeCode()).isEqualTo(StoreItem.DEFAULT_THEME.name());
    }

    @Test
    @DisplayName("캐릭터는 테마와 따로 저장된다")
    void characterIsSeparateFromTheme() {
        Profile profile = newProfile();

        profile.select(StoreItem.MINT_SODA);

        assertThat(profile.getCharacterCode()).isEqualTo(StoreItem.DEFAULT_CHARACTER.name());
    }

    @Test
    @DisplayName("닉네임은 설정된 상한까지, 앞뒤 공백은 지운다")
    void nicknameBoundary() {
        Profile profile = newProfile();

        profile.rename("  승희  ", POLICY);
        assertThat(profile.getNickname()).isEqualTo("승희");

        assertThatThrownBy(() -> profile.rename("   ", POLICY))
                .isInstanceOf(BusinessException.class)
                .extracting(error -> ((BusinessException) error).errorCode())
                .isEqualTo(ErrorCode.COMMON_INVALID_REQUEST);
        assertThatThrownBy(() -> profile.rename("가".repeat(POLICY.maxNicknameLength() + 1), POLICY))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("리마인더는 비울 수 있다 - 설정 안 함이 유효한 값이다")
    void reminderCanBeCleared() {
        Profile profile = newProfile();

        profile.changeReminder(java.time.LocalTime.of(21, 0));
        profile.changeReminder(null);

        assertThat(profile.getReminderTime()).isNull();
    }

    @Test
    @DisplayName("가입 시 그림 스타일은 설정에서 온다 - 엔티티에 박지 않는다")
    void defaultAiStyleComesFromPolicy() {
        Profile profile =
                Profile.start(1L, LocalDate.of(2026, 3, 2), "말랑한 젤리곰", new ProfilePolicy(30, "펜화"));

        assertThat(profile.getAiStyle()).isEqualTo("펜화");
    }

    @Test
    @DisplayName("기본 닉네임은 어떤 조합이든 컬럼에 들어간다 - 넘치면 가입이 터진다")
    void generatedNicknameFitsColumn() {
        assertThat(NicknameGenerator.longestLength())
                .isLessThanOrEqualTo(Profile.NICKNAME_COLUMN_LENGTH);
    }

    private Profile newProfile() {
        return Profile.start(1L, LocalDate.of(2026, 3, 2), "말랑한 젤리곰", POLICY);
    }
}
