package com.example.library.service;

import com.example.library.dto.request.ProfileCompleteRequest;
import com.example.library.dto.response.ProfileResponse;
import com.example.library.entity.StudentProfile;
import com.example.library.entity.User;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.StudentProfileRepository;
import com.example.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final StudentProfileRepository profileRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProfileResponse completeProfile(ProfileCompleteRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));

        // Update user name if provided
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
            userRepository.save(user);
        }

        Optional<StudentProfile> existingOpt = profileRepository.findByUserId(request.getUserId());

        StudentProfile profile;
        if (existingOpt.isPresent()) {
            // Update existing profile (upsert)
            profile = existingOpt.get();
            profile.setBranch(request.getBranch());
            profile.setYear(request.getYear());
            profile.setContactNumber(request.getContactNumber());
            profile.setAddress(request.getAddress());
            profile.setProfileCompleted(true);
        } else {
            // Create new profile
            profile = StudentProfile.builder()
                    .user(user)
                    .branch(request.getBranch())
                    .year(request.getYear())
                    .contactNumber(request.getContactNumber())
                    .address(request.getAddress())
                    .profileCompleted(true)
                    .build();
        }

        StudentProfile savedProfile = profileRepository.save(profile);
        return mapToProfileResponse(savedProfile);
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfileByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }

        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not completed for user ID: " + userId));

        return mapToProfileResponse(profile);
    }

    private ProfileResponse mapToProfileResponse(StudentProfile profile) {
        return ProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .userName(profile.getUser().getName())
                .userEmail(profile.getUser().getEmail())
                .branch(profile.getBranch())
                .year(profile.getYear())
                .contactNumber(profile.getContactNumber())
                .address(profile.getAddress())
                .profileCompleted(profile.isProfileCompleted())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
