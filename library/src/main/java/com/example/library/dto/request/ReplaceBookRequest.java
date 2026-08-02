package com.example.library.dto.request;

import lombok.Data;
import lombok.EqualsAndHashCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@EqualsAndHashCode(callSuper = true)
public class ReplaceBookRequest extends BookCreateRequest {

    @NotBlank(message = "Original accession number is required")
    private String originalAccessionNumber;

    @NotNull(message = "Student ID is required")
    private Long studentId;
}
