package com.easytimeoff.web;

import com.easytimeoff.domain.PublicHoliday;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/holidays")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class HolidayController {

    private List<PublicHoliday> cachedHolidays = new ArrayList<>();
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("holidays.json");
            cachedHolidays = objectMapper.readValue(resource.getInputStream(), new TypeReference<List<PublicHoliday>>() {});
        } catch (IOException e) {
            e.printStackTrace(); // Log error properly in real app
        }
    }

    @GetMapping
    public List<PublicHoliday> getByYear(@RequestParam(defaultValue = "2026") int year) {
        return cachedHolidays.stream()
                .filter(h -> h.getDate().getYear() == year)
                .collect(Collectors.toList());
    }
    
    // No POST/DELETE methods as per requirement (Config File only)
}