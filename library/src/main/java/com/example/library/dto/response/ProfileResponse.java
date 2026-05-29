package com.example.library.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String branch;
    private Integer year;
    private String contactNumber;
    private String address;
    private boolean profileCompleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
