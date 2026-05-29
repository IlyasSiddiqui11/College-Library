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
public class GateLogResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String branch;
    private Integer year;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private LocalDateTime createdAt;
}
