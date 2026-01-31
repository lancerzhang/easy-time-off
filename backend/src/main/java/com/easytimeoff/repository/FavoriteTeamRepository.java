package com.easytimeoff.repository;

import com.easytimeoff.domain.FavoriteTeam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteTeamRepository extends JpaRepository<FavoriteTeam, String> {
    List<FavoriteTeam> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<FavoriteTeam> findByUserIdAndTeamId(String userId, String teamId);
}
