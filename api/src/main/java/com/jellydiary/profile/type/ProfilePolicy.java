package com.jellydiary.profile.type;

/**
 * 프로필의 업무 규칙. 값은 설정(app.profile.*)에서 오고 도메인은 받아서 쓴다.
 * 도메인이 설정 클래스를 알지 않게 하기 위한 값 객체다(config-and-secrets 4-1장).
 */
public record ProfilePolicy(int maxNicknameLength, String defaultAiStyle) {

    public ProfilePolicy {
        if (maxNicknameLength < 1) {
            throw new IllegalArgumentException("닉네임 최대 길이는 1 이상");
        }
        if (defaultAiStyle == null || defaultAiStyle.isBlank()) {
            throw new IllegalArgumentException("기본 그림 스타일은 필수");
        }
    }

    public boolean allowsNickname(String nickname) {
        return !nickname.isEmpty() && nickname.length() <= maxNicknameLength;
    }
}
