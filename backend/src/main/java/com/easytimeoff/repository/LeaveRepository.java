package com.easytimeoff.repository;

import com.easytimeoff.domain.LeaveRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRepository extends JpaRepository<LeaveRecord, String> {

    List<LeaveRecord> findByUserId(String userId);

    // Find leaves overlapping with a date range (for conflict checking)
    @Query("SELECT l FROM LeaveRecord l WHERE l.userId = :userId AND " +
           "(l.startDate <= :endDate AND l.endDate >= :startDate)")
    List<LeaveRecord> findOverlappingLeaves(String userId, LocalDate startDate, LocalDate endDate);
    
    // Find leaves for a list of users (Team View)
    List<LeaveRecord> findByUserIdIn(List<String> userIds);

    @Query("SELECT l FROM LeaveRecord l WHERE l.userId IN :userIds " +
           "AND (:startDate IS NULL OR l.endDate >= :startDate) " +
           "AND (:endDate IS NULL OR l.startDate <= :endDate)")
    Page<LeaveRecord> findByUserIdInAndDateRange(
            @Param("userIds") List<String> userIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );
}
