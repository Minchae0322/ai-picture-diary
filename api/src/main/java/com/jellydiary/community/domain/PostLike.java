package com.jellydiary.community.domain;

import com.jellydiary.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/** 좋아요 1건. 연타·중복은 (post_id, user_id) 부분 unique 인덱스가 막는다. */
@Getter
@Entity
@Table(name = "tb_post_like")
@SQLDelete(sql = "UPDATE tb_post_like SET deleted_at = now() WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostLike extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_post_like")
    @SequenceGenerator(name = "seq_post_like", sequenceName = "seq_post_like", allocationSize = 50)
    private Long id;

    @Column(nullable = false)
    private Long postId;

    @Column(nullable = false)
    private Long userId;

    private PostLike(Long postId, Long userId) {
        this.postId = postId;
        this.userId = userId;
    }

    public static PostLike of(Long postId, Long userId) {
        return new PostLike(postId, userId);
    }
}
