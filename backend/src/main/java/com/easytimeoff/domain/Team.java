package com.easytimeoff.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "teams",
        indexes = {
                @Index(name = "idx_teams_name", columnList = "name"),
                @Index(name = "idx_teams_type", columnList = "type"),
                @Index(name = "idx_teams_created_by", columnList = "created_by"),
                @Index(name = "idx_teams_created_by_type", columnList = "created_by,type")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TeamType type;

    @Column(name = "created_by")
    private String createdBy;

    // Storing member IDs directly for simplicity in this specific "Easy" architecture 
    // to match the frontend JSON structure. 
    // In a strict Relational model, this would be a @ManyToMany with User.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "team_members",
            joinColumns = @JoinColumn(name = "team_id"),
            indexes = {
                    @Index(name = "idx_team_members_team_id", columnList = "team_id"),
                    @Index(name = "idx_team_members_user_id", columnList = "user_id")
            }
    )
    @Column(name = "user_id")
    @Builder.Default
    private Set<String> memberIds = new HashSet<>();

    public enum TeamType {
        POD, VIRTUAL
    }
}
