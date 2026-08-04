package com.example.library.repository;

import com.example.library.entity.StaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffProfileRepository extends JpaRepository<StaffProfile, Long> {
    boolean existsByEmployeeId(String employeeId);
    boolean existsByCollegeEmail(String collegeEmail);
    Optional<StaffProfile> findByUserId(Long userId);
    Optional<StaffProfile> findByCollegeEmail(String collegeEmail);
}
