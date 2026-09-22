package com.jellydiary.community.service;

import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;
import com.jellydiary.common.logging.AppLog;
import com.jellydiary.community.domain.CommunityPost;
import com.jellydiary.community.domain.PostLike;
import com.jellydiary.community.repository.CommunityPostRepository;
import com.jellydiary.community.repository.PostLikeRepository;
import com.jellydiary.community.service.result.CommunityPostResult;
import com.jellydiary.community.type.FeedDiversity;
import com.jellydiary.community.type.FeedTaste;
import com.jellydiary.community.type.PostSort;
import com.jellydiary.diary.service.DiaryQueryService;
import com.jellydiary.diary.service.result.DiaryDetailResult;
import com.jellydiary.diary.type.Weather;
import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 08 피드 조회. 무한 스크롤이라 커서 페이징만 쓴다(api-design 4장). */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityQueryService {

    private static final int MAX_SIZE = 50;

    private final CommunityPostRepository postRepository;
    private final PostLikeRepository likeRepository;
    private final DiaryQueryService diaryQueryService;
    private final Clock clock;

    public Page findFeed(Long userId, PostSort sort, List<String> weathers, String cursor, int size) {
        int limit = Math.min(Math.max(size, 1), MAX_SIZE);
        List<String> filter = weatherFilter(weathers);
        PageRequest page = PageRequest.ofSize(limit + 1);

        // 오늘 기록이 없으면 추천할 재료가 없다. 빈 화면 대신 최신순으로 떨어뜨린다(feed-ranking 5장)
        Optional<FeedTaste> taste = sort == PostSort.RECOMMENDED ? taste(userId) : Optional.empty();
        PostSort applied = sort == PostSort.RECOMMENDED && taste.isEmpty() ? PostSort.LATEST : sort;

        CommunityCursor.Position position = CommunityCursor.decode(applied, cursor);
        List<CommunityPost> rows = find(applied, taste, filter, position, page);

        boolean hasNext = rows.size() > limit;
        List<CommunityPost> items = hasNext ? rows.subList(0, limit) : rows;

        // 커서는 재배열 "전"의 점수 순서에서 뽑는다. 섞은 뒤의 마지막 글로 뽑으면 다음 페이지가 겹친다
        String nextCursor = hasNext ? encode(applied, taste, items.getLast()) : null;
        List<CommunityPost> shown = diversify(applied, taste, weathers, items);

        // 정렬별로 지표를 나눠 보려면 로그에 sort 가 있어야 한다(feed-ranking 7장)
        AppLog.event(log, "community.feed_read")
                .with("requestedSort", sort)
                .with("appliedSort", applied)
                .with("size", items.size())
                .info("feed read");

        return new Page(toResults(userId, shown), nextCursor, applied);
    }

    /**
     * 상위 구간에 다른 날씨를 섞는다(feed-ranking 4장). 재배열일 뿐이라 페이지의 글 목록은 그대로다.
     *
     * <p>사용자가 날씨를 직접 골랐으면 섞지 않는다 - "비 오는 글만 보여 줘"에 맑음을 끼워 넣는 것은
     * 다양성이 아니라 요청 무시다.
     */
    private List<CommunityPost> diversify(
            PostSort sort, Optional<FeedTaste> taste, List<String> requested, List<CommunityPost> items) {
        boolean pickedWeather = requested != null && !requested.isEmpty();
        if (sort != PostSort.RECOMMENDED || pickedWeather || taste.isEmpty()) {
            return items;
        }
        return FeedDiversity.mix(items, CommunityPost::getWeather, taste.orElseThrow().weather());
    }

    private List<CommunityPost> find(
            PostSort sort,
            Optional<FeedTaste> taste,
            List<String> filter,
            CommunityCursor.Position position,
            PageRequest page) {
        return switch (sort) {
            case RECOMMENDED ->
                    postRepository.findRecommended(
                            filter,
                            taste.orElseThrow().weather(),
                            taste.orElseThrow().moodScore(),
                            taste.orElseThrow().freshSince(),
                            position.rank(),
                            position.id(),
                            page);
            case POPULAR ->
                    postRepository.findPopular(filter, position.rank(), position.id(), page);
            case LATEST -> postRepository.findLatest(filter, position.id(), page);
        };
    }

    private String encode(PostSort sort, Optional<FeedTaste> taste, CommunityPost last) {
        int rank =
                switch (sort) {
                    case RECOMMENDED ->
                            taste.orElseThrow()
                                    .score(last.getWeather(), last.getMoodScore(), last.getCreatedAt());
                    case POPULAR -> last.getLikeCount();
                    case LATEST -> 0;
                };
        return CommunityCursor.encode(sort, rank, last.getId());
    }

    /** 기준은 요청 시작에 한 번만 읽는다. 페이지마다 다시 읽으면 순서가 흔들린다(feed-ranking 2장). */
    private Optional<FeedTaste> taste(Long userId) {
        return diaryQueryService
                .findToday(userId)
                .filter(diary -> diary.weather() != null && diary.moodScore() != null)
                .map(this::toTaste);
    }

    private FeedTaste toTaste(DiaryDetailResult diary) {
        return FeedTaste.of(diary.weather().name(), diary.moodScore(), Instant.now(clock));
    }

    /** 필터가 없으면 전체 날씨. 빈 목록을 쿼리에 넣지 않으려는 것이며 의미도 같다. */
    private List<String> weatherFilter(List<String> weathers) {
        if (weathers == null || weathers.isEmpty()) {
            return Arrays.stream(Weather.values()).map(Weather::name).toList();
        }
        return weathers.stream().map(this::requireWeather).toList();
    }

    private String requireWeather(String name) {
        try {
            return Weather.valueOf(name).name();
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST, "알 수 없는 날씨: " + name);
        }
    }

    /** "내가 눌렀는가"는 페이지 전체를 한 번에 조회한다. 카드마다 묻지 않는다. */
    private List<CommunityPostResult> toResults(Long userId, List<CommunityPost> posts) {
        if (posts.isEmpty()) {
            return List.of();
        }

        Set<Long> liked =
                likeRepository
                        .findByUserIdAndPostIdIn(
                                userId, posts.stream().map(CommunityPost::getId).toList())
                        .stream()
                        .map(PostLike::getPostId)
                        .collect(Collectors.toSet());

        return posts.stream()
                .map(
                        post ->
                                new CommunityPostResult(
                                        post.getId(),
                                        post.getAuthorName(),
                                        post.getWeather(),
                                        post.getContent(),
                                        post.getLikeCount(),
                                        post.getCommentCount(),
                                        liked.contains(post.getId()),
                                        post.isOwnedBy(userId),
                                        post.getCreatedAt()))
                .toList();
    }

    /** @param appliedSort 실제로 적용된 정렬. 추천을 요청했는데 재료가 없으면 LATEST 가 돌아온다. */
    public record Page(List<CommunityPostResult> items, String nextCursor, PostSort appliedSort) {}
}
