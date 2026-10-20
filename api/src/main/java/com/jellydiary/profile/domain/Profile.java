package com.jellydiary.profile.domain;

import com.jellydiary.common.domain.BaseEntity;
import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;
import com.jellydiary.profile.type.AccountRole;
import com.jellydiary.profile.type.ProfilePolicy;
import com.jellydiary.profile.type.StoreItem;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * 10 마이페이지의 프로필과 09에서 고른 꾸미기 상태. 인증이 붙기 전이라 사용자 테이블을 겸한다 (spring-auth 도입 시 계정 정보는 그쪽으로 옮기고 여기엔 표시
 * 설정만 남는다).
 */
@Getter
@Entity
@Table(name = "tb_profile")
@SQLDelete(sql = "UPDATE tb_profile SET deleted_at = now(6) WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Profile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    /**
     * DDL의 varchar(30)과 같은 값. 애노테이션이 컴파일 상수를 요구해 여기 있다. 사용자에게 적용되는 업무 상한은 이 값이 아니라
     * app.profile.max-nickname-length 다.
     */
    public static final int NICKNAME_COLUMN_LENGTH = 30;

    @Column(nullable = false, length = NICKNAME_COLUMN_LENGTH)
    private String nickname;

    @Column(nullable = false, length = 40)
    private String themeCode;

    @Column(nullable = false, length = 40)
    private String characterCode;

    @Column(nullable = false)
    private boolean plus;

    @Column(nullable = false)
    private LocalDate joinedOn;

    /** null = 리마인더 설정 안 함. 10 화면은 행을 숨기지 않고 "설정 안 함"으로 보여준다. */
    private LocalTime reminderTime;

    @Column(nullable = false, length = 40)
    private String aiStyle;

    @Column(nullable = false)
    private boolean diaryLock;

    /**
     * 게스트인가 계정이 있는가. 로그인 벽(07·08·09·10)과 하루 AI 생성 상한이 이 값으로 갈린다.
     *
     * <p>기기 등록 여부로 판단하지 않는 이유는 {@link AccountRole} 에 적혀 있다.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountRole role;

    private Profile(Long userId, LocalDate joinedOn, String nickname, ProfilePolicy policy) {
        this.userId = userId;
        // 계정은 게스트로 시작한다. 로그인은 promote() 로 올린다
        this.role = AccountRole.GUEST;
        this.themeCode = StoreItem.DEFAULT_THEME.name();
        this.characterCode = StoreItem.DEFAULT_CHARACTER.name();
        this.joinedOn = joinedOn;
        this.aiStyle = policy.defaultAiStyle();
        rename(nickname, policy);
    }

    /** 닉네임은 응용 계층이 만들어 넘긴다(NicknameGenerator). 도메인은 길이만 본다. */
    public static Profile start(
            Long userId, LocalDate joinedOn, String nickname, ProfilePolicy policy) {
        return new Profile(userId, joinedOn, nickname, policy);
    }

    public boolean isGuest() {
        return role == AccountRole.GUEST;
    }

    /**
     * 로그인했다. **사용자 번호는 그대로 두고 권한만 올린다** - 그래서 일기도 캘린더도 뱃지도 저절로 이어진다 (ADR 2026-10-20). 이미 계정이 있으면 아무
     * 일도 하지 않는다 - 두 번 불려도 안전해야 한다.
     *
     * <p>아직 부르는 곳이 없다. 인증이 붙는 날 회원가입·로그인 성공 자리에서 이것을 부른다.
     */
    public void promote() {
        this.role = AccountRole.MEMBER;
    }

    /** 잠긴 항목인지 판단할 근거(구독 여부)를 아는 것이 이 엔티티라 판정도 여기서 한다. */
    public void select(StoreItem item) {
        if (!item.isUsableBy(plus)) {
            throw new BusinessException(ErrorCode.STORE_ITEM_LOCKED);
        }
        switch (item.category()) {
            case THEME -> this.themeCode = item.name();
            case CHARACTER -> this.characterCode = item.name();
        }
    }

    public void rename(String newNickname, ProfilePolicy policy) {
        String trimmed = newNickname == null ? "" : newNickname.strip();
        if (!policy.allowsNickname(trimmed)) {
            throw new BusinessException(
                    ErrorCode.COMMON_INVALID_REQUEST,
                    "닉네임은 1~" + policy.maxNicknameLength() + "자예요.");
        }
        this.nickname = trimmed;
    }

    public void changeReminder(LocalTime time) {
        this.reminderTime = time;
    }

    public void changeAiStyle(String style) {
        if (style != null && !style.isBlank()) {
            this.aiStyle = style.strip();
        }
    }

    public void changeDiaryLock(boolean on) {
        this.diaryLock = on;
    }

    public boolean canUse(StoreItem item) {
        return item.isUsableBy(plus);
    }
}
