package com.jellydiary.badge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jellydiary.badge.domain.Badge;
import com.jellydiary.badge.type.BadgeCriteria;
import com.jellydiary.badge.type.BadgeMetric;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 뱃지는 조건 경계가 전부다. 정의는 tb_badge 에서 오지만 판정식(지표 값 >= 임계값)은 코드라
 * 여기서 못 박는다. 시안의 숫자가 맞는지는 sql/patch 의 seed 가, 판정 방식은 이 테스트가 지킨다.
 */
class BadgeTest {

    @Test
    @DisplayName("임계값 미만은 못 받고 같으면 받는다")
    void thresholdBoundary() {
        Badge jelly7 = badge(BadgeMetric.STREAK_DAYS, 7);

        assertThat(jelly7.isEarnedBy(streak(6))).isFalse();
        assertThat(jelly7.isEarnedBy(streak(7))).isTrue();
        assertThat(jelly7.isEarnedBy(streak(8))).isTrue();
    }

    @Test
    @DisplayName("지표가 다르면 값이 아무리 커도 안 걸린다")
    void metricMustMatch() {
        Badge sunnyCollector = badge(BadgeMetric.SUNNY_RECORDS, 10);

        assertThat(sunnyCollector.isEarnedBy(streak(999))).isFalse();
    }

    @Test
    @DisplayName("했나/아닌가 지표는 1로 환산된다 - 임계값 1과 비교하면 된다")
    void booleanMetricsBecomeOneOrZero() {
        BadgeCriteria none = new BadgeCriteria(0, 0, 0, 0, false, false, 0, 0, false);
        BadgeCriteria all = new BadgeCriteria(0, 0, 0, 0, true, true, 0, 0, true);

        for (BadgeMetric metric :
                new BadgeMetric[] {BadgeMetric.ALL_WEATHERS, BadgeMetric.DAWN_RECORD, BadgeMetric.PREMIUM}) {
            assertThat(none.valueOf(metric)).isZero();
            assertThat(all.valueOf(metric)).isEqualTo(1);
            assertThat(badge(metric, 1).isEarnedBy(all)).isTrue();
            assertThat(badge(metric, 1).isEarnedBy(none)).isFalse();
        }
    }

    @Test
    @DisplayName("공유로만 판정할 때 기록 뱃지가 딸려오지 않는다")
    void shareCriteriaDoesNotEarnRecordBadges() {
        BadgeCriteria criteria = BadgeCriteria.ofShare(10);

        assertThat(badge(BadgeMetric.SHARES, 10).isEarnedBy(criteria)).isTrue();
        assertThat(badge(BadgeMetric.TOTAL_RECORDS, 1).isEarnedBy(criteria)).isFalse();
        assertThat(badge(BadgeMetric.ALL_WEATHERS, 1).isEarnedBy(criteria)).isFalse();
        assertThat(badge(BadgeMetric.DAWN_RECORD, 1).isEarnedBy(criteria)).isFalse();
    }

    @Test
    @DisplayName("임계값 0짜리 뱃지는 만들 수 없다 - 모두가 즉시 받게 된다")
    void rejectsZeroThreshold() {
        assertThatThrownBy(() -> badge(BadgeMetric.TOTAL_RECORDS, 0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private Badge badge(BadgeMetric metric, int threshold) {
        return Badge.define("TEST", "테스트", "문구", metric, threshold, 1);
    }

    private BadgeCriteria streak(int days) {
        return new BadgeCriteria(days, days, 0, 0, false, false, 0, 0, false);
    }
}
