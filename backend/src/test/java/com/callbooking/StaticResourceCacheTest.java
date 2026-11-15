package com.callbooking;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * Guards the caching policy from #53: content-hashed files under /assets can be
 * cached for a year, while every other static file must be revalidated so a
 * deployment is picked up by browsers.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class StaticResourceCacheTest {

    private static final Path DATABASE_FILE = createDatabaseFile();

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("app.database-path", DATABASE_FILE::toString);
        registry.add("app.seed-demo-data", () -> "false");
    }

    @Autowired
    private TestRestTemplate rest;

    @Test
    void servesHashedAssetsWithALongImmutableCache() {
        ResponseEntity<String> response = rest.getForEntity("/assets/test-asset.js", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CACHE_CONTROL))
                .contains("max-age=31536000")
                .contains("public")
                .contains("immutable");
    }

    @Test
    void asksTheBrowserToRevalidateOtherStaticFiles() {
        ResponseEntity<String> response = rest.getForEntity("/robots.txt", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CACHE_CONTROL)).contains("no-cache");
    }

    @Test
    void servesTheSpaShellWithRevalidation() {
        ResponseEntity<String> response = rest.getForEntity("/", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("Callbook test shell");
        assertThat(response.getHeaders().getFirst(HttpHeaders.CACHE_CONTROL)).contains("no-cache");
    }

    private static Path createDatabaseFile() {
        try {
            Path directory = Files.createTempDirectory("call-booking-cache-test");
            Path file = directory.resolve("call-booking.db");
            file.toFile().deleteOnExit();
            directory.toFile().deleteOnExit();
            return file;
        } catch (IOException error) {
            throw new IllegalStateException("Cannot create the test database file", error);
        }
    }
}
