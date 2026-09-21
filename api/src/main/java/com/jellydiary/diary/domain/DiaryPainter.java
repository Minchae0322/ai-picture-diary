package com.jellydiary.diary.domain;

/**
 * 한 줄 기록을 감정 날씨와 그림으로 바꾸는 포트. 구현은 infrastructure/ai.
 * 도메인은 LLM 타입을 모른다(llm-integration 1장).
 */
public interface DiaryPainter {

    DiaryPainting paint(String content, Weather userHint);
}
