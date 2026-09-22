package com.jellydiary.llm.painter;

import com.jellydiary.diary.type.Weather;

/**
 * 한 줄 기록을 감정 날씨와 그림으로 바꾸는 포트. 구현은 같은 폴더(MockDiaryPainter, 나중에 실모델).
 *
 * <p>일기 도메인은 이 인터페이스만 보고 LLM 타입은 모른다(llm-integration 1장).
 * 인터페이스와 구현이 모두 llm 컨텍스트에 있으므로, 이 계약이 모델 사정에 끌려다니지 않게 하는 것은
 * 리뷰의 몫이다 - 여기 들어와도 되는 것은 <b>도메인 어휘</b>(Weather, 점수, 코멘트, 그림 URL)뿐이다.
 */
public interface DiaryPainter {

    DiaryPainting paint(String content, Weather userHint);
}
