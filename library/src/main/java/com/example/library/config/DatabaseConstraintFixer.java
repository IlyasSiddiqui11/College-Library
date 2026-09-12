package com.example.library.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs once at startup to fix PostgreSQL CHECK / NOT NULL constraints
 * that Hibernate's ddl-auto=update cannot modify.
 *
 * Each fix is INDEPENDENT — a short-circuit in one section never skips others.
 * Safe to run on every restart (idempotent).
 * Skipped entirely on H2 (local dev).
 */
@Component
@RequiredArgsConstructor
@Order(1) // Run before DataInitializer
public class DatabaseConstraintFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        // Detect database type — skip all fixes on H2 (local dev)
        String dbProductName;
        try {
            dbProductName = jdbcTemplate.getDataSource()
                    .getConnection()
                    .getMetaData()
                    .getDatabaseProductName();
        } catch (Exception e) {
            System.err.println("[DatabaseConstraintFixer] Could not detect DB type: " + e.getMessage());
            return;
        }

        if (dbProductName == null || !dbProductName.toLowerCase().contains("postgresql")) {
            System.out.println("[DatabaseConstraintFixer] Skipping — not PostgreSQL (detected: " + dbProductName + ")");
            return;
        }

        System.out.println("[DatabaseConstraintFixer] PostgreSQL detected. Running all constraint fixes...");

        // ── Fix 1: users_role_check — must include STAFF ─────────────────────────
        try {
            String def = null;
            try {
                def = jdbcTemplate.queryForObject(
                        "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'users_role_check'",
                        String.class);
            } catch (Exception e) {
                System.out.println("[DatabaseConstraintFixer] Could not read users_role_check: " + e.getMessage());
            }

            if (def == null || !def.contains("STAFF")) {
                System.out.println("[DatabaseConstraintFixer] Fixing users_role_check to include STAFF...");
                jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
                jdbcTemplate.execute(
                        "ALTER TABLE users ADD CONSTRAINT users_role_check " +
                        "CHECK (role IN ('STUDENT', 'ADMIN', 'STAFF'))");
                System.out.println("[DatabaseConstraintFixer] ✅ users_role_check updated.");
            } else {
                System.out.println("[DatabaseConstraintFixer] users_role_check already includes STAFF. OK.");
            }
        } catch (Exception e) {
            System.err.println("[DatabaseConstraintFixer] ⚠️ users_role_check fix failed: " + e.getMessage());
        }

        // ── Fix 2: audit_logs — drop NOT NULL on role columns ────────────────────
        try {
            System.out.println("[DatabaseConstraintFixer] Relaxing NOT NULL on audit_logs role columns...");
            jdbcTemplate.execute("ALTER TABLE audit_logs ALTER COLUMN attempted_role DROP NOT NULL");
            jdbcTemplate.execute("ALTER TABLE audit_logs ALTER COLUMN actual_role DROP NOT NULL");
            System.out.println("[DatabaseConstraintFixer] ✅ audit_logs NOT NULL constraints relaxed.");
        } catch (Exception e) {
            // Columns may already be nullable — this is fine
            System.out.println("[DatabaseConstraintFixer] audit_logs note (may already be nullable): " + e.getMessage());
        }

        // ── Fix 3: book_reservations_status_check — must include EXPIRED ─────────
        try {
            String def = null;
            try {
                def = jdbcTemplate.queryForObject(
                        "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'book_reservations_status_check'",
                        String.class);
            } catch (Exception e) {
                System.out.println("[DatabaseConstraintFixer] Could not read book_reservations_status_check: " + e.getMessage());
            }

            if (def == null || !def.contains("EXPIRED")) {
                System.out.println("[DatabaseConstraintFixer] Fixing book_reservations_status_check to include EXPIRED...");
                jdbcTemplate.execute("ALTER TABLE book_reservations DROP CONSTRAINT IF EXISTS book_reservations_status_check");
                jdbcTemplate.execute(
                        "ALTER TABLE book_reservations ADD CONSTRAINT book_reservations_status_check " +
                        "CHECK (status IN ('PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED'))");
                System.out.println("[DatabaseConstraintFixer] ✅ book_reservations_status_check updated with EXPIRED.");
            } else {
                System.out.println("[DatabaseConstraintFixer] book_reservations_status_check already includes EXPIRED. OK.");
            }
        } catch (Exception e) {
            System.err.println("[DatabaseConstraintFixer] ⚠️ book_reservations_status_check fix failed: " + e.getMessage());
        }

        System.out.println("[DatabaseConstraintFixer] All constraint fixes completed.");
    }
}
