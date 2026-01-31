package com.easytimeoff.repository;

import com.easytimeoff.domain.Pod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PodRepository extends JpaRepository<Pod, String> {
    List<Pod> findByNameContainingIgnoreCase(String query);
}
