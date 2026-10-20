package com.example.app.ai;

import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.nio.file.Path;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 프롬프트 회귀 평가.
 *
 * - @Tag("eval")로 일반 테스트에서 분리한다. 실제 API를 호출하므로 비용과 시간이 든다.
 *   build.gradle:
 *     test        { useJUnitPlatform { excludeTags 'eval' } }
 *     evalTest    { useJUnitPlatform { includeTags 'eval' } }
 * - 평가용 API 키(LLM_API_KEY_EVAL)를 쓴다. 운영 키를 CI에 넣지 않는다.
 * - 필수 케이스(must_pass)만 assert하고 나머지는 통과율로 집계한다.
 *   비필수 하나로 빌드가 깨지면 아무도 안 돌린다.
 */
@Tag("eval")
@SpringBootTest
class PromptEvalTest {

    private static final String FEATURE = "summarize";

    @Autowired
    ArticleSummarizer summarizer;   // 평가 대상. raw 응답을 반환하는 메서드를 노출해 둔다

    static Stream<EvalCase> cases() {
        return EvalSetLoader.load("eval/" + FEATURE + ".jsonl").stream();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("cases")
    void 평가(EvalCase testCase) {
        SummaryResponse actual = summarizer.raw(testCase.input().get("body"));

        EvalResult result = Grader.grade(testCase, actual);
        EvalReport.record(result);

        if (testCase.mustPass()) {
            assertThat(result.passed())
                    .as("필수 케이스 실패: %s%n사유: %s%n메모: %s",
                            testCase.id(), result.failures(), testCase.note())
                    .isTrue();
        }
    }

    @AfterAll
    static void writeReport() {
        EvalReport.writeMarkdown(Path.of("build/eval/" + FEATURE + ".md"));
        // CI에서 이 파일을 아티팩트로 올려 PR에서 확인한다
    }
}
