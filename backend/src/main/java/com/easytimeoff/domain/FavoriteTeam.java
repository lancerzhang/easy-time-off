package com.easytimeoff.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "favorite_teams",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "team_id"}),
        indexes = {
                @Index(name = "idx_favorite_teams_user_created_at", columnList = "user_id,created_at")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "team_id", nullable = false)
    private String teamId;

    @Column(name = "created_at", nullable = false)
    private long createdAt;
}
