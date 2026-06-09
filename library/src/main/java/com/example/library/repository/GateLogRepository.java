package com.example.library.repository;

import com.example.library.entity.GateLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GateLogRepository extends JpaRepository<GateLog, Long> {
    List<GateLog> findAllByOrderByEntryTimeDesc();
    List<GateLog> findByUserId(Long userId);
    Optional<GateLog> findTopByUserIdAndExitTimeIsNullOrderByEntryTimeDesc(Long userId);
    List<GateLog> findAllByExitTimeIsNull();
}
