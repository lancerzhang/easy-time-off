package com.easytimeoff.web;

import com.easytimeoff.domain.LeaveRecord;
import com.easytimeoff.repository.LeaveRepository;
import com.easytimeoff.util.OffsetBasedPageRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}) // Allow React Frontend
public class LeaveController {

    private final LeaveRepository leaveRepository;

    @Autowired
    public LeaveController(LeaveRepository leaveRepository) {
        this.leaveRepository = leaveRepository;
    }

    @GetMapping
    public List<LeaveRecord> getAllLeaves(
            @RequestParam(required = false) List<String> userIds,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset
    ) {
        Pageable pageRequest = pageRequest(limit, offset, Sort.by("startDate").descending());
        // Support fetching leaves for specific users (Team View)
        if (userIds != null && !userIds.isEmpty()) {
            Pageable request = pageRequest == null ? Pageable.unpaged() : pageRequest;
            return leaveRepository.findByUserIdInAndDateRange(userIds, from, to, request).getContent();
        }
        if (pageRequest != null) {
            return leaveRepository.findAll(pageRequest).getContent();
        }
        return leaveRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<LeaveRecord> getLeavesByUser(
            @PathVariable String userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset
    ) {
        Pageable pageRequest = pageRequest(limit, offset, Sort.by("startDate").descending());
        Pageable request = pageRequest == null ? Pageable.unpaged() : pageRequest;
        return leaveRepository.findByUserIdInAndDateRange(List.of(userId), from, to, request).getContent();
    }

    @PostMapping
    public ResponseEntity<LeaveRecord> createLeave(@RequestBody LeaveRecord leave) {
        // Simple validation logic
        if (leave.getStartDate().isAfter(leave.getEndDate())) {
            return ResponseEntity.badRequest().build();
        }
        
        // In a real app, we would check for overlaps here using repository.findOverlappingLeaves
        
        LeaveRecord saved = leaveRepository.save(leave);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LeaveRecord> updateLeave(@PathVariable String id, @RequestBody LeaveRecord details) {
        return leaveRepository.findById(id)
                .map(existing -> {
                    existing.setStartDate(details.getStartDate());
                    existing.setEndDate(details.getEndDate());
                    existing.setNote(details.getNote());
                    existing.setStatus(LeaveRecord.LeaveStatus.PENDING); // Reset status on edit
                    return ResponseEntity.ok(leaveRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLeave(@PathVariable String id) {
        if (leaveRepository.existsById(id)) {
            leaveRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    private Pageable pageRequest(Integer limit, Integer offset, Sort sort) {
        if (limit == null || limit < 1) {
            return null;
        }
        int safeOffset = offset == null ? 0 : Math.max(0, offset);
        return new OffsetBasedPageRequest(safeOffset, limit, sort);
    }
}
