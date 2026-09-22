package com.jellydiary.community.type;

/** 신고 사유. UGC 배포에 신고 동선은 선택이 아니다(app-store-release). */
public enum ReportReason {
    ABUSE,
    SPAM,
    SEXUAL,
    PRIVACY,
    OTHER
}
