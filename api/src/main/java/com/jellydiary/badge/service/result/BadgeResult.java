package com.jellydiary.badge.service.result;

import java.time.Instant;

/** 07 그리드 한 칸. 잠금 뱃지도 조건 문구는 보인다(07 화면 문서 4장). */
public record BadgeResult(String code, String name, String condition, boolean earned, Instant earnedAt) {}
