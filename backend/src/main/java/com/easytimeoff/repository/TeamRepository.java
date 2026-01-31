package com.easytimeoff.repository;

import com.easytimeoff.domain.Team;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, String> {
    
    List<Team> findByNameContainingIgnoreCase(String name);
    Page<Team> findByNameContainingIgnoreCase(String name, Pageable pageable);

    List<Team> findByType(Team.TeamType type);
    Page<Team> findByType(Team.TeamType type, Pageable pageable);

    List<Team> findByCreatedBy(String createdBy);
    Page<Team> findByCreatedBy(String createdBy, Pageable pageable);

    List<Team> findByTypeAndCreatedBy(Team.TeamType type, String createdBy);
    Page<Team> findByTypeAndCreatedBy(Team.TeamType type, String createdBy, Pageable pageable);
}
