package com.jellydiary.diary;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jellydiary.common.config.JpaConfig;
import com.jellydiary.diary.domain.Diary;
import com.jellydiary.diary.domain.DiaryPolicy;
import com.jellydiary.diary.repository.DiaryRepository;
import com.jellydiary.diary.domain.Weather;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Limit;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.jdbc.Sql;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * 쿼리는 실제 DB로 확인한다. H2는 기본 선택지가 아니다(test-writing-guide).
 *
 * <p>스키마는 운영에 나갈 sql/patch 파일을 그대로 올린다 - 앱 매핑과 DB 제약이 어긋나면 여기서 잡힌다.
 */
@Tag("integration")
@Testcontainers
@DataJpaTest
@Import(JpaConfig.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=none")
@Sql(
        scripts = "file:../sql/patch/2026-09-21-diary-테이블-추가.sql",
        executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
class DiaryRepositoryTest {

    private static final Long USER = 1L;
    private static final Long OTHER_USER = 2L;
    private static final DiaryPolicy POLICY = new DiaryPolicy(500, 3, -3, 3);

    @Container @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired DiaryRepository diaryRepository;

    @Test
    @DisplayName("커서보다 이전 날짜만 최신순으로, 요청한 수만큼 가져온다")
    void cursorPaging() {
        writeDays(1, 2, 3, 4, 5);

        List<Diary> page = olderThan(LocalDate.of(2026, 8, 4), 2);

        assertThat(page)
                .extracting(Diary::getEntryDate)
                .containsExactly(LocalDate.of(2026, 8, 3), LocalDate.of(2026, 8, 2));
    }

    @Test
    @DisplayName("커서가 가장 오래된 날짜면 빈 결과, 커서가 없으면 전부")
    void cursorBoundary() {
        writeDays(1);

        assertThat(olderThan(LocalDate.of(2026, 8, 1), 10)).isEmpty();
        assertThat(olderThan(LocalDate.MAX, 10)).hasSize(1);
    }

    @Test
    @DisplayName("하루 1건 - 같은 사용자·같은 날짜는 두 번 저장되지 않는다")
    void oneDiaryPerDay() {
        diaryRepository.saveAndFlush(diary(USER, 1, "첫 기록"));

        assertThatThrownBy(() -> diaryRepository.saveAndFlush(diary(USER, 1, "두 번째")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("다른 사용자의 기록은 섞이지 않는다")
    void isolatedByUser() {
        diaryRepository.save(diary(USER, 1, "내 것"));
        diaryRepository.save(diary(OTHER_USER, 1, "남의 것"));

        assertThat(olderThan(LocalDate.MAX, 10)).hasSize(1);
    }

    private void writeDays(int... days) {
        for (int day : days) {
            diaryRepository.save(diary(USER, day, "기록 " + day));
        }
    }

    private Diary diary(Long userId, int day, String content) {
        return Diary.write(userId, LocalDate.of(2026, 8, day), content, Weather.SUNNY, POLICY);
    }

    private List<Diary> olderThan(LocalDate cursor, int size) {
        return diaryRepository.findByUserIdAndEntryDateLessThanOrderByEntryDateDesc(
                USER, cursor, Limit.of(size));
    }
}
