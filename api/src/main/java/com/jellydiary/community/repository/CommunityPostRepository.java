package com.jellydiary.community.repository;

import com.jellydiary.community.domain.CommunityPost;
import com.jellydiary.community.type.FeedTaste;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    long countByUserId(Long userId);

    boolean existsByDiaryId(Long diaryId);

    /**
     * 최신 정렬. 커서는 id 하나로 유일하다. 커서가 없을 때는 Long.MAX_VALUE 를 넣어 조건식을 하나로 유지한다
     * (null 분기를 쿼리에 만들지 않는다).
     */
    @Query(
            "select p from CommunityPost p where p.weather in :weathers and p.id < :cursorId"
                    + " order by p.id desc")
    List<CommunityPost> findLatest(
            @Param("weathers") List<String> weathers,
            @Param("cursorId") Long cursorId,
            Pageable pageable);

    /** 인기 정렬. (likeCount, id) 키셋 커서 - offset 을 쓰지 않는다(api-design 4장). */
    @Query(
            "select p from CommunityPost p where p.weather in :weathers"
                    + " and (p.likeCount < :cursorRank"
                    + "      or (p.likeCount = :cursorRank and p.id < :cursorId))"
                    + " order by p.likeCount desc, p.id desc")
    List<CommunityPost> findPopular(
            @Param("weathers") List<String> weathers,
            @Param("cursorRank") int cursorRank,
            @Param("cursorId") Long cursorId,
            Pageable pageable);

    /**
     * 추천 정렬. 점수는 사용자마다 달라 미리 계산해 둘 수 없으므로 매 요청 계산한다.
     * 점수 규칙의 원본은 {@link FeedTaste#SCORE_JPQL} 이고, 커서에 실을 점수는 {@code FeedTaste.score()} 가
     * 만든다 - 둘이 같은 답을 내는지는 통합 테스트가 본다.
     */
    @Query(
            "select p from CommunityPost p where p.weather in :weathers"
                    + " and (" + FeedTaste.SCORE_JPQL + " < :cursorRank"
                    + "      or (" + FeedTaste.SCORE_JPQL + " = :cursorRank and p.id < :cursorId))"
                    + " order by " + FeedTaste.SCORE_JPQL + " desc, p.id desc")
    List<CommunityPost> findRecommended(
            @Param("weathers") List<String> weathers,
            @Param("tasteWeather") String tasteWeather,
            @Param("tasteMood") int tasteMood,
            @Param("tasteFreshSince") Instant tasteFreshSince,
            @Param("cursorRank") int cursorRank,
            @Param("cursorId") Long cursorId,
            Pageable pageable);

    /** 좋아요 수는 읽어서 더하지 않고 DB에서 원자적으로 증감한다(transaction-and-concurrency 4장). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update CommunityPost p set p.likeCount = p.likeCount + 1 where p.id = :postId")
    void increaseLikeCount(@Param("postId") Long postId);

    /** 0 미만으로 내려가지 않게 조건을 쿼리에 둔다 - DB의 check 제약과 같은 뜻이다. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update CommunityPost p set p.likeCount = p.likeCount - 1 where p.id = :postId and p.likeCount > 0")
    void decreaseLikeCount(@Param("postId") Long postId);
}
