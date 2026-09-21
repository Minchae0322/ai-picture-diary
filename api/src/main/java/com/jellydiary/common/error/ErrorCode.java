package com.jellydiary.common.error;

import org.springframework.http.HttpStatus;

/** 에러 코드는 여기 한 곳. api-design 3장. 삭제하지 않고 @Deprecated. */
public enum ErrorCode {

        COMMON_INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청 형식이 올바르지 않아요."),
        COMMON_UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요해요."),
        COMMON_INVALID_CURSOR(HttpStatus.BAD_REQUEST, "목록을 더 불러올 수 없어요. 새로고침해 주세요."),
        COMMON_CONFLICT(HttpStatus.CONFLICT, "방금 다른 곳에서 바뀌었어요. 새로고침 후 다시 시도해 주세요."),
    COMMON_INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "잠시 후 다시 시도해 주세요."),

        DIARY_NOT_FOUND(HttpStatus.NOT_FOUND, "일기를 찾을 수 없어요."),
        DIARY_ALREADY_EXISTS(HttpStatus.CONFLICT, "오늘은 이미 기록했어요."),
        DIARY_NOT_DONE(HttpStatus.UNPROCESSABLE_ENTITY, "아직 그림을 그리는 중이에요."),
        DIARY_REGENERATE_LIMIT(HttpStatus.UNPROCESSABLE_ENTITY, "오늘은 더 다시 그릴 수 없어요.");

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
