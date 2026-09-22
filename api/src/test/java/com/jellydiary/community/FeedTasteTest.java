package com.jellydiary.community;

import static org.assertj.core.api.Assertions.assertThat;

import com.jellydiary.community.type.FeedTaste;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 추천 점수 규칙. 이 점수는 정렬(SQL)과 커서(자바) 양쪽에 쓰이므로 경계를 못 박아 둔다.
 * SQL 표현식과 이 계산이 같은 답을 내는지는 DB가 필요해 통합 테스트가 본다.
 */
class FeedTasteTest {

    private static final Instant NOW = Instant.parse("2026-08-24T12:00:00Z");
    private static final Instant OLD = NOW.minus(Duration.ofDays(FeedTaste.FRESH_DAYS + 1));

    @Test
    @DisplayName("날씨가 같으면 2점, 다르면 0점")
    void weatherMatch() {
        FeedTaste taste = FeedTaste.of("RAIN", 0, NOW);

        assertThat(taste.score("RAIN", 3, OLD)).isEqualTo(FeedTaste.WEATHER_MATCH_POINTS);
        assertThat(taste.score("SUNNY", 3, OLD)).isZero();
    }

    @Test
    @DisplayName("기분 점수는 한 칸 차이까지 비슷하다고 본다")
    void moodTolerance() {
        FeedTaste taste = FeedTaste.of("SUNNY", 2, NOW);

        assertThat(taste.score("RAIN", 1, OLD)).isEqualTo(FeedTaste.MOOD_NEAR_POINTS);
        assertThat(taste.score("RAIN", 3, OLD)).isEqualTo(FeedTaste.MOOD_NEAR_POINTS);
        assertThat(taste.score("RAIN", 0, OLD)).isZero();
    }

    @Test
    @DisplayName("신선도 경계: 딱 3일 전은 받고 1초라도 더 오래면 못 받는다")
    void freshnessBoundary() {
        FeedTaste taste = FeedTaste.of("SUNNY", -3, NOW);
        Instant edge = NOW.minus(Duration.ofDays(FeedTaste.FRESH_DAYS));

        assertThat(taste.score("RAIN", 3, edge)).isEqualTo(FeedTaste.FRESH_POINTS);
        assertThat(taste.score("RAIN", 3, edge.minusSeconds(1))).isZero();
    }

    @Test
    @DisplayName("전부 맞으면 만점, 하나도 안 맞으면 0점")
    void bounds() {
        FeedTaste taste = FeedTaste.of("RAIN", -2, NOW);
        int max = FeedTaste.WEATHER_MATCH_POINTS + FeedTaste.MOOD_NEAR_POINTS + FeedTaste.FRESH_POINTS;

        assertThat(taste.score("RAIN", -2, NOW)).isEqualTo(max);
        assertThat(taste.score("SUNNY", 3, NOW.minus(Duration.ofDays(10)))).isZero();
    }

    @Test
    @DisplayName("점수는 0~4 밖으로 나가지 않는다 - 커서에 싣는 값이라 범위가 고정이어야 한다")
    void scoreStaysInRange() {
        FeedTaste taste = FeedTaste.of("RAIN", 0, NOW);
        int max = FeedTaste.WEATHER_MATCH_POINTS + FeedTaste.MOOD_NEAR_POINTS + FeedTaste.FRESH_POINTS;

        for (String weather : new String[] {"RAIN", "SUNNY"}) {
            for (int mood = -3; mood <= 3; mood++) {
                for (Instant at : new Instant[] {NOW, OLD}) {
                    assertThat(taste.score(weather, mood, at)).isBetween(0, max);
                }
            }
        }
    }
}
