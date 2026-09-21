package com.jellydiary.common.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.jellydiary.common.response.Meta;

import java.util.List;

/** 실패 응답 봉투. api-design 3장. */
public record ErrorResponse(Body error, Meta meta) {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Body(String code, String message, List<FieldError> errors) {
    }

    public record FieldError(String field, String reason, String message) {
    }

    public static ErrorResponse of(ErrorCode code, String message) {
        return new ErrorResponse(new Body(code.name(), message, null), Meta.now());
    }

    public static ErrorResponse of(ErrorCode code, String message, List<FieldError> errors) {
        return new ErrorResponse(new Body(code.name(), message, errors), Meta.now());
    }
}
