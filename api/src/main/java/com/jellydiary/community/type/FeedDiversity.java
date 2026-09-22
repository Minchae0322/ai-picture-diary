package com.jellydiary.community.type;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

/**
 * 추천 상위에 다른 날씨를 섞는다.
 *
 * <p>왜 필요한가: 유사도만으로 정렬하면 비 오는 사람에게 비 오는 글만 보인다. 감정을 다루는 제품에서
 * 그건 기능이 아니라 사고다(feed-ranking 4장). 신선도 점수만으로는 이 편향이 안 풀린다.
 *
 * <p>섞는 방식은 <b>재배열이지 교체가 아니다</b>. 페이지의 원소 집합은 그대로 두고 순서만 바꾼다 -
 * 그래야 커서 페이징이 안 깨진다. 다음 커서는 재배열 <b>전</b>의 점수 순서에서 뽑아야 한다.
 */
public final class FeedDiversity {

    /** 이 개수 안에 다른 날씨를 보장한다. "상위 10개 중 2개"의 10. */
    public static final int WINDOW = 10;

    /** 상위 구간에 최소한 이만큼은 다른 날씨. */
    public static final int MIN_DIFFERENT = 2;

    private FeedDiversity() {}

    /**
     * 점수 내림차순 목록을 받아 표시 순서로 재배열한다.
     *
     * <p>상위 {@value #WINDOW}개에 다른 날씨가 {@value #MIN_DIFFERENT}개 미만이면, 그 아래에서 가장 점수가 높은
     * 다른 날씨 글을 끌어올린다. 자리를 내주는 쪽은 상위 구간에서 <b>점수가 가장 낮은</b> 같은 날씨 글이다 -
     * 1등을 밀어내지 않는다.
     *
     * <p>끌어올 후보가 이 페이지 안에 없으면 그대로 둔다. 다음 페이지를 미리 읽어 오지 않는다.
     *
     * @param ordered 점수 내림차순 목록. 이 목록은 바뀌지 않는다
     * @param weatherOf 원소에서 날씨를 꺼내는 함수
     * @param tasteWeather 내 오늘 날씨. 이것과 <b>다른</b> 것을 섞는다
     */
    public static <T> List<T> mix(List<T> ordered, Function<T, String> weatherOf, String tasteWeather) {
        if (ordered.size() <= WINDOW) {
            return ordered;
        }

        List<T> mixed = new ArrayList<>(ordered);
        int shortage = MIN_DIFFERENT - countDifferent(mixed.subList(0, WINDOW), weatherOf, tasteWeather);

        // 상위에서 내줄 자리(점수 낮은 쪽부터)와 아래에서 끌어올 자리(점수 높은 쪽부터)를 맞바꾼다
        int slot = WINDOW - 1;
        int candidate = WINDOW;
        while (shortage > 0 && candidate < mixed.size()) {
            if (!isSame(mixed.get(candidate), weatherOf, tasteWeather)) {
                slot = sameWeatherSlotAtOrBefore(mixed, weatherOf, tasteWeather, slot);
                if (slot < 0) {
                    break;
                }
                java.util.Collections.swap(mixed, slot, candidate);
                slot--;
                shortage--;
            }
            candidate++;
        }
        return mixed;
    }

    private static <T> int countDifferent(List<T> head, Function<T, String> weatherOf, String taste) {
        return (int) head.stream().filter(item -> !isSame(item, weatherOf, taste)).count();
    }

    /** from 위치부터 앞으로 가며 taste 와 같은 날씨인 첫 자리. 없으면 -1. */
    private static <T> int sameWeatherSlotAtOrBefore(
            List<T> items, Function<T, String> weatherOf, String taste, int from) {
        for (int i = from; i >= 0; i--) {
            if (isSame(items.get(i), weatherOf, taste)) {
                return i;
            }
        }
        return -1;
    }

    private static <T> boolean isSame(T item, Function<T, String> weatherOf, String taste) {
        return taste.equals(weatherOf.apply(item));
    }
}
