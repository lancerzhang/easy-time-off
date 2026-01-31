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
        name = "pods",
        indexes = {
                @Index(name = "idx_pods_name", columnList = "name")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Pod {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "pod_members",
            joinColumns = @JoinColumn(name = "pod_id"),
            indexes = {
                    @Index(name = "idx_pod_members_pod_id", columnList = "pod_id"),
                    @Index(name = "idx_pod_members_user_id", columnList = "user_id")
            }
    )
    @Column(name = "user_id")
    @Builder.Default
    private Set<String> memberIds = new HashSet<>();
}
