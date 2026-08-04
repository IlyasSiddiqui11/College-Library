package com.example.library.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StaffVerificationRequestDto {

    @NotBlank(message = "Full Name is required")
    private String fullName;

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    @NotBlank(message = "College Email is required")
    @Email(message = "Invalid email format")
    private String collegeEmail;

    @NotBlank(message = "Mobile Number is required")
    private String mobileNumber;

    @NotBlank(message = "Department is required")
    private String department;

    @NotBlank(message = "Designation is required")
    private String designation;

    @NotBlank(message = "Employment Type is required")
    private String employmentType;
}
