package com.jellydiary.common.error;

import com.jellydiary.common.logging.AppLog;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * 예외 -> ErrorCode 변환은 여기 한 곳(api-design 3장). 스택은 5xx에서만 한 번 남긴다(logging-observability
 * 1장/5장).
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    ResponseEntity<ErrorResponse> handleBusiness(BusinessException e) {
        return reject(e.errorCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        List<ErrorResponse.FieldError> errors =
                e.getBindingResult().getFieldErrors().stream()
                        .map(f -> new ErrorResponse.FieldError(f.getField(), f.getCode(), f.getDefaultMessage()))
                        .toList();
        ErrorCode code = ErrorCode.COMMON_INVALID_REQUEST;
        warn(code, "validation failed");
        return ResponseEntity.status(code.status())
                .body(ErrorResponse.of(code, code.message(), errors));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorResponse> handleMalformed(Exception e) {
        return reject(ErrorCode.COMMON_INVALID_REQUEST, ErrorCode.COMMON_INVALID_REQUEST.message());
    }

    /** 낙관적 락 충돌 = 동시에 같은 행을 바꿨다. 재조회 후 재시도 가능하므로 409. */
    @ExceptionHandler(OptimisticLockingFailureException.class)
    ResponseEntity<ErrorResponse> handleOptimisticLock(OptimisticLockingFailureException e) {
        return reject(ErrorCode.COMMON_CONFLICT, ErrorCode.COMMON_CONFLICT.message());
    }

    /**
     * unique 제약 위반은 409로 바꾼다. 어느 제약인지는 여기서 알 수 없으므로 도메인 뜻이 필요한 곳은
     * 각 서비스가 saveAndFlush 로 직접 잡아 자기 ErrorCode 로 바꾼다(예: DiaryService 하루 1건).
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ErrorResponse> handleConstraint(DataIntegrityViolationException e) {
        return reject(ErrorCode.COMMON_CONFLICT, ErrorCode.COMMON_CONFLICT.message());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> handleUnexpected(Exception e) {
        ErrorCode code = ErrorCode.COMMON_INTERNAL_ERROR;
        AppLog.event(log, "http.request.failed").error("unhandled error", e);
        return ResponseEntity.status(code.status()).body(ErrorResponse.of(code, code.message()));
    }

    private ResponseEntity<ErrorResponse> reject(ErrorCode code, String message) {
        warn(code, message);
        return ResponseEntity.status(code.status()).body(ErrorResponse.of(code, message));
    }

    /** 4xx는 WARN. 클라이언트 잘못이며 급증하면 UI 문제 신호다. */
    private void warn(ErrorCode code, String message) {
        AppLog.event(log, "http.request_rejected")
                .with("reason", code.name())
                .with("status", code.status().value())
                .warn(message);
    }
}
