package com.jellydiary.community.service;

import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;
import com.jellydiary.common.logging.AppLog;
import com.jellydiary.community.domain.CommunityPost;
import com.jellydiary.community.domain.PostLike;
import com.jellydiary.community.domain.PostReport;
import com.jellydiary.community.event.PostSharedEvent;
import com.jellydiary.community.type.ReportReason;
import com.jellydiary.community.repository.CommunityPostRepository;
import com.jellydiary.community.repository.PostLikeRepository;
import com.jellydiary.community.repository.PostReportRepository;
import com.jellydiary.diary.type.DiaryStatus;
import com.jellydiary.diary.service.DiaryQueryService;
import com.jellydiary.diary.service.result.DiaryDetailResult;
import com.jellydiary.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 04 "공유" -> 08 피드. 다른 도메인(일기·프로필)은 여기서만 조합한다 - 커뮤니티 엔티티는 둘 다 모른다
 * (ddd-spring 4-1장).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityService {

    private final CommunityPostRepository postRepository;
    private final PostLikeRepository likeRepository;
    private final PostReportRepository reportRepository;
    private final DiaryQueryService diaryQueryService;
    private final ProfileService profileService;
    private final ApplicationEventPublisher events;

    /** 일기를 복사해 게시한다. 그리는 중이거나 실패한 일기는 공유할 수 없다. */
    @Transactional
    public Long share(Long userId, Long diaryId) {
        DiaryDetailResult diary = diaryQueryService.findDetail(userId, diaryId);
        if (diary.status() != DiaryStatus.DONE || diary.weather() == null || diary.moodScore() == null) {
            throw new BusinessException(ErrorCode.DIARY_NOT_DONE);
        }
        if (postRepository.existsByDiaryId(diaryId)) {
            throw new BusinessException(ErrorCode.POST_ALREADY_SHARED);
        }

        CommunityPost post =
                save(
                        CommunityPost.share(
                                userId,
                                diaryId,
                                profileService.getOrCreate(userId).nickname(),
                                diary.weather().name(),
                                diary.content(),
                                diary.moodScore()));

        events.publishEvent(new PostSharedEvent(userId, (int) postRepository.countByUserId(userId)));
        AppLog.event(log, "community.post_shared").with("postId", post.getId()).info("post shared");

        return post.getId();
    }

    /** 연타는 성공으로 친다 - 결과가 같기 때문이다(멱등). 중복 방지는 unique 인덱스가 한다. */
    @Transactional
    public void like(Long userId, Long postId) {
        load(postId);
        try {
            likeRepository.saveAndFlush(PostLike.of(postId, userId));
        } catch (DataIntegrityViolationException e) {
            return;
        }
        postRepository.increaseLikeCount(postId);
    }

    @Transactional
    public void unlike(Long userId, Long postId) {
        load(postId);
        if (likeRepository.deleteByPostIdAndUserId(postId, userId) > 0) {
            postRepository.decreaseLikeCount(postId);
        }
    }

    @Transactional
    public void report(Long userId, Long postId, ReportReason reason, String detail) {
        load(postId);
        if (reportRepository.existsByPostIdAndUserId(postId, userId)) {
            throw new BusinessException(ErrorCode.POST_ALREADY_REPORTED);
        }

        reportRepository.save(PostReport.of(postId, userId, reason, detail));
        AppLog.event(log, "community.post_reported")
                .with("postId", postId)
                .with("reason", reason)
                .warn("post reported");
    }

    /** 내 글만 지운다. 남의 글은 신고로 처리한다. */
    @Transactional
    public void delete(Long userId, Long postId) {
        CommunityPost post = load(postId);
        if (!post.isOwnedBy(userId)) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }
        postRepository.delete(post);
    }

    public CommunityPost load(Long postId) {
        return postRepository
                .findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
    }

    private CommunityPost save(CommunityPost post) {
        try {
            return postRepository.saveAndFlush(post);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.POST_ALREADY_SHARED);
        }
    }
}
