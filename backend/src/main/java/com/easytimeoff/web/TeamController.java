package com.easytimeoff.web;

import com.easytimeoff.domain.LeaveRecord;
import com.easytimeoff.domain.Team;
import com.easytimeoff.domain.User;
import com.easytimeoff.repository.LeaveRepository;
import com.easytimeoff.repository.TeamRepository;
import com.easytimeoff.repository.UserRepository;
import com.easytimeoff.util.OffsetBasedPageRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final LeaveRepository leaveRepository;
    private static final int DEFAULT_SEARCH_LIMIT = 20;

    @GetMapping
    public List<Team> getAll(
            @RequestParam(required = false) List<String> ids,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) Team.TeamType type,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset
    ) {
        if (ids != null && !ids.isEmpty()) {
            List<String> resolvedIds = normalizeIds(ids);
            return teamRepository.findAllById(resolvedIds);
        }

        Pageable pageRequest = pageRequest(limit, offset, Sort.by("name").ascending());
        if (createdBy != null && !createdBy.isEmpty() && type != null) {
            if (pageRequest != null) {
                return teamRepository.findByTypeAndCreatedBy(type, createdBy, pageRequest).getContent();
            }
            return teamRepository.findByTypeAndCreatedBy(type, createdBy);
        }
        if (createdBy != null && !createdBy.isEmpty()) {
            if (pageRequest != null) {
                return teamRepository.findByCreatedBy(createdBy, pageRequest).getContent();
            }
            return teamRepository.findByCreatedBy(createdBy);
        }
        if (type != null) {
            if (pageRequest != null) {
                return teamRepository.findByType(type, pageRequest).getContent();
            }
            return teamRepository.findByType(type);
        }
        if (query != null && !query.isEmpty()) {
            Pageable searchPage = pageRequest(limit == null ? DEFAULT_SEARCH_LIMIT : limit, offset, Sort.by("name").ascending());
            if (searchPage != null) {
                return teamRepository.findByNameContainingIgnoreCase(query, searchPage).getContent();
            }
            return teamRepository.findByNameContainingIgnoreCase(query);
        }
        if (pageRequest != null) {
            return teamRepository.findAll(pageRequest).getContent();
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

    @GetMapping("/{id}/leaves")
    public ResponseEntity<List<UserLeavesResponse>> getTeamLeaves(
            @PathVariable String id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return teamRepository.findById(id)
                .map(team -> {
                    List<String> memberIds = team.getMemberIds().stream().toList();
                    if (memberIds.isEmpty()) {
                        return ResponseEntity.ok(Collections.<UserLeavesResponse>emptyList());
                    }

                    List<User> members = userRepository.findAllById(memberIds);
                    List<LeaveRecord> leaves = leaveRepository.findByUserIdInAndDateRange(
                            memberIds,
                            from,
                            to,
                            Pageable.unpaged()
                    ).getContent();

                    Map<String, List<LeaveRecord>> leavesByUser = leaves.stream()
                            .collect(Collectors.groupingBy(LeaveRecord::getUserId));

                    List<UserLeavesResponse> payload = members.stream()
                            .map(user -> new UserLeavesResponse(user, leavesByUser.getOrDefault(user.getId(), List.of())))
                            .collect(Collectors.toList());

                    return ResponseEntity.ok(payload);
                })
                .orElse(ResponseEntity.notFound().build());
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
