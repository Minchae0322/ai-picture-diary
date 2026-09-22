package com.jellydiary.diary.repository;

import com.jellydiary.diary.type.Weather;

/** 날씨별 기록 수. 뱃지 판정 스냅샷을 쿼리 한 번으로 만들기 위한 투영이다. */
public record WeatherCount(Weather weather, long days) {}
