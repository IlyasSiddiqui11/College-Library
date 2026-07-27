package com.example.library.service;

import lombok.RequiredArgsConstructor;


import com.example.library.dto.request.GateScanRequest;
import com.example.library.dto.response.GateLogResponse;
import com.example.library.dto.response.GateStatusResponse;
import com.example.library.entity.GateLog;
import com.example.library.entity.StudentProfile;
import com.example.library.entity.User;
import com.example.library.exception.BadRequestException;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.GateLogRepository;
import com.example.library.repository.StudentProfileRepository;
import com.example.library.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GateLogService {

    private final GateLogRepository gateLogRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;

    @Transactional
    public GateLogResponse scanGate(GateScanRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));

        // Check if there is an active session (checked in, but not checked out)
        Optional<GateLog> activeLogOpt = gateLogRepository
                .findTopByUserIdAndExitTimeIsNullOrderByEntryTimeDesc(user.getId());

        if (activeLogOpt.isPresent()) {
            throw new BadRequestException("You are already inside the library. Please exit before entering again.");
        } else {
            // Student is checking in
            GateLog gateLog = GateLog.builder()
                    .user(user)
                    .entryTime(LocalDateTime.now())
                    .build();
            GateLog savedLog = gateLogRepository.save(gateLog);
            return mapToGateLogResponse(savedLog);
        }
    }

    @Transactional
    public GateLogResponse exitLibrary(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        GateLog activeLog = gateLogRepository
                .findTopByUserIdAndExitTimeIsNullOrderByEntryTimeDesc(user.getId())
                .orElseThrow(() -> new BadRequestException("No active library session found. You are not currently inside the library."));

        activeLog.setExitTime(LocalDateTime.now());
        GateLog savedLog = gateLogRepository.save(activeLog);
        return mapToGateLogResponse(savedLog);
    }

    @Transactional(readOnly = true)
    public GateStatusResponse getStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        Optional<GateLog> activeLogOpt = gateLogRepository
                .findTopByUserIdAndExitTimeIsNullOrderByEntryTimeDesc(user.getId());

        if (activeLogOpt.isPresent()) {
            GateLog activeLog = activeLogOpt.get();
            return GateStatusResponse.builder()
                    .userId(user.getId())
                    .userName(user.getName())
                    .insideLibrary(true)
                    .entryTime(activeLog.getEntryTime())
                    .activeLogId(activeLog.getId())
                    .build();
        } else {
            return GateStatusResponse.builder()
                    .userId(user.getId())
                    .userName(user.getName())
                    .insideLibrary(false)
                    .build();
        }
    }

    @Transactional(readOnly = true)
    public List<GateLogResponse> getAllLogs() {
        return gateLogRepository.findAllByOrderByEntryTimeDesc().stream()
                .map(this::mapToGateLogResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GateLogResponse> getLogsByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }
        return gateLogRepository.findByUserId(userId).stream()
                .map(this::mapToGateLogResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GateLogResponse> getLogsByMonth(int year, int month) {
        java.time.LocalDateTime start = java.time.LocalDateTime.of(year, month, 1, 0, 0);
        java.time.LocalDateTime end = start.plusMonths(1).minusNanos(1);
        return gateLogRepository.findAllByEntryTimeBetweenOrderByEntryTimeDesc(start, end).stream()
                .map(this::mapToGateLogResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public com.example.library.dto.response.MonthlyGateStatsResponse getMonthlyStats(int year, int month) {
        java.time.LocalDateTime start = java.time.LocalDateTime.of(year, month, 1, 0, 0);
        java.time.LocalDateTime end = start.plusMonths(1).minusNanos(1);
        List<GateLog> logs = gateLogRepository.findAllByEntryTimeBetweenOrderByEntryTimeDesc(start, end);
        
        long totalEntries = logs.size();
        long totalExits = logs.stream().filter(l -> l.getExitTime() != null).count();
        long studentsInside = gateLogRepository.countByExitTimeIsNull();
        
        int daysInMonth = java.time.YearMonth.of(year, month).lengthOfMonth();
        long averageDaily = totalEntries / daysInMonth;
        
        return com.example.library.dto.response.MonthlyGateStatsResponse.builder()
                .totalEntries(totalEntries)
                .totalExits(totalExits)
                .studentsCurrentlyInside(studentsInside)
                .averageDailyVisitors(averageDaily)
                .totalGateLogs(totalEntries) // Assuming total logs = total entries
                .build();
    }

    private GateLogResponse mapToGateLogResponse(GateLog log) {
        User user = log.getUser();
        String userEmail = user.getEmail();
        String branch = null;
        Integer year = null;

        Optional<StudentProfile> profileOpt = studentProfileRepository.findByUserId(user.getId());
        if (profileOpt.isPresent()) {
            branch = profileOpt.get().getBranch();
            year = profileOpt.get().getYear();
        }

        return GateLogResponse.builder()
                .id(log.getId())
                .userId(user.getId())
                .userName(user.getName())
                .userEmail(userEmail)
                .branch(branch)
                .year(year)
                .entryTime(log.getEntryTime())
                .exitTime(log.getExitTime())
                .createdAt(log.getCreatedAt())
                .build();
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 16 * * *") // Runs every day at 4:00 PM
    @Transactional
    public void autoExitStudentsAt4PM() {
        List<GateLog> activeLogs = gateLogRepository.findAllByExitTimeIsNull();
        if (activeLogs.isEmpty()) {
            return;
        }
        LocalDateTime exitTime = LocalDateTime.now().withHour(16).withMinute(0).withSecond(0).withNano(0);
        for (GateLog log : activeLogs) {
            log.setExitTime(exitTime);
        }
        gateLogRepository.saveAll(activeLogs);
    }
}
