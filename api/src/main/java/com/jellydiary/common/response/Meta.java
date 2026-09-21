package com.jellydiary.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.slf4j.MDC;

/** traceId는 MDC에서만 읽는다. 값을 여기서 만들지 않는다(RequestLogFilter가 보장). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record Meta(String traceId, String nextCursor, Boolean hasNext) {

    public static Meta now() {
        return new Meta(traceId(), null, null);
    }

    public static Meta cursor(String nextCursor) {
        return new Meta(traceId(), nextCursor, nextCursor != null);
    }

    private static String traceId() {
        return MDC.get("traceId");
    }
}
