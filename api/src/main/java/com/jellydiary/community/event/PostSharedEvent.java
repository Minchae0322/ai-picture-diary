package com.jellydiary.community.event;

/** 공유가 하나 늘었다. 뱃지("공유왕 · 10회 공유") 판정의 입력이 된다. */
public record PostSharedEvent(Long userId, int shareCount) {}
