package com.easytimeoff.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String employeeID;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String country; // ISO Code e.g. CN, US

    private String avatar;

    @Column(name = "team_id")
    private String teamId;

    @Column(name = "ad_principal_id")
    private String adPrincipalId;
}
