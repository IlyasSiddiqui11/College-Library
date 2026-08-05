package com.example.library.service;

import lombok.RequiredArgsConstructor;

import com.example.library.dto.request.LoginRequest;
import com.example.library.dto.request.RegisterRequest;
import com.example.library.dto.request.ForgotPasswordRequest;
import com.example.library.dto.request.ResetPasswordRequest;
import com.example.library.dto.request.VerifyOtpRequest;
import com.example.library.dto.request.ResendOtpRequest;
import com.example.library.dto.response.AuthResponse;
import com.example.library.dto.response.LoginResponse;
import com.example.library.dto.response.UserResponse;
import com.example.library.entity.User;
import com.example.library.exception.BadRequestException;
import com.example.library.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.library.repository.StaffProfileRepository;
import com.example.library.entity.StaffProfile;
import com.example.library.enums.StaffStatus;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final Random random = new Random();

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private String generateOtp() {
        return String.format("%06d", random.nextInt(1000000));
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        String otp = generateOtp();
        
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .isVerified(false)
                .registrationOtp(otp)
                .registrationOtpExpiry(LocalDateTime.now().plusMinutes(15))
                .build();

        User savedUser = userRepository.save(user);

        sendOtpEmail(savedUser.getEmail(), savedUser.getName(), otp);

        return AuthResponse.builder()
                .message("User registered successfully. Please verify your email.")
                .user(mapToUserResponse(savedUser))
                .build();
    }

    private void sendOtpEmail(String email, String name, String otp) {
        try {
            String subject = "Verify your Email - College Library";
            String body = String.format("Dear %s,\n\nWelcome to the College Library System!\n\nYour email verification OTP is: %s\n\nThis OTP is valid for 15 minutes.\n\nBest Regards,\nCollege Library", name, otp);
            emailService.sendEmail(email, subject, body);
        } catch (Exception e) {
            throw new BadRequestException("Email error: " + e.getMessage());
        }
    }

    @Transactional
    public void verifyRegistrationOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found with this email"));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            throw new BadRequestException("Email is already verified");
        }

        if (user.getRegistrationOtp() == null || !user.getRegistrationOtp().equals(request.getOtp())) {
            throw new BadRequestException("Invalid OTP");
        }

        if (user.getRegistrationOtpExpiry() == null || user.getRegistrationOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        user.setIsVerified(true);
        user.setRegistrationOtp(null);
        user.setRegistrationOtpExpiry(null);
        userRepository.save(user);
    }

    @Transactional
    public void resendRegistrationOtp(ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found with this email"));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            throw new BadRequestException("Email is already verified");
        }

        String otp = generateOtp();
        user.setRegistrationOtp(otp);
        user.setRegistrationOtpExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        sendOtpEmail(user.getEmail(), user.getName(), otp);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            // Check if they are a staff waiting for approval or rejected
            staffProfileRepository.findByCollegeEmail(request.getEmail()).ifPresent(profile -> {
                if (profile.getStatus() == StaffStatus.PENDING) {
                    throw new BadRequestException("Your staff verification request is pending Admin approval.");
                } else if (profile.getStatus() == StaffStatus.REJECTED) {
                    throw new BadRequestException("Your staff verification request has been rejected. Please contact the library administrator.");
                }
            });
            throw new BadRequestException("Invalid email or password");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }

        if (user.getRole() == com.example.library.enums.Role.STAFF) {
            staffProfileRepository.findByCollegeEmail(user.getEmail()).ifPresent(profile -> {
                if (profile.getStatus() == StaffStatus.INACTIVE) {
                    throw new BadRequestException("Your account has been deactivated. Please contact the administrator.");
                }
            });
        }

        if (!Boolean.TRUE.equals(user.getIsVerified()) && user.getRegistrationOtp() == null) {
            user.setIsVerified(true);
            userRepository.save(user);
        } else if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new BadRequestException("Please verify your email to log in.");
        }

        return LoginResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found with this email"));

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        String resetLink = frontendUrl + "/reset-password?token=" + token;
        
        String emailBody = "Hello " + user.getName() + ",\n\n"
                + "You requested to reset your password. Please click the link below to set a new password:\n\n"
                + resetLink + "\n\n"
                + "This link will expire in 1 hour.\n\n"
                + "If you did not request this, please ignore this email.";
                
        emailService.sendEmail(user.getEmail(), "Password Reset Request", emailBody);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset token has expired");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}