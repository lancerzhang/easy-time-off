package com.easytimeoff.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "users",
        indexes = {
                @Index(name = "idx_users_employee_id", columnList = "employee_id"),
                @Index(name = "idx_users_email", columnList = "email"),
                @Index(name = "idx_users_team_id", columnList = "team_id"),
                @Index(name = "idx_users_ad_principal_id", columnList = "ad_principal_id")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    @Column(name = "employee_id", nullable = false, unique = true)
    private String employeeID;

    @Column(name = "display_name", nullable = false)
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
