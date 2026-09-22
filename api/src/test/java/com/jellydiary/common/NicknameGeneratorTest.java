package com.jellydiary.common;

import static org.assertj.core.api.Assertions.assertThat;

import com.jellydiary.common.util.NicknameGenerator;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** 순수 계산이라 경계가 전부다. 저장 가능한 길이인지는 쓰는 쪽(ProfileTest)이 본다. */
class NicknameGeneratorTest {

    @Test
    @DisplayName("형용사 + 명사 두 마디로 만든다")
    void hasTwoWords() {
        String nickname = NicknameGenerator.generate(new Random(1));

        assertThat(nickname).isNotBlank();
        assertThat(nickname.split(" ")).hasSize(2);
        assertThat(nickname.length()).isLessThanOrEqualTo(NicknameGenerator.longestLength());
    }

    @Test
    @DisplayName("모두에게 같은 이름을 주지 않는다 - 08 피드가 같은 닉네임으로 차는 것을 막는다")
    void producesVariety() {
        Random random = new Random(42);
        Set<String> generated = new HashSet<>();
        for (int i = 0; i < 50; i++) {
            generated.add(NicknameGenerator.generate(random));
        }

        assertThat(generated).hasSizeGreaterThan(10);
    }
}
