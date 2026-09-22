package com.jellydiary.diary.service;

import com.jellydiary.diary.repository.DiaryRepository;
import com.jellydiary.diary.type.DiaryPolicy;
import com.jellydiary.llm.painter.DiaryPainting;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** AFTER_COMMIT 리스너의 DB 작업은 새 트랜잭션에서 한다(ddd-spring 7장). */
@Component
@RequiredArgsConstructor
public class DiaryResultApplier {

    private final DiaryRepository diaryRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void applySuccess(Long diaryId, DiaryPainting painting, DiaryPolicy policy) {
        diaryRepository.findById(diaryId).ifPresent(diary -> diary.applyPainting(painting, policy));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void applyFailure(Long diaryId) {
        diaryRepository.findById(diaryId).ifPresent(diary -> diary.failGeneration());
    }
}
