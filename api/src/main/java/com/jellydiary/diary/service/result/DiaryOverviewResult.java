package com.jellydiary.diary.service.result;


/** 02 인사줄 / 06 KPI / 10 통계가 함께 쓰는 누적 지표. 연속 일수의 계산 위치는 StreakCalculator 한 곳이다. */
public record DiaryOverviewResult(long totalCount, int streakDays) {}
