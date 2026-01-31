package com.easytimeoff.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "pods")
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
    @CollectionTable(name = "pod_members", joinColumns = @JoinColumn(name = "pod_id"))
    @Column(name = "user_id")
    @Builder.Default
    private Set<String> memberIds = new HashSet<>();
}
