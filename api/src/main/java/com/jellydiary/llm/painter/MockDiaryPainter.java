package com.jellydiary.llm.painter;

import com.jellydiary.common.logging.AppLog;
import com.jellydiary.diary.config.DiaryProperties;
import com.jellydiary.diary.type.DiaryPolicy;
import com.jellydiary.diary.type.Emotion;
import com.jellydiary.llm.config.LlmProperties;
import java.time.Duration;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 실제 모델을 붙이기 전의 대역. 키워드로 감정을 고르고 감정이 점수와 코멘트를 결정한다.
 *
 * <p>ponytail: 규칙 기반 대역이다. 실모델은 llm-integration 절차대로 이 폴더(diary/port/llm)에 구현체를 더하고 app.llm.provider 로
 * 갈아끼운다. 이 클래스는 그때도 오프라인·테스트용으로 남는다.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.llm.provider", havingValue = "mock", matchIfMissing = true)
public class MockDiaryPainter implements DiaryPainter {

    /** 먼저 걸리는 규칙이 이긴다. 순서가 곧 우선순위다. */
    /**
     * 먼저 걸리는 규칙이 이긴다. 순서가 곧 우선순위다.
     *
     * <p>키워드는 너무 짧게 잡지 않는다 - "화" 한 글자는 영화·화요일에도 걸린다.
     */
    private static final List<Rule> RULES =
            List.of(
                    new Rule(Emotion.ENERGETIC, 3, List.of("최고", "완벽", "대박", "꿈같", "벅차", "신나", "들뜨")),
                    new Rule(Emotion.HAPPY, 2, List.of("합격", "기쁘", "좋았", "행복", "즐거", "성공", "잘 끝", "맛있", "칭찬")),
                    new Rule(Emotion.SHY, 2, List.of("설레", "두근", "부끄", "고백", "떨리", "사랑")),
                    new Rule(Emotion.DEPRESSED, -3, List.of("우울", "무기력", "의미없", "캄캄", "바닥")),
                    new Rule(Emotion.ANGRY, -2, List.of("화가", "화났", "짜증", "억울", "분하", "열받")),
                    new Rule(Emotion.SAD, -2, List.of("슬프", "울었", "눈물", "속상", "외로", "아프")),
                    new Rule(Emotion.EMBARRASSED, -1, List.of("황당", "당황", "어이", "민망", "실수", "난감")),
                    new Rule(Emotion.TIRED, -1, List.of("피곤", "지쳤", "힘들", "바쁘", "정신없", "졸려")),
                    new Rule(Emotion.SOSO, 1, List.of("보통", "무난", "그냥")));

    private static final Rule DEFAULT_RULE = new Rule(Emotion.SOSO, 1, List.of());

    private final Duration delay;
    private final DiaryPolicy policy;

    public MockDiaryPainter(LlmProperties llm, DiaryProperties diary) {
        this.delay = llm.mockDelay();
        this.policy = diary.policy();
    }

    @Override
    public DiaryPainting paint(String content, Emotion userHint) {
        long startedAt = System.nanoTime();
        sleep();

        Rule rule = match(content, userHint);
        // 대역의 점수표가 설정 범위를 벗어나지 않게 자른다
        int score = Math.clamp(rule.score(), policy.moodMin(), policy.moodMax());
        DiaryPainting painting =
                new DiaryPainting(rule.emotion(), score, comment(rule.emotion()), imageUrl(rule.emotion(), content));

        // 본문은 남기지 않는다. 길이만(logging-observability 6장)
        AppLog.event(log, "ai.call.done")
                .with("provider", "mock")
                .with("emotion", painting.emotion())
                .with("moodScore", painting.moodScore())
                .with("contentLength", content.length())
                .with("durationMs", (System.nanoTime() - startedAt) / 1_000_000)
                .info("ai call done");

        return painting;
    }

    private Rule match(String content, Emotion userHint) {
        return RULES.stream()
                .filter(rule -> rule.matches(content))
                .findFirst()
                .orElseGet(() -> hintRule(userHint));
    }

    private Rule hintRule(Emotion userHint) {
        if (userHint == null) {
            return DEFAULT_RULE;
        }
        return RULES.stream()
                .filter(rule -> rule.emotion() == userHint)
                .findFirst()
                .orElse(DEFAULT_RULE);
    }

    private String comment(Emotion emotion) {
        return switch (emotion) {
            case ENERGETIC -> "AI 코멘트 · 말끝에 힘이 실려 있어요. 오래 기억될 하루네요.";
            case HAPPY -> "AI 코멘트 · 성취감이 느껴지는 하루였네요.";
            case SHY -> "AI 코멘트 · 마음이 간질간질한 하루였네요.";
            case SOSO -> "AI 코멘트 · 무난하게 지나간 하루예요.";
            case EMBARRASSED -> "AI 코멘트 · 예상 못 한 일이 있었군요. 지나고 나면 이야깃거리가 돼요.";
            case TIRED -> "AI 코멘트 · 오늘은 푹 쉬어도 되는 날이에요.";
            case SAD -> "AI 코멘트 · 힘든 하루였어요. 그래도 적어 두셨네요.";
            case DEPRESSED -> "AI 코멘트 · 가라앉는 날도 있어요. 내일까지 끌고 가지 않아도 됩니다.";
            case ANGRY -> "AI 코멘트 · 참기만 하지 않아도 돼요. 적어 둔 것만으로 조금 가벼워져요.";
        };
    }

    /** 대역용 더미 이미지. 실제 구현은 생성한 그림을 스토리지에 올리고 그 URL을 준다(file-upload-storage). */
    private String imageUrl(Emotion emotion, String content) {
        return "https://picsum.photos/seed/" + emotion.name().toLowerCase() + content.length() + "/600/600";
    }

    private void sleep() {
        try {
            Thread.sleep(delay.toMillis());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /** 키워드 -> 감정 -> 점수. 셋이 항상 같이 다녀서 한 덩어리로 둔다. */
    private record Rule(Emotion emotion, int score, List<String> keywords) {

        boolean matches(String content) {
            return keywords.stream().anyMatch(content::contains);
        }
    }
}
