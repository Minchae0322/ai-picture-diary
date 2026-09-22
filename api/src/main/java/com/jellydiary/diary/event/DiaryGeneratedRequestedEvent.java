package com.jellydiary.diary.event;

/** 저장 커밋 후 AI 생성을 시작하라는 신호. ddd-spring 7장. */
public record DiaryGeneratedRequestedEvent(Long diaryId) {
}
