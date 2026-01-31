package com.easytimeoff.repository;

import com.easytimeoff.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.displayName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.employeeID) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<User> search(@Param("query") String query);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.displayName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.employeeID) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<User> search(@Param("query") String query, Pageable pageable);
    
    User findByEmail(String email);
}
