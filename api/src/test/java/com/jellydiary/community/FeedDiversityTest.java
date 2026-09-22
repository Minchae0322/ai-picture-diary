package com.jellydiary.community;

import static org.assertj.core.api.Assertions.assertThat;

import com.jellydiary.community.type.FeedDiversity;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 상위 10개 중 2개는 다른 날씨. 이 규칙이 <b>커서를 깨지 않는지</b>가 핵심이라
 * "원소 집합이 그대로인가"를 매 경우 확인한다.
 */
class FeedDiversityTest {

    private static final String RAIN = "RAIN";
    private static final String SUNNY = "SUNNY";
    private static final Function<String, String> WEATHER = weather -> weather;

    @Test
    @DisplayName("상위 10개가 전부 같은 날씨면 아래에서 둘을 끌어올린다")
    void pullsTwoDifferentIntoTheTop() {
        List<String> feed = repeat(RAIN, 12);
        feed.set(10, SUNNY);
        feed.set(11, SUNNY);

        List<String> mixed = FeedDiversity.mix(feed, WEATHER, RAIN);

        assertThat(different(mixed.subList(0, FeedDiversity.WINDOW)))
                .isEqualTo(FeedDiversity.MIN_DIFFERENT);
        assertThat(mixed).containsExactlyInAnyOrderElementsOf(feed);
    }

    @Test
    @DisplayName("1등은 밀려나지 않는다 - 자리를 내주는 건 상위 구간에서 점수가 가장 낮은 쪽")
    void keepsTheTopSlot() {
        List<String> feed = repeat(RAIN, 12);
        feed.set(0, "RAIN_FIRST");
        feed.set(10, SUNNY);
        feed.set(11, SUNNY);

        List<String> mixed = FeedDiversity.mix(feed, weather -> weather.startsWith(RAIN) ? RAIN : SUNNY, RAIN);

        assertThat(mixed.getFirst()).isEqualTo("RAIN_FIRST");
    }

    @Test
    @DisplayName("이미 다른 날씨가 둘 이상이면 건드리지 않는다")
    void leavesAlreadyDiverseFeed() {
        List<String> feed = repeat(RAIN, 12);
        feed.set(3, SUNNY);
        feed.set(5, SUNNY);

        assertThat(FeedDiversity.mix(feed, WEATHER, RAIN)).isEqualTo(feed);
    }

    @Test
    @DisplayName("끌어올 후보가 페이지에 없으면 그대로 둔다 - 다음 페이지를 미리 읽지 않는다")
    void doesNothingWithoutCandidates() {
        List<String> feed = repeat(RAIN, 20);

        assertThat(FeedDiversity.mix(feed, WEATHER, RAIN)).isEqualTo(feed);
    }

    @Test
    @DisplayName("후보가 하나뿐이면 하나만 끌어올린다")
    void pullsWhatItCan() {
        List<String> feed = repeat(RAIN, 12);
        feed.set(11, SUNNY);

        List<String> mixed = FeedDiversity.mix(feed, WEATHER, RAIN);

        assertThat(different(mixed.subList(0, FeedDiversity.WINDOW))).isEqualTo(1);
        assertThat(mixed).containsExactlyInAnyOrderElementsOf(feed);
    }

    @Test
    @DisplayName("10개 이하면 섞을 여지가 없다")
    void shortFeedIsUntouched() {
        List<String> feed = repeat(RAIN, FeedDiversity.WINDOW);

        assertThat(FeedDiversity.mix(feed, WEATHER, RAIN)).isEqualTo(feed);
    }

    @Test
    @DisplayName("재배열이지 교체가 아니다 - 페이지의 글 목록이 바뀌면 커서가 깨진다")
    void neverAddsOrDropsItems() {
        List<String> feed = repeat(RAIN, 25);
        for (int i = 10; i < 25; i += 3) {
            feed.set(i, SUNNY);
        }

        List<String> mixed = FeedDiversity.mix(feed, WEATHER, RAIN);

        assertThat(mixed).hasSameSizeAs(feed).containsExactlyInAnyOrderElementsOf(feed);
    }

    private long different(List<String> items) {
        return items.stream().filter(item -> !item.startsWith(RAIN)).count();
    }

    private List<String> repeat(String weather, int count) {
        List<String> items = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            items.add(weather);
        }
        return items;
    }
}
