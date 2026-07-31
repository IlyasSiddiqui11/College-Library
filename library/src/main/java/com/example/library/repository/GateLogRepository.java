package com.example.library.repository;

import com.example.library.entity.GateLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GateLogRepository extends JpaRepository<GateLog, Long> {
    List<GateLog> findAllByOrderByEntryTimeDesc();
    List<GateLog> findByUserId(Long userId);
    Optional<GateLog> findTopByUserIdAndExitTimeIsNullOrderByEntryTimeDesc(Long userId);
    List<GateLog> findAllByExitTimeIsNull();
    List<GateLog> findAllByEntryTimeBetweenOrderByEntryTimeDesc(java.time.LocalDateTime start, java.time.LocalDateTime end);
    long countByExitTimeIsNull();

    // Returns distinct [year, month] pairs that have gate log records
    @Query("SELECT DISTINCT YEAR(g.entryTime), MONTH(g.entryTime) FROM GateLog g ORDER BY YEAR(g.entryTime) DESC, MONTH(g.entryTime) DESC")
    List<int[]> findDistinctYearMonths();
}
