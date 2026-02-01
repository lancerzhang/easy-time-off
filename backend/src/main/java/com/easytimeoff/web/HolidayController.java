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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/holidays")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class HolidayController {

    private List<PublicHoliday> cachedHolidays = new ArrayList<>();
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private static class HolidayEntry {
        public LocalDate date;
        public String name;
        public boolean isWorkday;
    }

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("holidays.json");
            Map<String, Map<String, List<HolidayEntry>>> data = objectMapper.readValue(
                    resource.getInputStream(),
                    new TypeReference<Map<String, Map<String, List<HolidayEntry>>>>() {}
            );
            List<PublicHoliday> flattened = new ArrayList<>();
            data.forEach((year, countries) -> {
                if (countries == null) {
                    return;
                }
                countries.forEach((country, holidays) -> {
                    if (holidays == null) {
                        return;
                    }
                    holidays.forEach(holiday -> {
                        if (holiday == null) {
                            return;
                        }
                        flattened.add(PublicHoliday.builder()
                                .date(holiday.date)
                                .name(holiday.name)
                                .country(country)
                                .isWorkday(holiday.isWorkday)
                                .build());
                    });
                });
            });
            cachedHolidays = flattened;
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
