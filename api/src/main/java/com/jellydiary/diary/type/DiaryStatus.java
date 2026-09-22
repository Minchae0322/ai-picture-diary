package com.jellydiary.diary.type;

public enum DiaryStatus {
    /** AI가 그리는 중. 화면 03 */
    GENERATING,
    /** 감정 분석 완료. 그림은 없을 수도 있다(imageUrl null) */
    DONE,
    /** 분석까지 실패. 사용자에게 다시 시도를 요청한다 */
    FAILED
}
