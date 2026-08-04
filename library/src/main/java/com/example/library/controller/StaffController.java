package com.example.library.controller;

import com.example.library.dto.request.StaffVerificationRequestDto;
import com.example.library.dto.request.StaffApprovalRequest;
import com.example.library.entity.StaffProfile;
import com.example.library.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    @PostMapping("/request-access")
    public ResponseEntity<String> submitVerificationRequest(@Valid @RequestBody StaffVerificationRequestDto request) {
        staffService.submitVerificationRequest(request);
        return new ResponseEntity<>("Your staff verification request has been submitted successfully. Please wait for Admin approval before logging in.", HttpStatus.CREATED);
    }

    @GetMapping("/requests")
    public ResponseEntity<List<StaffProfile>> getAllRequests() {
        return ResponseEntity.ok(staffService.getAllRequests());
    }

    @PostMapping("/approve/{id}")
    public ResponseEntity<String> approveRequest(@PathVariable Long id, @RequestBody(required = false) StaffApprovalRequest request, @RequestParam String adminName) {
        staffService.approveRequest(id, request, adminName);
        return ResponseEntity.ok("Staff request approved successfully. Credentials have been emailed.");
    }

    @PostMapping("/reject/{id}")
    public ResponseEntity<String> rejectRequest(@PathVariable Long id, @RequestBody(required = false) StaffApprovalRequest request) {
        staffService.rejectRequest(id, request);
        return ResponseEntity.ok("Staff request rejected successfully.");
    }

    @PostMapping("/inactive/{id}")
    public ResponseEntity<String> markInactive(@PathVariable Long id, @RequestBody(required = false) StaffApprovalRequest request) {
        staffService.markInactive(id, request);
        return ResponseEntity.ok("Staff marked inactive successfully.");
    }
    
    @PostMapping("/profile/complete/{userId}")
    public ResponseEntity<String> completeProfile(@PathVariable Long userId) {
        staffService.completeProfile(userId);
        return ResponseEntity.ok("Profile completed successfully.");
    }
    
    @GetMapping("/profile/user/{userId}")
    public ResponseEntity<StaffProfile> getStaffProfileByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(staffService.getStaffProfileByUserId(userId));
    }
}
