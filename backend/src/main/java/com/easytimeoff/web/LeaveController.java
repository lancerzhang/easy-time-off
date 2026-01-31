package com.easytimeoff.web;

import com.easytimeoff.domain.LeaveRecord;
import com.easytimeoff.repository.LeaveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public List<LeaveRecord> getAllLeaves(@RequestParam(required = false) List<String> userIds) {
        // Support fetching leaves for specific users (Team View)
        if (userIds != null && !userIds.isEmpty()) {
            return leaveRepository.findByUserIdIn(userIds);
        }
        return leaveRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<LeaveRecord> getLeavesByUser(@PathVariable String userId) {
        return leaveRepository.findByUserId(userId);
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
}