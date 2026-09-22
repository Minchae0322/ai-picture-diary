package com.jellydiary.badge.domain;

import com.jellydiary.badge.type.BadgeCriteria;
import com.jellydiary.badge.type.BadgeMetric;
import com.jellydiary.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * 뱃지 정의(마스터). 시안이 말한 40종을 채우려면 코드 배포 없이 늘릴 수 있어야 해서 테이블로 둔다.
 *
 * <p>나뉜 지점: <b>이름·조건 문구·임계값·정렬·노출은 데이터, 무엇을 재는지(BadgeMetric)는 코드.</b>
 * 그래서 "맑음 20회" 같은 뱃지는 INSERT 한 줄로 늘고, 새로운 종류의 지표는 코드가 먼저 생겨야 한다.
 */
@Getter
@Entity
@Table(name = "tb_badge")
@SQLDelete(sql = "UPDATE tb_badge SET deleted_at = now() WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Badge extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_badge")
    @SequenceGenerator(name = "seq_badge", sequenceName = "seq_badge", allocationSize = 50)
    private Long id;

    /** tb_user_badge.badge_code 가 가리키는 값. 저장된 뒤에는 바꾸지 않는다. */
    @Column(nullable = false, length = 40)
    private String code;

    @Column(nullable = false, length = 40)
    private String name;

    /** 07 화면에 그대로 보이는 문구. 앱 배포 없이 고치기 위해 데이터다. */
    @Column(nullable = false, length = 60)
    private String conditionText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private BadgeMetric metric;

    @Column(nullable = false)
    private int threshold;

    @Column(nullable = false)
    private int sortOrder;

    private Badge(String code, String name, String conditionText, BadgeMetric metric, int threshold, int sortOrder) {
        this.code = code;
        this.name = name;
        this.conditionText = conditionText;
        this.metric = metric;
        this.threshold = threshold;
        this.sortOrder = sortOrder;
    }

    /**
     * 운영 데이터는 sql/patch 의 INSERT 로 들어온다. 이 팩터리는 그 행을 자바에서 만들어야 할 때
     * (테스트, 나중의 관리 화면) 쓰는 유일한 생성 경로다.
     */
    public static Badge define(
            String code, String name, String conditionText, BadgeMetric metric, int threshold, int sortOrder) {
        if (threshold < 1) {
            throw new IllegalArgumentException("임계값은 1 이상이어야 한다: " + code);
        }
        return new Badge(code, name, conditionText, metric, threshold, sortOrder);
    }

    public boolean isEarnedBy(BadgeCriteria criteria) {
        return criteria.valueOf(metric) >= threshold;
    }
}
