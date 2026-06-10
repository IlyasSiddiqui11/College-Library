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
public class GateStatusResponse {
    private Long userId;
    private String userName;
    private boolean insideLibrary;
    private LocalDateTime entryTime;
    private Long activeLogId;
}
