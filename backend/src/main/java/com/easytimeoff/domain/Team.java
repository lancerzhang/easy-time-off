package com.easytimeoff.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "teams")
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
    @CollectionTable(name = "team_members", joinColumns = @JoinColumn(name = "team_id"))
    @Column(name = "user_id")
    @Builder.Default
    private Set<String> memberIds = new HashSet<>();

    public enum TeamType {
        POD, VIRTUAL
    }
}
