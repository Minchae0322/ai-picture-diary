package com.jellydiary.common.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/** SHA-256 을 소문자 hex 로. 기기 식별자처럼 원문을 두면 안 되는 값에 쓴다. */
public final class Sha256 {

    private static final char[] HEX = "0123456789abcdef".toCharArray();

    private Sha256() {}

    public static String hex(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("해시할 값이 비어 있다");
        }
        byte[] digest = digest(raw);
        char[] out = new char[digest.length * 2];
        for (int i = 0; i < digest.length; i += 1) {
            int b = digest[i] & 0xff;
            out[i * 2] = HEX[b >>> 4];
            out[i * 2 + 1] = HEX[b & 0x0f];
        }
        return new String(out);
    }

    private static byte[] digest(String raw) {
        try {
            // MessageDigest 는 스레드 안전하지 않다. 매번 새로 받는다
            return MessageDigest.getInstance("SHA-256")
                    .digest(raw.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            // 표준 JDK 가 보장하는 알고리즘이라 도달할 수 없다
            throw new IllegalStateException("SHA-256 을 쓸 수 없다", e);
        }
    }
}
