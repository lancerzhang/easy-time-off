package com.easytimeoff.repository;

import com.easytimeoff.domain.ViewHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ViewHistoryRepository extends JpaRepository<ViewHistory, String> {
    List<ViewHistory> findTop10ByUserIdOrderByTimestampDesc(String userId);
    List<ViewHistory> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);
    Optional<ViewHistory> findByUserIdAndItemIdAndType(String userId, String itemId, ViewHistory.ViewType type);
}
