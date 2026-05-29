package com.example.library.service;

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
import lombok.RequiredArgsConstructor;
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
            // Student is checking out
            GateLog gateLog = activeLogOpt.get();
            gateLog.setExitTime(LocalDateTime.now());
            GateLog savedLog = gateLogRepository.save(gateLog);
            return mapToGateLogResponse(savedLog);
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
}
