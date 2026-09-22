package com.jellydiary.badge.service.result;

import java.util.List;

/**
 * 07 진행 요약 + 그리드. total 은 지금 정의된 뱃지 수다 - 시안의 "40개"는 28개가 아직 정의되지 않아
 * 그대로 쓸 수 없다(07 화면 문서 7장).
 */
public record BadgeCollectionResult(List<BadgeResult> badges, int earnedCount, int totalCount) {}
