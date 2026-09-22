package com.jellydiary.badge.service;

import com.jellydiary.badge.type.BadgeCriteria;
import com.jellydiary.community.event.PostSharedEvent;
import com.jellydiary.diary.event.DiaryCompletedEvent;
import com.jellydiary.diary.type.Weather;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 다른 도메인의 사건을 뱃지 판정 조건으로 번역한다. 이 클래스가 유일한 번역 지점이라, 뱃지 도메인 자체는
 * 일기도 커뮤니티도 모른다(ddd-spring 7장).
 *
 * <p>PREMIUM("구독 시작")은 결제가 아직 없어 영원히 잠겨 있다. 구독이 붙으면 여기에 리스너를 하나 더 단다
 * (09 화면 문서 7장).
 */
@Component
@RequiredArgsConstructor
public class BadgeEarningListener {

    /** 시안의 "새벽 기록 · 04시 기록". 몇 시를 새벽으로 볼지는 뱃지 문구가 아니라 여기가 정한다. */
    private static final int DAWN_HOUR = 4;

    private final BadgeService badgeService;

    @EventListener
    public void on(DiaryCompletedEvent event) {
        badgeService.evaluate(event.userId(), criteriaOf(event));
    }

    @EventListener
    public void on(PostSharedEvent event) {
        badgeService.evaluate(event.userId(), BadgeCriteria.ofShare(event.shareCount()));
    }

    private BadgeCriteria criteriaOf(DiaryCompletedEvent event) {
        return new BadgeCriteria(
                event.totalCount(),
                event.streakDays(),
                event.countOf(Weather.SUNNY),
                event.countOf(Weather.RAIN),
                // "6종 전부"의 6은 날씨 enum이 안다. 뱃지 임계값에 숫자로 박지 않는다
                event.distinctWeatherCount() >= Weather.values().length,
                event.createdHour() == DAWN_HOUR,
                0,
                0,
                false);
    }
}
