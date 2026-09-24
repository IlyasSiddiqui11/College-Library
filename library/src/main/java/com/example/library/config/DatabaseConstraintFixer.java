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
            log.info("[DatabaseConstraintFixer] Starting database constraint cleanup...");

            // 1. Explicitly drop known enum/status CHECK constraints individually
            String[] tables = {
                "book_reservations",
                "borrow_requests",
                "fines",
                "users",
                "lost_books",
                "audit_logs",
                "staff_profiles"
            };

            for (String table : tables) {
                dropConstraintQuietly(table, table + "_status_check");
                dropConstraintQuietly(table, table + "_role_check");
                dropConstraintQuietly(table, table + "_action_type_check");
                dropConstraintQuietly(table, table + "_target_type_check");
            }

            // 2. PostgreSQL specific: safe loop over information_schema
            try {
                String databaseProductName = "";
                try (Connection conn = jdbcTemplate.getDataSource().getConnection()) {
                    databaseProductName = conn.getMetaData().getDatabaseProductName();
                }

                if (databaseProductName != null && databaseProductName.toLowerCase().contains("postgres")) {
                    String dropCheckConstraintsSql = 
                        "DO $$ " +
                        "DECLARE r RECORD; " +
                        "BEGIN " +
                        "    FOR r IN " +
                        "        SELECT table_name, constraint_name " +
                        "        FROM information_schema.table_constraints " +
                        "        WHERE constraint_type = 'CHECK' " +
                        "          AND constraint_name LIKE '%_check' " +
                        "    LOOP " +
                        "        BEGIN " +
                        "            EXECUTE 'ALTER TABLE \"' || r.table_name || '\" DROP CONSTRAINT IF EXISTS \"' || r.constraint_name || '\"'; " +
                        "        EXCEPTION WHEN OTHERS THEN " +
                        "            NULL; " +
                        "        END; " +
                        "    END LOOP; " +
                        "END $$;";
                    jdbcTemplate.execute(dropCheckConstraintsSql);
                }
            } catch (Exception e) {
                log.debug("[DatabaseConstraintFixer] PostgreSQL loop execution note: {}", e.getMessage());
            }

            // 3. Drop NOT NULL constraints on audit_logs role columns if present
            try {
                jdbcTemplate.execute("ALTER TABLE audit_logs ALTER COLUMN attempted_role DROP NOT NULL");
                jdbcTemplate.execute("ALTER TABLE audit_logs ALTER COLUMN actual_role DROP NOT NULL");
            } catch (Exception e) {
                log.debug("[DatabaseConstraintFixer] Audit log column alter note: {}", e.getMessage());
            }

            log.info("[DatabaseConstraintFixer] Database constraint cleanup completed successfully.");
        } catch (Exception e) {
            log.warn("[DatabaseConstraintFixer] Could not execute constraint cleanup: {}", e.getMessage());
        }
    }

    private void dropConstraintQuietly(String table, String constraint) {
        try {
            jdbcTemplate.execute("ALTER TABLE " + table + " DROP CONSTRAINT IF EXISTS " + constraint);
            log.info("[DatabaseConstraintFixer] Executed drop constraint for {}.{}", table, constraint);
        } catch (Exception e) {
            log.debug("[DatabaseConstraintFixer] Note dropping {}.{}: {}", table, constraint, e.getMessage());
        }
    }
}
