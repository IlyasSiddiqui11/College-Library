package com.example.library;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseFixRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseFixRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            // H2 auto-generates check constraints for Enums. 
            // When we added RESERVED, the old constraint blocked it.
            // We can drop the old constraint here.
            jdbcTemplate.execute("ALTER TABLE borrow_requests DROP CONSTRAINT CONSTRAINT_C");
            System.out.println("Dropped old CONSTRAINT_C from borrow_requests.");
        } catch (Exception e) {
            System.out.println("Could not drop constraint (might not exist or different name): " + e.getMessage());
        }
        
        try {
            jdbcTemplate.execute("ALTER TABLE borrow_requests DROP CONSTRAINT CONSTRAINT_C1");
            System.out.println("Dropped old CONSTRAINT_C1 from borrow_requests.");
        } catch (Exception e) {
        }
    }
}
