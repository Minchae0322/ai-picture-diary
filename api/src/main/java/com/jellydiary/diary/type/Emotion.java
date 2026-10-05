package com.jellydiary.diary.type;

/**
 * 감정 9종. 07 뱃지의 "감정 탐험가 · 9종 전부"가 이 목록의 근거다.
 *
 * <p>한때 날씨 6종(SUNNY, RAIN ...)이었다. 날씨는 감정을 은유로 한 겹 더 감쌌고 6칸이 좁았다.
 * 옮길 때 SUNNY -> HAPPY, PARTLY_CLOUDY -> SOSO, CLOUDY -> TIRED, RAIN -> SAD,
 * SNOW -> DEPRESSED, RAINBOW -> ENERGETIC 로 보냈다(sql/patch 의 마이그레이션과 같은 표).
 * 프론트는 각 값을 과일 캐릭터 그림으로 그린다 - 표시명과 그림은 프론트가 매핑한다.
 *
 * <p>저장된 이름은 바꾸지 않는다(db-schema-and-migration 3장).
 * 값을 더하거나 빼면 "전부 모았나"를 보는 뱃지 판정이 따라 움직인다 - 숫자를 따로 적어 두지 않았기 때문이다.
 */
public enum Emotion {
    HAPPY,
    ENERGETIC,
    SOSO,
    SHY,
    EMBARRASSED,
    TIRED,
    SAD,
    DEPRESSED,
    ANGRY
}
