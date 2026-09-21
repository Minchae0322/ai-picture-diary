package com.jellydiary.common.response;

import java.util.List;

/** 성공 응답 봉투. api-design 3장. */
public record ApiResponse<T>(T data, Meta meta) {

    public static <T> ApiResponse<T> of(T data) {
        return new ApiResponse<>(data, Meta.now());
    }

    public static <T> ApiResponse<List<T>> cursor(List<T> items, String nextCursor) {
        return new ApiResponse<>(items, Meta.cursor(nextCursor));
    }
}
