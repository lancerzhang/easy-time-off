package com.easytimeoff;

import com.easytimeoff.domain.User;
import com.easytimeoff.web.UserController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class EasyTimeOffApplicationTests {

    @Autowired
    private UserController userController;

    @Test
    void contextLoads() {
        assertThat(userController).isNotNull();
    }

    @Test
    void testDataSeedingAndSearch() {
        // The DataInitializer should have run and populated the DB
        // search accepts (String query, List<String> ids). Passing null, null returns all users.
        List<User> users = userController.search(null, null);
        
        assertThat(users).isNotEmpty();
        assertThat(users).extracting(User::getDisplayName).contains("Alice Chen", "Bob Smith");
    }

    @Test
    void testLoginSimulation() {
        ResponseEntity<User> response = userController.login();
        
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        List<User> users = userController.search(null, null);
        assertThat(users).isNotEmpty();
        assertThat(users).extracting(User::getId).contains(response.getBody().getId());
    }
}
