package com.jellydiary.diary.infrastructure.ai;

import com.jellydiary.common.logging.AppLog;
import com.jellydiary.diary.config.DiaryProperties;
import com.jellydiary.diary.domain.DiaryPainter;
import com.jellydiary.diary.domain.DiaryPainting;
import com.jellydiary.diary.domain.DiaryPolicy;
import com.jellydiary.diary.domain.Weather;
import java.time.Duration;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 실제 모델을 붙이기 전의 대역. 키워드로 날씨를 고르고 날씨가 점수와 코멘트를 결정한다.
 *
 * <p>ponytail: 규칙 기반 대역이다. 실모델은 llm-integration 절차대로 별도 구현체로 추가하고 app.ai.provider 로
 * 갈아끼운다. 이 클래스는 그때도 오프라인·테스트용으로 남는다.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "mock", matchIfMissing = true)
public class MockDiaryPainter implements DiaryPainter {

    /** 먼저 걸리는 규칙이 이긴다. 순서가 곧 우선순위다. */
    private static final List<Rule> RULES =
            List.of(
                    new Rule(Weather.RAINBOW, 3, List.of("합격", "최고", "행복", "설레", "사랑")),
                    new Rule(Weather.SUNNY, 2, List.of("좋았", "성공", "즐거", "맛있", "칭찬", "잘 끝")),
                    new Rule(Weather.RAIN, -2, List.of("슬프", "힘들", "울었", "속상", "지쳤")),
                    new Rule(Weather.SNOW, -1, List.of("조용", "차분", "고요", "혼자")),
                    new Rule(Weather.CLOUDY, 0, List.of("피곤", "답답", "그냥", "무기력")),
                    new Rule(Weather.PARTLY_CLOUDY, 1, List.of("바쁘", "보통", "무난")));

    private static final Rule DEFAULT_RULE = new Rule(Weather.PARTLY_CLOUDY, 1, List.of());

    private final Duration delay;
    private final DiaryPolicy policy;

    public MockDiaryPainter(DiaryProperties properties) {
        this.delay = properties.ai().mockDelay();
        this.policy = properties.policy();
    }

    @Override
    public DiaryPainting paint(String content, Weather userHint) {
        long startedAt = System.nanoTime();
        sleep();

        Rule rule = match(content, userHint);
        // 대역의 점수표가 설정 범위를 벗어나지 않게 자른다
        int score = Math.clamp(rule.score(), policy.moodMin(), policy.moodMax());
        DiaryPainting painting =
                new DiaryPainting(rule.weather(), score, comment(rule.weather()), imageUrl(rule.weather(), content));

        // 본문은 남기지 않는다. 길이만(logging-observability 6장)
        AppLog.event(log, "ai.call.done")
                .with("provider", "mock")
                .with("weather", painting.weather())
                .with("moodScore", painting.moodScore())
                .with("contentLength", content.length())
                .with("durationMs", (System.nanoTime() - startedAt) / 1_000_000)
                .info("ai call done");

        return painting;
    }

    private Rule match(String content, Weather userHint) {
        return RULES.stream()
                .filter(rule -> rule.matches(content))
                .findFirst()
                .orElseGet(() -> hintRule(userHint));
    }

    private Rule hintRule(Weather userHint) {
        if (userHint == null) {
            return DEFAULT_RULE;
        }
        return RULES.stream()
                .filter(rule -> rule.weather() == userHint)
                .findFirst()
                .orElse(DEFAULT_RULE);
    }

    private String comment(Weather weather) {
        return switch (weather) {
            case RAINBOW -> "AI 코멘트 · 오늘 같은 날은 오래 기억에 남아요.";
            case SUNNY -> "AI 코멘트 · 성취감이 느껴지는 하루였네요.";
            case PARTLY_CLOUDY -> "AI 코멘트 · 무난하게 지나간 하루예요.";
            case CLOUDY -> "AI 코멘트 · 조금 무거운 하루였던 것 같아요.";
            case SNOW -> "AI 코멘트 · 조용히 나를 돌본 하루네요.";
            case RAIN -> "AI 코멘트 · 힘든 하루였어요. 오늘은 푹 쉬어요.";
        };
    }

    /** 대역용 더미 이미지. 실제 구현은 생성한 그림을 스토리지에 올리고 그 URL을 준다(file-upload-storage). */
    private String imageUrl(Weather weather, String content) {
        return "https://picsum.photos/seed/" + weather.name().toLowerCase() + content.length() + "/600/600";
    }

    private void sleep() {
        try {
            Thread.sleep(delay.toMillis());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /** 키워드 -> 날씨 -> 점수. 셋이 항상 같이 다녀서 한 덩어리로 둔다. */
    private record Rule(Weather weather, int score, List<String> keywords) {

        boolean matches(String content) {
            return keywords.stream().anyMatch(content::contains);
        }
    }
}
