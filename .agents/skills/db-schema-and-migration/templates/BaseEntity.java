package com.example.common.domain;   // 프로젝트 패키지로

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;
import lombok.Getter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * 모든 업무 테이블의 공통 컬럼. @EnableJpaAuditing + AuditorAware<Long>(현재 회원 ID, 시스템은 0L) 필요.
 * 소프트 삭제: 각 엔티티에
 *   @SQLDelete(sql = "UPDATE tb_xxx SET deleted_at = now() WHERE id = ? AND version = ?")
 *   @SQLRestriction("deleted_at IS NULL")
 * 를 붙인다. 낙관적 락이 필요 없는 테이블은 version을 빼고 @SQLDelete의 "AND version = ?"도 뺀다.
 * ID 생성: 엔티티에서 @Id @GeneratedValue(strategy = SEQUENCE, generator = "seq_xxx")
 *          + @SequenceGenerator(name = "seq_xxx", sequenceName = "seq_xxx", allocationSize = 50)
 */
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false)
    private Long createdBy;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @LastModifiedBy
    @Column(name = "updated_by", nullable = false)
    private Long updatedBy;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Version
    @Column(name = "version", nullable = false)
    private int version;

    public boolean isDeleted() {
        return deletedAt != null;
    }

    /** 명시적 소프트 삭제가 필요할 때(연쇄 삭제 등). 일반 삭제는 repository.delete()가 @SQLDelete를 탄다. */
    protected void markDeleted(Instant now) {
        this.deletedAt = now;
    }
}
