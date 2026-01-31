package com.easytimeoff.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicHoliday {
    private LocalDate date;
    private String name;
    private String country; // "ALL", "CN", "US"
    private boolean isWorkday;
}