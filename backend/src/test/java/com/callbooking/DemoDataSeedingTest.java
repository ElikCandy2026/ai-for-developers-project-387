package com.callbooking;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.web.context.WebServerInitializedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.callbooking.persistence.MeetingTypeRepository;

/**
 * Playwright starts the e2e suite as soon as the server answers, so demo data
 * must exist by the time the connector is up. Otherwise the first request for
 * meeting types can see a partially seeded database (#59).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(DemoDataSeedingTest.EventProbe.class)
class DemoDataSeedingTest {

    private static final Path DATABASE_FILE = createDatabaseFile();

    private static final List<Integer> COUNTS_AT_SERVER_START = new CopyOnWriteArrayList<>();

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("app.database-path", DATABASE_FILE::toString);
        registry.add("app.seed-demo-data", () -> "true");
    }

    @Autowired
    private MeetingTypeRepository repository;

    @Test
    void seedsDemoDataBeforeTheServerStartsAcceptingRequests() {
        assertThat(COUNTS_AT_SERVER_START).isNotEmpty();
        assertThat(COUNTS_AT_SERVER_START).allMatch(count -> count == 3);
        assertThat(repository.count()).isEqualTo(3);
    }

    @TestConfiguration
    static class EventProbe {

        @Bean
        ApplicationListener<WebServerInitializedEvent> seedingProbe(MeetingTypeRepository repository) {
            return event -> COUNTS_AT_SERVER_START.add(repository.count());
        }
    }

    private static Path createDatabaseFile() {
        try {
            Path directory = Files.createTempDirectory("call-booking-seeding-test");
            Path file = directory.resolve("call-booking.db");
            file.toFile().deleteOnExit();
            directory.toFile().deleteOnExit();
            return file;
        } catch (IOException error) {
            throw new IllegalStateException("Cannot create the test database file", error);
        }
    }
}
