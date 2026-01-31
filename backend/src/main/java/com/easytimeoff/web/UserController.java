package com.easytimeoff.web;

import com.easytimeoff.domain.User;
import com.easytimeoff.repository.UserRepository;
import com.easytimeoff.util.OffsetBasedPageRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private static final int DEFAULT_SEARCH_LIMIT = 20;

    @GetMapping
    public List<User> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) List<String> ids,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset) {
        
        // Batch fetch by IDs (for Team Views)
        if (ids != null && !ids.isEmpty()) {
            List<String> resolvedIds = normalizeIds(ids);
            return userRepository.findAllById(resolvedIds);
        }

        // Search by displayName/email/employeeID
        if (query != null && !query.isEmpty()) {
            Pageable pageRequest = pageRequest(limit == null ? DEFAULT_SEARCH_LIMIT : limit, offset, Sort.by("displayName").ascending());
            if (pageRequest != null) {
                return userRepository.search(query, pageRequest).getContent();
            }
            return userRepository.search(query);
        }

        Pageable pageRequest = pageRequest(limit, offset, Sort.by("displayName").ascending());
        if (pageRequest != null) {
            return userRepository.findAll(pageRequest).getContent();
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

    private Pageable pageRequest(Integer limit, Integer offset, Sort sort) {
        if (limit == null || limit < 1) {
            return null;
        }
        int safeOffset = offset == null ? 0 : Math.max(0, offset);
        return new OffsetBasedPageRequest(safeOffset, limit, sort);
    }

    private List<String> normalizeIds(List<String> ids) {
        if (ids.size() == 1 && ids.get(0) != null && ids.get(0).contains(",")) {
            return Arrays.stream(ids.get(0).split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
        return ids;
    }
}
