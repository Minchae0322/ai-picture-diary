package com.jellydiary.common.logging;

import org.slf4j.Logger;
import org.slf4j.spi.LoggingEventBuilder;

/**
 * 구조화 로그 헬퍼. event 필드를 강제하고 값이 메시지 문자열에 섞이는 것을 막는다.
 *
 *   AppLog.event(log, "order.placed").with("orderId", id).with("itemCount", n).info("order placed");
 *   AppLog.event(log, "payment.approve_failed").with("orderId", id).with("pgCode", code).error("payment failed", ex);
 */
public final class AppLog {

    private final LoggingEventBuilder info, warn, error, debug;

    private AppLog(Logger log, String event) {
        this.info  = log.atInfo().addKeyValue("event", event);
        this.warn  = log.atWarn().addKeyValue("event", event);
        this.error = log.atError().addKeyValue("event", event);
        this.debug = log.atDebug().addKeyValue("event", event);
    }

    /** event는 <domain>.<action> 소문자 점 표기, 과거형. 예: order.placed, auth.token_rejected */
    public static AppLog event(Logger log, String event) {
        return new AppLog(log, event);
    }

    /** 값은 ID/숫자/enum만. 이름, 이메일, 본문, 토큰을 넣지 않는다. */
    public AppLog with(String key, Object value) {
        info.addKeyValue(key, value);
        warn.addKeyValue(key, value);
        error.addKeyValue(key, value);
        debug.addKeyValue(key, value);
        return this;
    }

    public void info(String message)  { info.log(message); }
    public void warn(String message)  { warn.log(message); }
    public void debug(String message) { debug.log(message); }
    /** 예외는 경계에서 한 번만. 중간 계층에서 잡아 로그하고 다시 던지지 않는다. */
    public void error(String message, Throwable t) { error.setCause(t).log(message); }
    public void warn(String message, Throwable t)  { warn.setCause(t).log(message); }
}
