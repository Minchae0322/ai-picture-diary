package com.jellydiary.community.controller.dto;

import com.jellydiary.community.type.ReportReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class CommunityRequest {

    private CommunityRequest() {}

    /** 04 "공유". 본문은 서버가 일기에서 복사하므로 받지 않는다 - 위변조 지점을 만들지 않는다. */
    public record Share(@NotNull Long diaryId) {}

    public record Report(@NotNull ReportReason reason, @Size(max = 200) String detail) {}
}
