package com.example.library.controller;

import com.example.library.dto.response.ReplacementResponse;
import com.example.library.service.BookReplacementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/replacements")
@RequiredArgsConstructor
public class ReplacementController {

    private final BookReplacementService replacementService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<ReplacementResponse>> getAllReplacements() {
        return ResponseEntity.ok(replacementService.getAllReplacements());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'STUDENT')")
    public ResponseEntity<List<ReplacementResponse>> getReplacementsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(replacementService.getReplacementsByUser(userId));
    }
}
