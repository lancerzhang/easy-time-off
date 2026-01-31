package com.easytimeoff.service;

import com.easytimeoff.domain.*;
import com.easytimeoff.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final LeaveRepository leaveRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping initialization.");
            return;
        }

        log.info("Seeding Mock Data...");

        // 1. Create Users
        User u1 = User.builder().id("u1").employeeID("E001").displayName("Alice Chen").country("CN").email("alice@company.com").avatar("https://picsum.photos/seed/u1/200").teamId("pod1").build();
        User u2 = User.builder().id("u2").employeeID("E002").displayName("Bob Smith").country("US").email("bob@company.com").avatar("https://picsum.photos/seed/u2/200").teamId("pod1").build();
        User u3 = User.builder().id("u3").employeeID("E003").displayName("Charlie Kim").country("CN").email("charlie@company.com").avatar("https://picsum.photos/seed/u3/200").teamId("pod1").build();
        User u4 = User.builder().id("u4").employeeID("E004").displayName("Diana Prince").country("US").email("diana@company.com").avatar("https://picsum.photos/seed/u4/200").teamId("pod2").build();
        User u5 = User.builder().id("u5").employeeID("E005").displayName("Evan Wright").country("CN").email("evan@company.com").avatar("https://picsum.photos/seed/u5/200").teamId("pod2").build();
        
        userRepository.saveAll(Arrays.asList(u1, u2, u3, u4, u5));

        // 2. Create Teams
        Team pod1 = Team.builder().id("pod1").name("Checkout Pod").type(Team.TeamType.POD).memberIds(Set.of("u1", "u2", "u3")).build();
        Team pod2 = Team.builder().id("pod2").name("Inventory Pod").type(Team.TeamType.POD).memberIds(Set.of("u4", "u5")).build();
        Team vt1 = Team.builder().id("vt1").name("Backend Guild").type(Team.TeamType.VIRTUAL).memberIds(Set.of("u2", "u5")).build();

        teamRepository.saveAll(Arrays.asList(pod1, pod2, vt1));

        // 3. Create Leaves
        LeaveRecord l1 = LeaveRecord.builder().userId("u1").startDate(LocalDate.of(2026, 2, 10)).endDate(LocalDate.of(2026, 2, 12))
                .source(LeaveRecord.DataSource.MANUAL).status(LeaveRecord.LeaveStatus.APPROVED).note("Ski trip").build();
        
        LeaveRecord l2 = LeaveRecord.builder().userId("u2").startDate(LocalDate.of(2026, 2, 15)).endDate(LocalDate.of(2026, 2, 20))
                .source(LeaveRecord.DataSource.OUTLOOK).status(LeaveRecord.LeaveStatus.APPROVED).note("OOO: Conference").build();
        
        LeaveRecord l3 = LeaveRecord.builder().userId("u3").startDate(LocalDate.of(2026, 2, 1)).endDate(LocalDate.of(2026, 2, 28))
                .source(LeaveRecord.DataSource.HR).status(LeaveRecord.LeaveStatus.APPROVED).note("Sabbatical").build();

        leaveRepository.saveAll(Arrays.asList(l1, l2, l3));

        // Holidays are now loaded from JSON in Controller

        log.info("Mock Data Seeded Successfully.");
    }
}