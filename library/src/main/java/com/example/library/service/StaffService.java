package com.example.library.service;

import com.example.library.dto.request.StaffVerificationRequestDto;
import com.example.library.dto.request.StaffApprovalRequest;
import com.example.library.entity.StaffProfile;
import com.example.library.entity.User;
import com.example.library.enums.Role;
import com.example.library.enums.StaffStatus;
import com.example.library.exception.BadRequestException;
import com.example.library.repository.StaffProfileRepository;
import com.example.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffProfileRepository staffProfileRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void submitVerificationRequest(StaffVerificationRequestDto request) {
        if (staffProfileRepository.existsByEmployeeId(request.getEmployeeId())) {
            throw new BadRequestException("A request with this Employee ID already exists.");
        }
        if (staffProfileRepository.existsByCollegeEmail(request.getCollegeEmail())) {
            throw new BadRequestException("A request with this College Email already exists.");
        }
        if (userRepository.existsByEmail(request.getCollegeEmail())) {
            throw new BadRequestException("A user with this email already exists.");
        }

        StaffProfile profile = StaffProfile.builder()
                .fullName(request.getFullName())
                .employeeId(request.getEmployeeId())
                .collegeEmail(request.getCollegeEmail())
                .mobileNumber(request.getMobileNumber())
                .department(request.getDepartment())
                .designation(request.getDesignation())
                .employmentType(request.getEmploymentType())
                .status(StaffStatus.PENDING)
                .profileCompleted(false)
                .build();

        staffProfileRepository.save(profile);

        // Send Email
        String subject = "Staff Verification Request Received - College Library";
        String body = String.format("Dear %s,\n\nWe have received your request for Staff Access to the College Library System.\n\nYour request is currently pending Admin approval. You will receive another email once your request is processed.\n\nBest Regards,\nCollege Library", profile.getFullName());
        emailService.sendEmail(profile.getCollegeEmail(), subject, body);
    }

    @Transactional(readOnly = true)
    public List<StaffProfile> getAllRequests() {
        return staffProfileRepository.findAll();
    }

    @Transactional
    public void approveRequest(Long id, StaffApprovalRequest request, String adminName) {
        StaffProfile profile = staffProfileRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Staff request not found"));

        if (profile.getStatus() != StaffStatus.PENDING) {
            throw new BadRequestException("Request is already processed.");
        }

        String rawPassword = UUID.randomUUID().toString().substring(0, 8);
        
        User user = User.builder()
                .name(profile.getFullName())
                .email(profile.getCollegeEmail())
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.STAFF)
                .isVerified(true)
                .build();

        User savedUser = userRepository.save(user);

        profile.setUser(savedUser);
        profile.setStatus(StaffStatus.APPROVED);
        profile.setRemarks(request != null ? request.getRemarks() : null);
        profile.setApprovedBy(adminName);
        profile.setApprovalDate(LocalDateTime.now());
        staffProfileRepository.save(profile);

        // Send Email
        String subject = "Staff Verification Approved - College Library";
        String body = String.format("Dear %s,\n\nYour staff verification request has been approved.\n\nYour login credentials are:\nEmail: %s\nPassword: %s\n\nPlease log in and change your password.", profile.getFullName(), profile.getCollegeEmail(), rawPassword);
        emailService.sendEmail(profile.getCollegeEmail(), subject, body);
    }

    @Transactional
    public void rejectRequest(Long id, StaffApprovalRequest request) {
        StaffProfile profile = staffProfileRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Staff request not found"));

        if (profile.getStatus() != StaffStatus.PENDING) {
            throw new BadRequestException("Request is already processed.");
        }

        profile.setStatus(StaffStatus.REJECTED);
        profile.setRemarks(request != null ? request.getRemarks() : null);
        staffProfileRepository.save(profile);

        // Send Email
        String subject = "Staff Verification Rejected - College Library";
        String remarksStr = request != null && request.getRemarks() != null ? request.getRemarks() : "No specific reason provided.";
        String body = String.format("Dear %s,\n\nWe regret to inform you that your staff verification request has been rejected.\n\nReason/Remarks: %s\n\nPlease contact the library administrator for further assistance.", profile.getFullName(), remarksStr);
        emailService.sendEmail(profile.getCollegeEmail(), subject, body);
    }

    @Transactional
    public void markInactive(Long id, StaffApprovalRequest request) {
        StaffProfile profile = staffProfileRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Staff request not found"));

        if (profile.getStatus() != StaffStatus.APPROVED) {
            throw new BadRequestException("Only approved staff can be marked inactive.");
        }

        profile.setStatus(StaffStatus.INACTIVE);
        profile.setRemarks(request != null ? request.getRemarks() : null);
        staffProfileRepository.save(profile);
    }
    
    public StaffProfile getStaffProfileByUserId(Long userId) {
        return staffProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Staff profile not found for user"));
    }

    @Transactional
    public void completeProfile(Long userId) {
        StaffProfile profile = getStaffProfileByUserId(userId);
        if (profile.isProfileCompleted()) {
            throw new BadRequestException("Profile is already completed.");
        }
        profile.setProfileCompleted(true);
        staffProfileRepository.save(profile);
    }
}
