package com.example.library.entity;

import com.example.library.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Actor ---
    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "attempted_role")
    private Role attemptedRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "actual_role")
    private Role actualRole;

    // --- RULES.md §20 generic event fields ---
    /** e.g. LOGIN, BORROW_REQUEST, RETURN, FINE_VERIFIED, RESERVATION, PASSWORD_RESET */
    @Column(name = "action")
    private String action;

    /** e.g. AUTH, BORROW, RETURN, FINE, RESERVATION */
    @Column(name = "module")
    private String module;

    /** e.g. borrowRequestId=42, fineId=7, isbn=978... */
    @Column(name = "target_resource")
    private String targetResource;

    /** SUCCESS or FAILURE */
    @Column(name = "result")
    private String result;

    /** Human-readable detail */
    @Column(nullable = false)
    private String reason;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
        if (attemptedRole == null) {
            attemptedRole = actualRole != null ? actualRole : Role.ADMIN;
        }
        if (actualRole == null) {
            actualRole = attemptedRole != null ? attemptedRole : Role.ADMIN;
        }
        if (email == null || email.isBlank()) {
            email = "system@library.com";
        }
        if (reason == null || reason.isBlank()) {
            reason = "N/A";
        }
        if (action == null || action.isBlank()) {
            action = "GENERAL_EVENT";
        }
        if (module == null || module.isBlank()) {
            module = "SYSTEM";
        }
        if (result == null || result.isBlank()) {
            result = "SUCCESS";
        }
    }
}
