package com.easytimeoff.web;

import com.easytimeoff.domain.Pod;
import com.easytimeoff.repository.PodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pods")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class PodController {

    private final PodRepository podRepository;

    @GetMapping
    public List<Pod> getAll(@RequestParam(required = false) String query) {
        if (query != null && !query.isEmpty()) {
            return podRepository.findByNameContainingIgnoreCase(query);
        }
        return podRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pod> getById(@PathVariable String id) {
        return podRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
