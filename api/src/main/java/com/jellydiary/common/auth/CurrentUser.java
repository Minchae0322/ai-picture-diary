package com.jellydiary.common.auth;

/**
 * 임시 사용자 컨텍스트. 인증(spring-auth)이 붙기 전까지 X-User-Id 헤더 값을 담는다.
 * ponytail: ThreadLocal 임시 구현. Spring Security 도입 시 SecurityContext로 교체하고 이 클래스는 삭제.
 */
public final class CurrentUser {

    private static final ThreadLocal<Long> HOLDER = new ThreadLocal<>();
    private static final long SYSTEM = 0L;

    private CurrentUser() {
    }

    public static void set(Long userId) {
        HOLDER.set(userId);
    }

    public static void clear() {
        HOLDER.remove();
    }

    public static Long id() {
        return HOLDER.get();
    }

    public static long idOrSystem() {
        Long id = HOLDER.get();
        return id == null ? SYSTEM : id;
    }
}
