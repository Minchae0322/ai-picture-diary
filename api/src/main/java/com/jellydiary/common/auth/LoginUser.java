package com.jellydiary.common.auth;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 인증된 사용자 ID를 컨트롤러 파라미터로 주입한다. 없으면 401(LoginUserArgumentResolver).
 *
 * <p>컨트롤러가 인증 방식을 몰라도 되게 하는 것이 목적이다. 지금은 X-User-Id 헤더지만 spring-auth가 붙으면 리졸버만 바뀐다.
 */
@Documented
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface LoginUser {}
