package com.jellydiary.badge.domain;

import com.jellydiary.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/** 획득한 뱃지 한 건. 정의는 tb_badge, 여기에는 누가 언제 받았는지만 남는다. */
@Getter
@Entity
@Table(name = "tb_user_badge")
@SQLDelete(sql = "UPDATE tb_user_badge SET deleted_at = now() WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserBadge extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_user_badge")
    @SequenceGenerator(name = "seq_user_badge", sequenceName = "seq_user_badge", allocationSize = 50)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    /** tb_badge.code. FK를 걸지 않는다 - 정의가 지워져도 받은 기록은 남아야 한다. */
    @Column(nullable = false, length = 40)
    private String badgeCode;

    @Column(nullable = false)
    private Instant earnedAt;

    private UserBadge(Long userId, String badgeCode, Instant earnedAt) {
        this.userId = userId;
        this.badgeCode = badgeCode;
        this.earnedAt = earnedAt;
    }

    public static UserBadge earn(Long userId, String badgeCode, Instant earnedAt) {
        return new UserBadge(userId, badgeCode, earnedAt);
    }
}
