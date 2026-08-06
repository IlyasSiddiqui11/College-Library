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

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "attempted_role", nullable = false)
    private Role attemptedRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "actual_role")
    private Role actualRole;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private String reason;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
