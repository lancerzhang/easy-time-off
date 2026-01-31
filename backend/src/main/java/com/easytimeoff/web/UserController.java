package com.easytimeoff.web;

import com.easytimeoff.domain.User;
import com.easytimeoff.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public List<User> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) List<String> ids) {
        
        // Batch fetch by IDs (for Team Views)
        if (ids != null && !ids.isEmpty()) {
            return userRepository.findAllById(ids);
        }

        // Search by displayName/email/employeeID
        if (query != null && !query.isEmpty()) {
            return userRepository.search(query);
        }
        
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable String id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Simulate Login Endpoint
    @PostMapping("/login")
    public ResponseEntity<User> login() {
        List<User> users = userRepository.findAll();
        if (users.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(users.get(0));
    }
}