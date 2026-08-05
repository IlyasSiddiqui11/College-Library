package com.example.library.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs once at startup to fix the users_role_check constraint in PostgreSQL.
 *
 * Problem: The constraint was originally created with only ('STUDENT', 'ADMIN').
 * Hibernate's ddl-auto=update cannot modify existing CHECK constraints,
 * so STAFF role insertions fail with a constraint violation error.
 *
 * This fix only runs on PostgreSQL (Render production) and is safely skipped on H2 (local dev).
 */
@Component
@RequiredArgsConstructor
@Order(1) // Run before DataInitializer
public class DatabaseConstraintFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            // Detect database type — skip fix on H2 (local dev)
            String dbProductName = jdbcTemplate.getDataSource()
                    .getConnection()
                    .getMetaData()
                    .getDatabaseProductName();

            if (dbProductName == null || !dbProductName.toLowerCase().contains("postgresql")) {
                System.out.println("[DatabaseConstraintFixer] Skipping — not PostgreSQL (detected: " + dbProductName + ")");
                return;
            }

            System.out.println("[DatabaseConstraintFixer] PostgreSQL detected. Checking users_role_check constraint...");

            // Check current constraint definition
            String constraintDef = null;
            try {
                constraintDef = jdbcTemplate.queryForObject(
                        "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'users_role_check'",
                        String.class
                );
            } catch (Exception e) {
                System.out.println("[DatabaseConstraintFixer] Could not read constraint: " + e.getMessage());
            }

            // If constraint already includes STAFF, nothing to do
            if (constraintDef != null && constraintDef.contains("STAFF")) {
                System.out.println("[DatabaseConstraintFixer] Constraint already includes STAFF. No fix needed.");
                return;
            }

            System.out.println("[DatabaseConstraintFixer] Current constraint: " + constraintDef);
            System.out.println("[DatabaseConstraintFixer] Fixing constraint to include STAFF role...");

            // Drop the old constraint and recreate with STAFF included
            jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            jdbcTemplate.execute(
                    "ALTER TABLE users ADD CONSTRAINT users_role_check " +
                    "CHECK (role IN ('STUDENT', 'ADMIN', 'STAFF'))"
            );

            System.out.println("[DatabaseConstraintFixer] ✅ users_role_check constraint successfully updated to include STAFF.");

        } catch (Exception e) {
            // Log but don't crash — the app can still run even if this fails
            System.err.println("[DatabaseConstraintFixer] ⚠️ Failed to fix constraint: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
