package com.callbooking.config;

import java.time.Duration;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * The Vite dev server runs on :5173 and proxies /api by default. CORS is enabled
 * as a convenience for running the generated frontend directly against :8080.
 *
 * <p>Vite emits content-hashed file names under /assets, so those files can be
 * cached for a year and served without revalidation. Everything else (including
 * index.html) keeps the default no-cache policy from {@code application.yml}:
 * the shell must be revalidated so a new deployment is picked up.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173", "http://127.0.0.1:5173")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // The location mirrors the default spring.web.resources.static-locations
        // (classpath:/static/); keep the two in sync if the static root changes.
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
    }
}
