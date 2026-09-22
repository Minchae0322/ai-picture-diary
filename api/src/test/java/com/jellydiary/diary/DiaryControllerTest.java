package com.jellydiary.diary;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jellydiary.common.auth.CurrentUserFilter;
import com.jellydiary.common.auth.LoginUserArgumentResolver;
import com.jellydiary.common.config.WebConfig;
import com.jellydiary.common.error.BusinessException;
import com.jellydiary.common.error.ErrorCode;
import com.jellydiary.diary.controller.DiaryController;
import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.service.DiaryQueryService;
import com.jellydiary.diary.service.DiaryService;
import com.jellydiary.diary.service.DiaryStatsService;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** 요청 매핑, @Valid 경계, 예외 -> 상태 코드/봉투 변환만 본다. 도메인 규칙은 DiaryTest. */
@WebMvcTest(DiaryController.class)
@Import({CurrentUserFilter.class, LoginUserArgumentResolver.class, WebConfig.class})
class DiaryControllerTest {

    private static final String USER_HEADER = "X-User-Id";
    private static final Long USER_ID = 1L;

    @Autowired MockMvc mockMvc;

    @MockitoBean DiaryService diaryService;
    @MockitoBean DiaryQueryService diaryQueryService;
    @MockitoBean DiaryStatsService diaryStatsService;

    @Test
    @DisplayName("기록 성공 시 201과 Location, 상태는 GENERATING")
    void write() throws Exception {
        given(diaryService.write(eq(USER_ID), any(), any())).willReturn(12L);

        writeRequest("오늘은 좋았다")
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/diaries/12"))
                .andExpect(jsonPath("$.data.id").value("12"))
                .andExpect(jsonPath("$.data.status").value("GENERATING"));
    }

    @Test
    @DisplayName("본문이 공백뿐이면 400과 errors[]")
    void writeRejectsBlankContent() throws Exception {
        writeRequest("   ")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("COMMON_INVALID_REQUEST"))
                .andExpect(jsonPath("$.error.errors").isArray());
    }

    @Test
    @DisplayName("DB 컬럼 길이를 넘으면 400. 업무 상한(설정)은 도메인이 따로 막는다")
    void writeRejectsOverColumnLength() throws Exception {
        writeRequest("가".repeat(Diary.CONTENT_COLUMN_LENGTH + 1)).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("사용자 헤더가 없으면 401")
    void rejectsAnonymous() throws Exception {
        mockMvc.perform(get("/api/v1/diaries/today"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("COMMON_UNAUTHORIZED"));
    }

    @Test
    @DisplayName("오늘 기록이 없으면 200 + data 없음")
    void todayReturnsNothingWhenNotWritten() throws Exception {
        given(diaryQueryService.findToday(USER_ID)).willReturn(Optional.empty());

        mockMvc.perform(asUser(get("/api/v1/diaries/today")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    @DisplayName("이미 오늘 기록이 있으면 409")
    void writeRejectsSecondDiaryOfTheDay() throws Exception {
        willThrow(new BusinessException(ErrorCode.DIARY_ALREADY_EXISTS))
                .given(diaryService)
                .write(anyLong(), any(), any());

        writeRequest("두 번째")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("DIARY_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("재생성 상한을 넘으면 422")
    void regenerateRejectsOverLimit() throws Exception {
        willThrow(new BusinessException(ErrorCode.DIARY_REGENERATE_LIMIT))
                .given(diaryService)
                .regenerate(USER_ID, 12L);

        mockMvc.perform(asUser(post("/api/v1/diaries/12/regenerate")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("DIARY_REGENERATE_LIMIT"));
    }

    private ResultActions writeRequest(String content) throws Exception {
        String body = "{\"content\":\"" + content + "\"}";
        return mockMvc.perform(
                asUser(post("/api/v1/diaries")).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private MockHttpServletRequestBuilder asUser(MockHttpServletRequestBuilder request) {
        return request.header(USER_HEADER, USER_ID);
    }
}
