package com.example.library.dto.request;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LostBookReportRequest {
    @NotBlank(message = "Accession number is required")
    private String accessionNumber;

    @NotBlank(message = "Reason is required")
    private String reason;

    private String remarks;

    private String reportedByAdmin;
}
