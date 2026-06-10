package com.example.library.controller;

import lombok.RequiredArgsConstructor;


import com.example.library.dto.request.ProfileCompleteRequest;
import com.example.library.dto.response.ProfileResponse;
import com.example.library.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @PostMapping("/complete")
    public ResponseEntity<ProfileResponse> completeProfile(@Valid @RequestBody ProfileCompleteRequest request) {
        ProfileResponse response = profileService.completeProfile(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ProfileResponse> getProfile(@PathVariable Long userId) {
        ProfileResponse response = profileService.getProfileByUserId(userId);
        return ResponseEntity.ok(response);
    }
}
