package com.jellydiary.common;

import static org.assertj.core.api.Assertions.assertThat;

import com.jellydiary.common.util.WordCounter;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** 06 "자주 쓴 말". 순진한 토크나이저라 무엇까지 맞는지를 테스트가 못 박아 둔다. */
class WordCounterTest {

    @Test
    @DisplayName("많이 나온 순으로 자른다")
    void ordersByFrequency() {
        List<WordCounter.WordCount> words =
                WordCounter.top(List.of("회의 회의 산책", "회의 산책", "피곤"), 2);

        assertThat(words).extracting(WordCounter.WordCount::word).containsExactly("회의", "산책");
        assertThat(words.getFirst().count()).isEqualTo(3);
    }

    @Test
    @DisplayName("조사를 떼고 같은 말로 센다")
    void stripsParticles() {
        List<WordCounter.WordCount> words = WordCounter.top(List.of("산책을 했다", "산책이 좋다", "산책"), 1);

        assertThat(words.getFirst()).isEqualTo(new WordCounter.WordCount("산책", 3));
    }

    @Test
    @DisplayName("한 글자와 불용어는 버린다")
    void dropsNoise() {
        List<WordCounter.WordCount> words = WordCounter.top(List.of("오늘 는 정말 너무 산책"), 5);

        assertThat(words).extracting(WordCounter.WordCount::word).containsExactly("산책");
    }

    @Test
    @DisplayName("조사를 떼면 한 글자가 되는 말은 그대로 둔다")
    void keepsShortStems() {
        List<WordCounter.WordCount> words = WordCounter.top(List.of("비가 비가"), 1);

        assertThat(words.getFirst().word()).isEqualTo("비가");
    }

    @Test
    @DisplayName("기록이 없으면 빈 목록")
    void emptyWithoutContents() {
        assertThat(WordCounter.top(List.of(), 4)).isEmpty();
    }
}
