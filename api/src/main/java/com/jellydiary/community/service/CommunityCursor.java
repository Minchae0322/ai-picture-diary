package com.jellydiary.community.service;

import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;
import com.jellydiary.community.type.PostSort;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * 불투명 커서. 정렬 축마다 키가 달라 정렬을 커서 안에 넣는다 - 정렬을 바꾸면 커서도 무효라는 사실이
 * 값에 드러난다(feed-ranking 2장).
 *
 * <p>형식: {@code <정렬>:<랭크>:<id>}. 랭크는 POPULAR면 좋아요 수, RECOMMENDED면 추천 점수,
 * LATEST면 쓰지 않는다. 랭크만으로는 동점이 많아 <b>뒤에 항상 id</b>가 붙는다.
 */
public final class CommunityCursor {

    private static final String SEPARATOR = ":";

    private CommunityCursor() {}

    public static String encode(PostSort sort, int rank, long id) {
        String raw =
                sort == PostSort.LATEST
                        ? sort.name() + SEPARATOR + id
                        : sort.name() + SEPARATOR + rank + SEPARATOR + id;
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    /** 커서가 없으면 "맨 앞"을 뜻하는 최대값을 준다. 쿼리는 null 분기 없이 하나로 유지된다. */
    public static Position decode(PostSort sort, String cursor) {
        if (cursor == null) {
            return new Position(Integer.MAX_VALUE, Long.MAX_VALUE);
        }

        String[] parts = decodeRaw(cursor).split(SEPARATOR);
        boolean matchesSort = parts.length >= 2 && parts[0].equals(sort.name());
        if (!matchesSort) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_CURSOR);
        }

        try {
            return sort == PostSort.LATEST
                    ? new Position(Integer.MAX_VALUE, Long.parseLong(parts[1]))
                    : new Position(Integer.parseInt(parts[1]), Long.parseLong(parts[2]));
        } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_CURSOR);
        }
    }

    /** @param rank 정렬 1차 키(좋아요 수 또는 추천 점수). LATEST에서는 의미 없다. */
    public record Position(int rank, long id) {}
}
