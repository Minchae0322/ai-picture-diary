package com.jellydiary.common.util;

import java.util.List;
import java.util.random.RandomGenerator;

/**
 * 가입 시 기본 닉네임. "젤리" 하나를 모두에게 주면 08 커뮤니티 피드가 같은 이름으로 가득 찬다.
 *
 * <p>단어 목록은 설정이 아니라 여기 둔다 - 제품의 어휘이지 운영이 조절하는 수치가 아니다.
 * 중복을 막지 않는다(닉네임에 unique 제약이 없다). 겹쳐도 되는 별명이고, 사용자가 바꿀 수 있다.
 */
public final class NicknameGenerator {

    private static final List<String> ADJECTIVES =
            List.of("말랑한", "포근한", "반짝이는", "졸린", "달콤한", "느긋한", "상냥한", "조용한", "씩씩한", "몽글한");

    private static final List<String> NOUNS =
            List.of("젤리곰", "별사탕", "구름이", "새싹", "복숭아", "해바라기", "밤하늘", "민트소다", "라벤더", "무지개");

    private NicknameGenerator() {}

    /** 형용사 + 명사. 가장 긴 조합도 NicknameGeneratorTest 가 컬럼 길이 안에 있음을 보장한다. */
    public static String generate(RandomGenerator random) {
        return pick(ADJECTIVES, random) + " " + pick(NOUNS, random);
    }

    /** 경계 테스트용. 이 값보다 긴 닉네임은 절대 나오지 않는다. */
    public static int longestLength() {
        return longest(ADJECTIVES) + 1 + longest(NOUNS);
    }

    private static String pick(List<String> words, RandomGenerator random) {
        return words.get(random.nextInt(words.size()));
    }

    private static int longest(List<String> words) {
        return words.stream().mapToInt(String::length).max().orElseThrow();
    }
}
