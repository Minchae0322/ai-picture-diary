package com.jellydiary.account.service.result;

/**
 * 게스트 기기에 발급된 사용자 번호.
 *
 * @param userId 앱이 그 뒤 모든 요청의 X-User-Id 로 보내는 값
 * @param registered 이번 호출에 새로 만들어졌는지. 이미 있던 기기면 false (멱등)
 */
public record GuestAccountResult(Long userId, boolean registered) {}
