package com.easytimeoff.web;

import com.easytimeoff.domain.ViewHistory;
import com.easytimeoff.repository.ViewHistoryRepository;
import com.easytimeoff.util.OffsetBasedPageRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Sort;

import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class HistoryController {

    private final ViewHistoryRepository viewHistoryRepository;

    @GetMapping
    public List<HistoryResponse> getByUser(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset
    ) {
        if (userId == null || userId.isBlank()) {
            return Collections.emptyList();
        }

        if (limit == null) {
            return viewHistoryRepository.findTop10ByUserIdOrderByTimestampDesc(userId)
                    .stream()
                    .map(HistoryController::toResponse)
                    .collect(Collectors.toList());
        }

        if (limit < 1) {
            return Collections.emptyList();
        }

        int safeOffset = offset == null ? 0 : Math.max(0, offset);
        OffsetBasedPageRequest pageRequest = new OffsetBasedPageRequest(
                safeOffset,
                limit,
                Sort.by(Sort.Direction.DESC, "timestamp")
        );

        return viewHistoryRepository.findByUserIdOrderByTimestampDesc(userId, pageRequest)
                .stream()
                .map(HistoryController::toResponse)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<HistoryResponse> add(@RequestBody HistoryRequest request) {
        if (request == null || request.userId() == null || request.itemId() == null || request.type() == null) {
            return ResponseEntity.badRequest().build();
        }

        ViewHistory.ViewType type;
        try {
            type = ViewHistory.ViewType.valueOf(request.type().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }

        long now = System.currentTimeMillis();
        ViewHistory history = viewHistoryRepository.findByUserIdAndItemIdAndType(request.userId(), request.itemId(), type)
                .orElseGet(() -> ViewHistory.builder()
                        .userId(request.userId())
                        .itemId(request.itemId())
                        .type(type)
                        .build());

        history.setName(request.name() == null ? "" : request.name());
        history.setTimestamp(now);
        ViewHistory saved = viewHistoryRepository.save(history);

        return ResponseEntity.ok(toResponse(saved));
    }

    private static HistoryResponse toResponse(ViewHistory history) {
        return new HistoryResponse(
                history.getItemId(),
                history.getType().name(),
                history.getName(),
                history.getTimestamp()
        );
    }

    public record HistoryRequest(String userId, String itemId, String type, String name) {}

    public record HistoryResponse(String id, String type, String name, long timestamp) {}
}
