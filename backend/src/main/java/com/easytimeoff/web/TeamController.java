package com.easytimeoff.web;

import com.easytimeoff.domain.Team;
import com.easytimeoff.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;

    @GetMapping
    public List<Team> getAll(@RequestParam(required = false) String query) {
        if (query != null && !query.isEmpty()) {
            return teamRepository.findByNameContainingIgnoreCase(query);
        }
        return teamRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Team> getById(@PathVariable String id) {
        return teamRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Team create(@RequestBody Team team) {
        // ID is auto-generated in real DB, but we allow FE to send mock IDs if needed, 
        // strictly for this prototype phase.
        return teamRepository.save(team);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        teamRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}