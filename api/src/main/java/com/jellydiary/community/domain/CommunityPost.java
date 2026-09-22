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

/**
 * 08 피드의 글 한 건. 04에서 "공유"한 일기를 <b>복사</b>해 만든다 - 참조가 아니라 복사라서 원본을 고치거나
 * 지워도 피드는 그대로다(08 화면 문서 6장의 갈림길에서 복사를 택했다).
 *
 * <p>날씨를 문자열로 들고 있는 이유: 커뮤니티는 일기 도메인을 참조하지 않는다. 값의 진실은 diary.Weather 이고
 * 변환은 CommunityService 가 한다.
 */
@Getter
@Entity
@Table(name = "tb_community_post")
@SQLDelete(sql = "UPDATE tb_community_post SET deleted_at = now() WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommunityPost extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_community_post")
    @SequenceGenerator(
            name = "seq_community_post",
            sequenceName = "seq_community_post",
            allocationSize = 50)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long diaryId;

    @Column(nullable = false, length = 30)
    private String authorName;

    @Column(nullable = false, length = 30)
    private String weather;

    /** DDL의 varchar(500)과 같은 값. 게시 시점의 일기 본문을 그대로 복사하므로 일기와 같은 길이다. */
    public static final int CONTENT_COLUMN_LENGTH = 500;

    @Column(nullable = false, length = CONTENT_COLUMN_LENGTH)
    private String content;

    /** 게시 시점 일기의 기분 점수(-3~3). 추천 정렬의 재료다 - 나중에 계산할 수 없어 복사해 둔다. */
    @Column(nullable = false)
    private int moodScore;

    @Column(nullable = false)
    private int likeCount;

    @Column(nullable = false)
    private int commentCount;

    private CommunityPost(
            Long userId, Long diaryId, String authorName, String weather, String content, int moodScore) {
        this.userId = userId;
        this.diaryId = diaryId;
        this.authorName = authorName;
        this.weather = weather;
        this.content = content;
        this.moodScore = moodScore;
    }

    public static CommunityPost share(
            Long userId, Long diaryId, String authorName, String weather, String content, int moodScore) {
        // 사용자는 여기까지 못 온다(CommunityService 가 DIARY_NOT_DONE 으로 먼저 막는다).
        // 도달했다면 호출자의 버그이므로 ErrorCode 로 감싸지 않는다.
        if (weather == null || weather.isBlank()) {
            throw new IllegalArgumentException("아직 날씨가 없는 일기는 공유할 수 없다");
        }
        return new CommunityPost(userId, diaryId, authorName, weather, content, moodScore);
    }

    public boolean isOwnedBy(Long otherUserId) {
        return userId.equals(otherUserId);
    }
}
