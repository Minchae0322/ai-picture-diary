package com.jellydiary.common.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 요청 종료 1줄(logging-observability 5장). 시작 로그는 남기지 않는다. 헬스체크는 제외.
 * traceId가 없는 경우(트레이싱 미구성)에도 MDC에 하나는 있도록 보장한다 - api-design의 meta.traceId가 이 값을 쓴다.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RequestLogFilter extends OncePerRequestFilter {

    private static final String TRACE_ID = "traceId";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getRequestURI().startsWith("/actuator");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long startedAt = System.nanoTime();
        boolean traceIdCreated = ensureTraceId();
        try {
            chain.doFilter(request, response);
        } finally {
            AppLog.event(log, "http.request.done")
                    .with("method", request.getMethod())
                    .with("path", request.getRequestURI())
                    .with("status", response.getStatus())
                    .with("durationMs", (System.nanoTime() - startedAt) / 1_000_000)
                    .info("http request done");
            if (traceIdCreated) {
                MDC.remove(TRACE_ID);
            }
        }
    }

    private boolean ensureTraceId() {
        if (MDC.get(TRACE_ID) != null) {
            return false;
        }
        MDC.put(TRACE_ID, java.util.UUID.randomUUID().toString().replace("-", ""));
        return true;
    }
}
