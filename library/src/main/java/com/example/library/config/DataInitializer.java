//package com.example.library.config;
//
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.jdbc.core.JdbcTemplate;
//import org.springframework.stereotype.Component;
//import org.springframework.beans.factory.annotation.Autowired;
//
//@Component
//public class DatabaseInitializer implements CommandLineRunner {
//
//    @Autowired
//    private JdbcTemplate jdbcTemplate;
//
//    @Override
//    public void run(String... args) throws Exception {
//        try {
//            System.out.println("Running DatabaseInitializer to modify constraints...");
//
//            // Drop unique constraint on books.isbn (Hibernate naming is typically UK_xxxx or similar, but on PostgreSQL it could be books_isbn_key)
//            // Let's drop constraint if exists
//            jdbcTemplate.execute("ALTER TABLE books DROP CONSTRAINT IF EXISTS books_isbn_key");
//
//            // For general databases, try dropping indices as well
//            try {
//                jdbcTemplate.execute("DROP INDEX IF EXISTS books_isbn_key");
//            } catch (Exception e) {
//                // Ignore if index doesn't exist
//            }
//            try {
//                jdbcTemplate.execute("DROP INDEX IF EXISTS uk_books_isbn");
//            } catch (Exception e) {
//                // Ignore
//            }
//
//            // Drop NOT NULL constraint on borrow_requests.book_id
//            jdbcTemplate.execute("ALTER TABLE borrow_requests ALTER COLUMN book_id DROP NOT NULL");
//
//            System.out.println("DatabaseInitializer constraints updated successfully!");
//        } catch (Exception e) {
//            System.out.println("DatabaseInitializer: warning during constraint drop (already dropped or database not ready yet): " + e.getMessage());
//        }
//    }
//}
package com.example.library.config;

import com.example.library.entity.User;
import com.example.library.enums.Role;
import com.example.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@library.local}")
    private String adminEmail;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Value("${app.admin.name:Administrator}")
    private String adminName;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .name(adminName)
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
        }
    }
}

