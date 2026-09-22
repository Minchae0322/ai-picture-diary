package com.jellydiary.badge.repository;

import com.jellydiary.badge.domain.Badge;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BadgeRepository extends JpaRepository<Badge, Long> {

    /** 07 그리드 순서 = 이 정렬. 화면이 정렬을 따로 정하지 않는다. */
    List<Badge> findAllByOrderBySortOrderAsc();
}
