package com.example.library.dto.response;

import com.example.library.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class LoginResponse {

    private Long id;

    private String name;

    private String email;

    private Role role;
}