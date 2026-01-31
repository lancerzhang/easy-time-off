package com.easytimeoff.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(
        name = "leaves",
        indexes = {
                @Index(name = "idx_leaves_user_id", columnList = "user_id"),
                @Index(name = "idx_leaves_start_date", columnList = "start_date"),
                @Index(name = "idx_leaves_end_date", columnList = "end_date"),
                @Index(name = "idx_leaves_user_date", columnList = "user_id,start_date,end_date")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DataSource source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveStatus status;

    private String note;

    public enum DataSource {
        HR, OUTLOOK, MANUAL
    }

    public enum LeaveStatus {
        APPROVED, PENDING, REJECTED
    }
}
