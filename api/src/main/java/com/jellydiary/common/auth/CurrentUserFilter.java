package com.jellydiary.common.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/** X-User-Id 헤더 -> CurrentUser. 인증 도입 전용 임시 필터. */
@Component
public class CurrentUserFilter extends OncePerRequestFilter {

    private static final String HEADER = "X-User-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            CurrentUser.set(parse(request.getHeader(HEADER)));
            chain.doFilter(request, response);
        } finally {
            CurrentUser.clear();
        }
    }

    private Long parse(String raw) {
        try {
            return raw == null ? null : Long.valueOf(raw);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
