package com.jellydiary.community.repository;

import com.jellydiary.community.domain.PostLike;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    /** 피드 한 페이지의 "내가 눌렀는가"를 한 번에 채운다. 카드마다 묻지 않는다(N+1 방지). */
    List<PostLike> findByUserIdAndPostIdIn(Long userId, Collection<Long> postIds);

    long deleteByPostIdAndUserId(Long postId, Long userId);
}
