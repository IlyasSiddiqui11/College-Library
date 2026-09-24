package com.example.library.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Connection;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseConstraintFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            String databaseProductName = "";
            try (Connection conn = jdbcTemplate.getDataSource().getConnection()) {
                databaseProductName = conn.getMetaData().getDatabaseProductName();
            }

            if (!databaseProductName.toLowerCase().contains("postgresql")) {
                log.info("[DatabaseConstraintFixer] Skipping — not PostgreSQL (detected: {})", databaseProductName);
                return;
            }

            log.info("[DatabaseConstraintFixer] Starting PostgreSQL database constraint cleanup...");

            // 1. Drop all enum/status CHECK constraints across all tables in public schema
            String dropCheckConstraintsSql = 
                "DO $$ " +
                "DECLARE r RECORD; " +
                "BEGIN " +
                "    FOR r IN " +
                "        SELECT table_name, constraint_name " +
                "        FROM information_schema.table_constraints " +
                "        WHERE constraint_type = 'CHECK' " +
                "          AND constraint_schema = 'public' " +
                "    LOOP " +
                "        EXECUTE 'ALTER TABLE \"' || r.table_name || '\" DROP CONSTRAINT IF EXISTS \"' || r.constraint_name || '\"'; " +
                "    END LOOP; " +
                "END $$;";

            jdbcTemplate.execute(dropCheckConstraintsSql);
            log.info("[DatabaseConstraintFixer] Successfully dropped restrictive CHECK constraints across all tables.");

            // 2. Drop NOT NULL constraints on audit_logs role columns if present
            try {
                jdbcTemplate.execute("ALTER TABLE audit_logs ALTER COLUMN attempted_role DROP NOT NULL");
                jdbcTemplate.execute("ALTER TABLE audit_logs ALTER COLUMN actual_role DROP NOT NULL");
                log.info("[DatabaseConstraintFixer] Relaxed NOT NULL constraints on audit_logs table.");
            } catch (Exception e) {
                log.debug("[DatabaseConstraintFixer] Audit log column alter note: {}", e.getMessage());
            }

            log.info("[DatabaseConstraintFixer] Database constraint cleanup completed successfully.");
        } catch (Exception e) {
            log.warn("[DatabaseConstraintFixer] Could not execute constraint cleanup: {}", e.getMessage());
        }
    }
}
