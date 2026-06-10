package com.example.library.dto.response;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


import lombok.Data;



import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
