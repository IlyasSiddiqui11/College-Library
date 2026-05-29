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
public class GateStatusResponse {
    private Long userId;
    private String userName;
    private boolean insideLibrary;
    private LocalDateTime entryTime;
    private Long activeLogId;
}
