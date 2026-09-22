package com.jellydiary.community.domain;

import com.jellydiary.common.domain.BaseEntity;
import com.jellydiary.community.type.ReportReason;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/** 신고 1건. 처리(숨김/삭제)는 아직 사람이 한다 - 관리 도구는 08 화면 문서 7장의 미정 항목. */
@Getter
@Entity
@Table(name = "tb_post_report")
@SQLDelete(sql = "UPDATE tb_post_report SET deleted_at = now() WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostReport extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_post_report")
    @SequenceGenerator(name = "seq_post_report", sequenceName = "seq_post_report", allocationSize = 50)
    private Long id;

    @Column(nullable = false)
    private Long postId;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReportReason reason;

    @Column(length = 200)
    private String detail;

    private PostReport(Long postId, Long userId, ReportReason reason, String detail) {
        this.postId = postId;
        this.userId = userId;
        this.reason = reason;
        this.detail = detail;
    }

    public static PostReport of(Long postId, Long userId, ReportReason reason, String detail) {
        return new PostReport(postId, userId, reason, detail);
    }
}
