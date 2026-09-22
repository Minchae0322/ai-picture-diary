package com.jellydiary.profile.service.result;

import com.jellydiary.profile.type.StoreCategory;

/** 09 그리드 한 칸. locked 는 "구독이 필요해서 못 쓴다"는 뜻이고, selected 는 지금 적용 중이라는 뜻이다. */
public record StoreItemResult(
        String code,
        StoreCategory category,
        String name,
        String description,
        boolean plusOnly,
        boolean locked,
        boolean selected) {}
