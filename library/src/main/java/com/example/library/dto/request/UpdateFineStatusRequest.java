package com.example.library.dto.request;

import com.example.library.enums.FineStatus;
import lombok.Data;

@Data
public class UpdateFineStatusRequest {
    private FineStatus status;
    private String billNumber;
}
