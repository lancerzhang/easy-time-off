package com.easytimeoff.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "view_history",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "item_id", "type"}),
        indexes = {
                @Index(name = "idx_view_history_user_timestamp", columnList = "user_id,timestamp")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViewHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "item_id", nullable = false)
    private String itemId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ViewType type;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private long timestamp;

    public enum ViewType {
        USER, TEAM, POD
    }
}
