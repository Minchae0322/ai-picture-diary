package com.jellydiary.common.error;

import org.springframework.http.HttpStatus;

/** 에러 코드는 여기 한 곳. api-design 3장. 삭제하지 않고 @Deprecated. */
public enum ErrorCode {
    COMMON_INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청 형식이 올바르지 않아요."),
    COMMON_UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요해요."),
    /** 게스트로는 할 수 없는 일. 401 과 다르다 - 누구인지는 알지만 계정이 없다 */
    COMMON_LOGIN_REQUIRED(HttpStatus.FORBIDDEN, "로그인하면 쓸 수 있어요."),
    COMMON_INVALID_CURSOR(HttpStatus.BAD_REQUEST, "목록을 더 불러올 수 없어요. 새로고침해 주세요."),
    COMMON_CONFLICT(HttpStatus.CONFLICT, "방금 다른 곳에서 바뀌었어요. 새로고침 후 다시 시도해 주세요."),
    COMMON_INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "잠시 후 다시 시도해 주세요."),

    DIARY_NOT_FOUND(HttpStatus.NOT_FOUND, "일기를 찾을 수 없어요."),
    /**
     * 오늘의 기분을 고르지 않고 기록했다. 본문 길이 위반(COMMON_INVALID_REQUEST)과 사유가 달라 코드도 따로다 - 앱이 "기분 칩을 먼저 눌러 주세요"로
     * 안내할 근거를 잃지 않게 한다(ADR 2026-10-20 기분-선택-필수와-본문-200자).
     */
    DIARY_EMOTION_REQUIRED(HttpStatus.BAD_REQUEST, "오늘의 기분을 먼저 골라 주세요."),
    DIARY_ALREADY_EXISTS(HttpStatus.CONFLICT, "오늘은 이미 기록했어요."),
    DIARY_NOT_DONE(HttpStatus.UNPROCESSABLE_ENTITY, "아직 그림을 그리는 중이에요."),
    DIARY_REGENERATE_LIMIT(HttpStatus.UNPROCESSABLE_ENTITY, "오늘은 더 다시 그릴 수 없어요."),
    /**
     * 게스트의 하루 생성 상한. 사유가 위와 달라 코드도 따로다 - 같은 코드로 뭉개면 앱이 "로그인하면 더 그릴 수 있어요"를 띄울 근거를 잃는다. 광고 보상이 붙으면
     * 문구가 바뀐다(ADR 2026-10-20). 그 전까지는 광고를 약속하지 않는다.
     */
    DIARY_GUEST_GENERATE_LIMIT(
            HttpStatus.UNPROCESSABLE_ENTITY, "오늘 그릴 수 있는 횟수를 다 썼어요. 로그인하면 더 그릴 수 있어요."),

    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없어요."),
    POST_ALREADY_SHARED(HttpStatus.CONFLICT, "이미 공유한 일기예요."),
    POST_ALREADY_REPORTED(HttpStatus.CONFLICT, "이미 신고한 글이에요."),

    STORE_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "그런 아이템이 없어요."),
    STORE_ITEM_LOCKED(HttpStatus.UNPROCESSABLE_ENTITY, "Jelly Plus 구독이 필요한 아이템이에요.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus status() {
        return status;
    }

    public String message() {
        return message;
    }
}
