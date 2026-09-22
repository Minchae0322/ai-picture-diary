package com.jellydiary.common.util;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 06 "자주 쓴 말". 형태소 분석기 없이 공백으로 자르고 흔한 조사만 떼어 낸다.
 *
 * <p>ponytail: 순진한 토크나이저다. 복합어와 활용형을 못 잡는다. 품질이 문제가 되면 형태소 분석기(은전한닢)나
 * LLM 추출로 올린다 - 그때 이 클래스만 갈아 끼우면 된다(06 화면 문서 7장).
 */
public final class WordCounter {

    private static final int MIN_LENGTH = 2;

    /** 조사를 뗀 뒤에도 뜻이 남는 길이일 때만 뗀다. */
    private static final List<String> PARTICLES =
            List.of("에서", "으로", "에게", "까지", "부터", "은", "는", "이", "가", "을", "를", "의", "에", "도", "로", "와", "과", "만");

    private static final Set<String> STOPWORDS =
            Set.of(
                    "오늘", "어제", "내일", "그리고", "하지만", "그래서", "그냥", "정말", "너무", "조금", "다시", "계속", "진짜",
                    "우리", "내가", "나는", "것을", "거의", "아주", "역시", "이제", "아직", "제일", "같이", "하루");

    private WordCounter() {}

    public static List<WordCount> top(Collection<String> contents, int limit) {
        Map<String, Integer> counts = new HashMap<>();
        for (String content : contents) {
            for (String token : content.split("[^\p{IsAlphabetic}\p{IsDigit}]+")) {
                normalize(token).ifPresent(word -> counts.merge(word, 1, Integer::sum));
            }
        }

        return counts.entrySet().stream()
                .map(entry -> new WordCount(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparingInt(WordCount::count).reversed().thenComparing(WordCount::word))
                .limit(limit)
                .toList();
    }

    private static java.util.Optional<String> normalize(String token) {
        String word = stripParticle(token.strip());
        boolean usable = word.length() >= MIN_LENGTH && !STOPWORDS.contains(word);
        return usable ? java.util.Optional.of(word) : java.util.Optional.empty();
    }

    private static String stripParticle(String token) {
        return PARTICLES.stream()
                .filter(particle -> token.endsWith(particle))
                .filter(particle -> token.length() - particle.length() >= MIN_LENGTH)
                .findFirst()
                .map(particle -> token.substring(0, token.length() - particle.length()))
                .orElse(token);
    }

    public record WordCount(String word, int count) {}
}
