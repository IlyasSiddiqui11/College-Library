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

        System.out.println("[DatabaseConstraintFixer] PostgreSQL detected. Running unconditional constraint cleanups...");

        String[] tables = {"book_reservations", "borrow_requests", "fines", "users", "audit_logs", "staff_profiles", "books"};
        for (String table : tables) {
            try {
                // Drop any constraint dynamically by querying pg_constraint
                jdbcTemplate.query(
                    "SELECT c.conname FROM pg_constraint c " +
                    "JOIN pg_class t ON c.conrelid = t.oid " +
                    "WHERE c.contype = 'c' AND t.relname = ?",
                    (rs, rowNum) -> rs.getString("conname"),
                    table
                ).forEach(conname -> {
                    try {
                        System.out.println("[DatabaseConstraintFixer] Dropping check constraint: " + table + "." + conname);
                        jdbcTemplate.execute("ALTER TABLE " + table + " DROP CONSTRAINT IF EXISTS \"" + conname + "\"");
                    } catch (Exception e) {
                        System.out.println("[DatabaseConstraintFixer] Could not drop " + conname + ": " + e.getMessage());
                    }
                });
            } catch (Exception e) {
                System.out.println("[DatabaseConstraintFixer] Error querying constraints for " + table + ": " + e.getMessage());
            }
        }

        // Drop NOT NULL on audit_logs role columns
        try {
            jdbcTemplate.execute("ALTER TABLE audit_logs ALTER COLUMN attempted_role DROP NOT NULL");
            jdbcTemplate.execute("ALTER TABLE audit_logs ALTER COLUMN actual_role DROP NOT NULL");
            System.out.println("[DatabaseConstraintFixer] ✅ audit_logs NOT NULL constraints relaxed.");
        } catch (Exception e) {
            System.out.println("[DatabaseConstraintFixer] audit_logs note: " + e.getMessage());
        }

        System.out.println("[DatabaseConstraintFixer] All constraint fixes completed.");
    }
}
