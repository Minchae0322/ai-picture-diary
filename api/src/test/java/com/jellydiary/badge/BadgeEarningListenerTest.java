package com.jellydiary.badge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.jellydiary.badge.service.BadgeEarningListener;
import com.jellydiary.badge.service.BadgeService;
import com.jellydiary.badge.type.BadgeCriteria;
import com.jellydiary.diary.event.DiaryCompletedEvent;
import com.jellydiary.diary.type.Weather;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/** 사건 -> 판정 조건 번역만 본다. "6종 전부"의 6이 날씨 enum에서 오는지가 핵심이다. */
class BadgeEarningListenerTest {

    private final BadgeService badgeService = mock(BadgeService.class);
    private final BadgeEarningListener listener = new BadgeEarningListener(badgeService);

    @Test
    @DisplayName("'6종 전부'의 기준은 날씨 enum 개수다 - 뱃지 임계값에 숫자로 박지 않는다")
    void allWeathersFollowsWeatherEnum() {
        listener.on(event(Weather.values().length, 12));
        assertThat(capture().allWeathers()).isTrue();

        listener.on(event(Weather.values().length - 1, 12));
        assertThat(capture().allWeathers()).isFalse();
    }

    @Test
    @DisplayName("새벽 기록은 04시에만")
    void dawnRecordOnlyAtFour() {
        listener.on(event(1, 3));
        assertThat(capture().dawnRecord()).isFalse();

        listener.on(event(1, 4));
        assertThat(capture().dawnRecord()).isTrue();

        listener.on(event(1, 5));
        assertThat(capture().dawnRecord()).isFalse();
    }

    private BadgeCriteria capture() {
        ArgumentCaptor<BadgeCriteria> captor = ArgumentCaptor.forClass(BadgeCriteria.class);
        verify(badgeService, org.mockito.Mockito.atLeastOnce()).evaluate(anyLong(), captor.capture());
        return captor.getValue();
    }

    private DiaryCompletedEvent event(int distinctWeathers, int hour) {
        Map<Weather, Integer> counts = new EnumMap<>(Weather.class);
        for (int i = 0; i < distinctWeathers; i++) {
            counts.put(Weather.values()[i], 1);
        }
        return new DiaryCompletedEvent(
                1L, 1L, LocalDate.of(2026, 8, 24), Weather.SUNNY, hour, 1, 1, counts);
    }
}
