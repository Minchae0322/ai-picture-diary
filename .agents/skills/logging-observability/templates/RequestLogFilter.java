package com.example.common.logging;   // 프로젝트 패키지로

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.util.Set;

/**
 * 요청 종료 1줄 로그. 시작 로그는 남기지 않는다 (durationMs가 있으면 충분).
 * event=http.request.done method path status durationMs
 * traceId/spanId는 Micrometer Tracing이 MDC에 넣으므로 여기서 안 건드린다.
 * memberId는 인증 필터에서 MDC.put + finally remove (spring-auth 스킬).
 */
@Component
@Order(Integer.MIN_VALUE + 10)   // 트레이싱 필터 뒤, 인증 필터 앞
public class RequestLogFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLogFilter.class);
    private static final Set<String> SKIP_PREFIXES = Set.of("/actuator", "/favicon", "/static");

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return "OPTIONS".equals(request.getMethod()) || SKIP_PREFIXES.stream().anyMatch(uri::startsWith);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws java.io.IOException, jakarta.servlet.ServletException {
        long start = System.nanoTime();
        try {
            chain.doFilter(req, res);
        } finally {
            long durationMs = (System.nanoTime() - start) / 1_000_000;
            int status = res.getStatus();
            var event = log.atLevel(status >= 500 ? org.slf4j.event.Level.ERROR : status >= 400 ? org.slf4j.event.Level.WARN : org.slf4j.event.Level.INFO)
                .addKeyValue("event", status >= 500 ? "http.request.failed" : "http.request.done")
                .addKeyValue("method", req.getMethod())
                .addKeyValue("path", req.getRequestURI())        // 쿼리스트링 제외 (토큰/개인정보 유입 방지)
                .addKeyValue("status", status)
                .addKeyValue("durationMs", durationMs);
            if (durationMs > 2000) event.addKeyValue("slow", true);
            event.log("http request");
        }
    }
}
