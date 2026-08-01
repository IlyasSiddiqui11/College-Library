package com.example.library.controller;

import lombok.RequiredArgsConstructor;


import com.example.library.dto.request.LoginRequest;
import com.example.library.dto.request.RegisterRequest;
import com.example.library.dto.request.ForgotPasswordRequest;
import com.example.library.dto.request.ResetPasswordRequest;
import com.example.library.dto.response.AuthResponse;
import com.example.library.dto.response.LoginResponse;
import com.example.library.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok("Password reset link sent to email if it exists.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok("Password has been reset successfully.");
    }

    @PostMapping("/verify-registration-otp")
    public ResponseEntity<String> verifyRegistrationOtp(@Valid @RequestBody com.example.library.dto.request.VerifyOtpRequest request) {
        authService.verifyRegistrationOtp(request);
        return ResponseEntity.ok("Email verified successfully.");
    }

    @PostMapping("/resend-registration-otp")
    public ResponseEntity<String> resendRegistrationOtp(@Valid @RequestBody com.example.library.dto.request.ResendOtpRequest request) {
        authService.resendRegistrationOtp(request);
        return ResponseEntity.ok("OTP has been resent successfully.");
    }
}
