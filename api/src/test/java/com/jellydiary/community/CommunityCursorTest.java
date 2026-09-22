package com.jellydiary.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jellydiary.common.error.BusinessException;
import com.jellydiary.community.type.PostSort;
import com.jellydiary.community.service.CommunityCursor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** 커서는 불투명 문자열이다. 깨진 값과 정렬이 바뀐 값이 500이 되지 않는지를 본다. */
class CommunityCursorTest {

    @Test
    @DisplayName("커서가 없으면 맨 앞을 뜻하는 최대값")
    void nullCursorMeansFirstPage() {
        CommunityCursor.Position position = CommunityCursor.decode(PostSort.LATEST, null);

        assertThat(position.id()).isEqualTo(Long.MAX_VALUE);
        assertThat(position.rank()).isEqualTo(Integer.MAX_VALUE);
    }

    @Test
    @DisplayName("정렬이 바뀌면 이전 커서는 무효다")
    void rejectsCursorFromAnotherSort() {
        String latestCursor = encode(PostSort.LATEST, 0, 10L);

        assertThatThrownBy(() -> CommunityCursor.decode(PostSort.POPULAR, latestCursor))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("깨진 커서는 400으로 바뀐다")
    void rejectsGarbage() {
        assertThatThrownBy(() -> CommunityCursor.decode(PostSort.LATEST, "!!!not-base64!!!"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("인기 커서는 좋아요 수와 id를 같이 싣는다")
    void popularCursorCarriesBothKeys() {
        CommunityCursor.Position position =
                CommunityCursor.decode(PostSort.POPULAR, encode(PostSort.POPULAR, 128, 7L));

        assertThat(position.rank()).isEqualTo(128);
        assertThat(position.id()).isEqualTo(7L);
    }

    @Test
    @DisplayName("추천 커서는 점수와 id를 같이 싣는다 - 점수만으로는 동점이 많다")
    void recommendedCursorCarriesScoreAndId() {
        CommunityCursor.Position position =
                CommunityCursor.decode(PostSort.RECOMMENDED, CommunityCursor.encode(PostSort.RECOMMENDED, 3, 42L));

        assertThat(position.rank()).isEqualTo(3);
        assertThat(position.id()).isEqualTo(42L);
    }

    @Test
    @DisplayName("추천 커서를 인기 정렬에 쓰면 거절된다")
    void recommendedCursorIsNotReusableForPopular() {
        String recommended = CommunityCursor.encode(PostSort.RECOMMENDED, 3, 42L);

        assertThatThrownBy(() -> CommunityCursor.decode(PostSort.POPULAR, recommended))
                .isInstanceOf(BusinessException.class);
    }

    private String encode(PostSort sort, int rank, long id) {
        return CommunityCursor.encode(sort, rank, id);
    }
}
