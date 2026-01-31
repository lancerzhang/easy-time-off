package com.easytimeoff.web;

import com.easytimeoff.domain.LeaveRecord;
import com.easytimeoff.domain.Pod;
import com.easytimeoff.domain.User;
import com.easytimeoff.repository.LeaveRepository;
import com.easytimeoff.repository.PodRepository;
import com.easytimeoff.repository.UserRepository;
import com.easytimeoff.util.OffsetBasedPageRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pods")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class PodController {

    private final PodRepository podRepository;
    private final UserRepository userRepository;
    private final LeaveRepository leaveRepository;
    private static final int DEFAULT_SEARCH_LIMIT = 20;

    @GetMapping
    public List<Pod> getAll(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset
    ) {
        Pageable pageRequest = pageRequest(limit, offset, Sort.by("name").ascending());
        if (query != null && !query.isEmpty()) {
            Pageable searchPage = pageRequest(limit == null ? DEFAULT_SEARCH_LIMIT : limit, offset, Sort.by("name").ascending());
            if (searchPage != null) {
                return podRepository.findByNameContainingIgnoreCase(query, searchPage).getContent();
            }
            return podRepository.findByNameContainingIgnoreCase(query);
        }
        if (pageRequest != null) {
            return podRepository.findAll(pageRequest).getContent();
        }
        return podRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pod> getById(@PathVariable String id) {
        return podRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/leaves")
    public ResponseEntity<List<UserLeavesResponse>> getPodLeaves(
            @PathVariable String id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return podRepository.findById(id)
                .map(pod -> {
                    List<String> memberIds = pod.getMemberIds().stream().toList();
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
}
