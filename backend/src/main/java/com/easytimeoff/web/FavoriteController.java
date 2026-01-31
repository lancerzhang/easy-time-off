package com.easytimeoff.web;

import com.easytimeoff.domain.FavoriteTeam;
import com.easytimeoff.repository.FavoriteTeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/favorites")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteTeamRepository favoriteTeamRepository;

    @GetMapping
    public List<String> getByUser(@RequestParam(required = false) String userId) {
        if (userId == null || userId.isBlank()) {
            return Collections.emptyList();
        }
        return favoriteTeamRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(FavoriteTeam::getTeamId)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<List<String>> toggle(@RequestBody FavoriteRequest request) {
        if (request == null || request.userId() == null || request.teamId() == null) {
            return ResponseEntity.badRequest().build();
        }

        favoriteTeamRepository.findByUserIdAndTeamId(request.userId(), request.teamId())
                .ifPresentOrElse(
                        favoriteTeamRepository::delete,
                        () -> favoriteTeamRepository.save(FavoriteTeam.builder()
                                .userId(request.userId())
                                .teamId(request.teamId())
                                .createdAt(System.currentTimeMillis())
                                .build())
                );

        List<String> ids = favoriteTeamRepository.findByUserIdOrderByCreatedAtDesc(request.userId())
                .stream()
                .map(FavoriteTeam::getTeamId)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ids);
    }

    public record FavoriteRequest(String userId, String teamId) {}
}
