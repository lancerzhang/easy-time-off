package com.easytimeoff.repository;

import com.easytimeoff.domain.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, String> {
    
    List<Team> findByNameContainingIgnoreCase(String name);
    List<Team> findByType(Team.TeamType type);
    List<Team> findByCreatedBy(String createdBy);
    List<Team> findByTypeAndCreatedBy(Team.TeamType type, String createdBy);
}
