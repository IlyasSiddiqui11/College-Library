package com.example.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProfileCompleteRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    private String name;

    @NotBlank(message = "Branch is required")
    private String branch;

    @NotNull(message = "Year is required")
    private Integer year;

    @NotBlank(message = "Contact number is required")
    private String contactNumber;

    @NotBlank(message = "Address is required")
    private String address;
}
