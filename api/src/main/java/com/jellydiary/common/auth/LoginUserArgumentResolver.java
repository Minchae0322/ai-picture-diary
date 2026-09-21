package com.jellydiary.common.auth;

import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/** @LoginUser Long -> 현재 사용자 ID. 없으면 401을 던진다. 인증 확인을 컨트롤러 밖으로 뺀다. */
@Component
public class LoginUserArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(LoginUser.class)
                && Long.class.equals(parameter.getParameterType());
    }

    @Override
    public Long resolveArgument(
            MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory) {
        Long userId = CurrentUser.id();
        if (userId == null) {
            throw new BusinessException(ErrorCode.COMMON_UNAUTHORIZED);
        }
        return userId;
    }
}
