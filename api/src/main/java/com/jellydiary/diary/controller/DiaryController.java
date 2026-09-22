package com.jellydiary.diary.controller;

import com.jellydiary.common.auth.LoginUser;
import com.jellydiary.common.response.ApiResponse;
import com.jellydiary.diary.controller.dto.DiaryRequest;
import com.jellydiary.diary.controller.dto.DiaryResponse;
import com.jellydiary.diary.type.StatsPeriod;
import com.jellydiary.diary.service.DiaryQueryService;
import com.jellydiary.diary.service.DiaryStatsService;
import com.jellydiary.diary.service.DiaryService;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/diaries")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;
    private final DiaryQueryService diaryQueryService;
    private final DiaryStatsService diaryStatsService;

    /** 02 -> 03. 생성은 비동기라 201 + GENERATING 으로 즉시 돌려준다. */
    @PostMapping
    public ResponseEntity<ApiResponse<DiaryResponse.Created>> write(
            @LoginUser Long userId, @Valid @RequestBody DiaryRequest.Write request) {
        Long diaryId = diaryService.write(userId, request.content(), request.userHint());

        return ResponseEntity.created(URI.create("/api/v1/diaries/" + diaryId))
                .body(ApiResponse.of(DiaryResponse.Created.generating(diaryId)));
    }

    /** 05 감정 캘린더. month 를 생략하면 이번 달(서버 기준 Asia/Seoul). */
    @GetMapping("/calendar")
    public ApiResponse<DiaryResponse.Calendar> calendar(
            @LoginUser Long userId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        YearMonth target = month == null ? YearMonth.from(diaryService.today()) : month;

        return ApiResponse.of(DiaryResponse.Calendar.from(diaryStatsService.calendar(userId, target)));
    }

    /** 06 감정 그래프. */
    @GetMapping("/stats")
    public ApiResponse<DiaryResponse.Stats> stats(
            @LoginUser Long userId, @RequestParam(defaultValue = "MONTH") StatsPeriod period) {
        return ApiResponse.of(DiaryResponse.Stats.from(diaryStatsService.stats(userId, period)));
    }

    /** 02 연속 기록 배지 · 06 KPI · 10 통계가 같이 쓰는 누적 지표. */
    @GetMapping("/overview")
    public ApiResponse<DiaryResponse.Overview> overview(@LoginUser Long userId) {
        return ApiResponse.of(DiaryResponse.Overview.from(diaryStatsService.overview(userId)));
    }

    /** 03 폴링 + 04 상세. */
    @GetMapping("/{diaryId}")
    public ApiResponse<DiaryResponse.Detail> detail(
            @LoginUser Long userId, @PathVariable Long diaryId) {
        return ApiResponse.of(DiaryResponse.Detail.from(diaryQueryService.findDetail(userId, diaryId)));
    }

    /** 02/04 분기용. 오늘 기록이 없으면 data=null. */
    @GetMapping("/today")
    public ApiResponse<DiaryResponse.Detail> today(@LoginUser Long userId) {
        return ApiResponse.of(
                diaryQueryService.findToday(userId).map(DiaryResponse.Detail::from).orElse(null));
    }

    /** 02 최근 기록. 커서 페이징. */
    @GetMapping
    public ApiResponse<List<DiaryResponse.Summary>> list(
            @LoginUser Long userId,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int size) {
        DiaryQueryService.Page page = diaryQueryService.findPage(userId, cursor, size);

        return ApiResponse.cursor(
                page.items().stream().map(DiaryResponse.Summary::from).toList(), page.nextCursor());
    }

    /** 04 다시 그리기. 상한은 도메인이 막는다. */
    @PostMapping("/{diaryId}/regenerate")
    public ApiResponse<DiaryResponse.Created> regenerate(
            @LoginUser Long userId, @PathVariable Long diaryId) {
        diaryService.regenerate(userId, diaryId);

        return ApiResponse.of(DiaryResponse.Created.generating(diaryId));
    }
}
