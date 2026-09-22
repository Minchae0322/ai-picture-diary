package com.jellydiary.diary.service;

import com.jellydiary.common.logging.AppLog;
import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.event.DiaryGeneratedRequestedEvent;
import com.jellydiary.diary.repository.DiaryRepository;
import com.jellydiary.llm.painter.DiaryPainter;
import com.jellydiary.llm.painter.DiaryPainting;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 커밋 후 비동기로 AI를 부른다. 트랜잭션 안에서 LLM을 호출하지 않는다(transaction-and-concurrency 6장).
 *
 * <p>자동 재시도는 없다 - 호출마다 돈이 든다. 실패는 FAILED로 남기고 사용자가 다시 그리기를 누를 때만 재시도한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DiaryGenerationListener {

    private final DiaryRepository diaryRepository;
    private final DiaryPainter painter;
    private final DiaryResultApplier resultApplier;
    private final DiaryService diaryService;
    private final DiaryStatsService diaryStatsService;
    private final ApplicationEventPublisher events;

    @Async("aiExecutor")
    @TransactionalEventListener
    public void on(DiaryGeneratedRequestedEvent event) {
        Optional<Diary> diary = diaryRepository.findById(event.diaryId());
        if (diary.isEmpty()) {
            return;
        }

        paint(event.diaryId(), diary.get());
    }

    private void paint(Long diaryId, Diary diary) {
        try {
            DiaryPainting painting = painter.paint(diary.getContent(), diary.getUserHint());
            resultApplier.applySuccess(diaryId, painting, diaryService.policy());
            announceCompletion(diaryId);

            AppLog.event(log, "diary.painted")
                    .with("diaryId", diaryId)
                    .with("weather", painting.weather())
                    .info("diary painted");
        } catch (RuntimeException e) {
            resultApplier.applyFailure(diaryId);

            AppLog.event(log, "diary.paint_failed").with("diaryId", diaryId).error("diary paint failed", e);
        }
    }

    /**
     * 뱃지 판정은 저장 성공 직후 서버가 한다(07 화면 문서 4장). 스냅샷을 이벤트에 담아 보내므로 뱃지 도메인은
     * 일기를 되묻지 않는다. applySuccess 가 이미 커밋된 뒤라 집계에 방금 건이 포함된다.
     */
    private void announceCompletion(Long diaryId) {
        diaryRepository.findById(diaryId).map(diaryStatsService::snapshot).ifPresent(events::publishEvent);
    }
}
