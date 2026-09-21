package com.jellydiary.diary.service;

import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;
import com.jellydiary.common.logging.AppLog;
import com.jellydiary.diary.config.DiaryProperties;
import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.domain.DiaryPolicy;
import com.jellydiary.diary.domain.DiaryGeneratedRequestedEvent;
import com.jellydiary.diary.repository.DiaryRepository;
import com.jellydiary.diary.domain.Weather;
import java.time.Clock;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 일기 쓰기와 다시 그리기. 조율만 하고 규칙은 Diary가 가진다(ddd-spring 5장).
 *
 * <p>트랜잭션 경계는 <b>일기 1건 저장까지</b>다. AI 호출과 결과 반영은 커밋 밖에서 일어나며, 생성이 실패해도 기록은 남는다.
 * 경계를 이렇게 가정한 근거와 나머지 질문표는 docs/domain/diary/일기생성-비즈니스로직.md.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiaryService {

    private final DiaryRepository diaryRepository;
    private final ApplicationEventPublisher events;
    private final DiaryProperties properties;
    private final Clock clock;

    @Transactional
    public Long write(Long userId, String content, Weather userHint) {
        LocalDate today = today();
        if (diaryRepository.existsByUserIdAndEntryDate(userId, today)) {
            throw new BusinessException(ErrorCode.DIARY_ALREADY_EXISTS);
        }

        Diary diary = diaryRepository.save(write(userId, today, content, userHint));
        requestPainting(diary, "diary.written");

        return diary.getId();
    }

    @Transactional
    public void regenerate(Long userId, Long diaryId) {
        Diary diary = load(userId, diaryId);

        try {
            diary.requestRegenerate(policy());
        } catch (IllegalStateException e) {
            throw new BusinessException(ErrorCode.DIARY_REGENERATE_LIMIT, e.getMessage());
        }

        requestPainting(diary, "diary.regenerate_requested");
    }

    /** 남의 일기도 404로 감춘다(api-design 2장). */
    public Diary load(Long userId, Long diaryId) {
        return diaryRepository
                .findById(diaryId)
                .filter(diary -> diary.isOwnedBy(userId))
                .orElseThrow(() -> new BusinessException(ErrorCode.DIARY_NOT_FOUND));
    }

    public LocalDate today() {
        return LocalDate.now(clock.withZone(properties.zone()));
    }

    /** 도메인에 넘길 업무 상한. 값의 출처는 설정 한 곳이다. */
    public DiaryPolicy policy() {
        return properties.policy();
    }

    private Diary write(Long userId, LocalDate today, String content, Weather userHint) {
        try {
            return Diary.write(userId, today, content, userHint, policy());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST, e.getMessage());
        }
    }

    /** 실제 생성은 커밋 후 비동기로 일어난다(DiaryGenerationListener). */
    private void requestPainting(Diary diary, String event) {
        events.publishEvent(new DiaryGeneratedRequestedEvent(diary.getId()));

        AppLog.event(log, event)
                .with("diaryId", diary.getId())
                .with("regenerateCount", diary.getRegenerateCount())
                .info("diary painting requested");
    }
}
