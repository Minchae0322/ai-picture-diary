package com.jellydiary.diary.type;

/**
 * 감정 날씨 6종. 07 뱃지의 "감정 탐험가 · 6종 전부"가 이 목록의 근거다.
 * 저장된 이름은 바꾸지 않는다(db-schema-and-migration 3장). 표시명은 프론트가 매핑한다.
 */
public enum Weather {
    SUNNY,
    PARTLY_CLOUDY,
    CLOUDY,
    RAIN,
    SNOW,
    RAINBOW
}
