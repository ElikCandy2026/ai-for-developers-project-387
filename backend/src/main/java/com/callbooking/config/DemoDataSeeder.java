package com.callbooking.config;

import jakarta.annotation.PostConstruct;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.callbooking.application.MeetingTypeService;
import com.callbooking.persistence.MeetingTypeRepository;

/**
 * Optional demo content so a fresh checkout has something to show. It is only
 * added when the meeting type table is empty and can be disabled with
 * SEED_DEMO_DATA=false.
 *
 * <p>Seeding runs in {@code @PostConstruct} rather than as an {@code
 * ApplicationRunner}: the web server starts accepting connections before
 * runners execute, so the first request could see a half-seeded database
 * (#59). Bean initialization happens before the connector is up.
 */
@Component
@ConditionalOnProperty(prefix = "app", name = "seed-demo-data", havingValue = "true")
public class DemoDataSeeder {

    private final MeetingTypeRepository repository;
    private final MeetingTypeService meetingTypeService;

    public DemoDataSeeder(MeetingTypeRepository repository, MeetingTypeService meetingTypeService) {
        this.repository = repository;
        this.meetingTypeService = meetingTypeService;
    }

    @PostConstruct
    void seed() {
        if (repository.count() > 0) {
            return;
        }
        meetingTypeService.create(
                "Быстрый вопрос",
                "Пятнадцатиминутный звонок для короткого вопроса.",
                15);
        meetingTypeService.create(
                "Знакомство",
                "Короткий звонок, чтобы познакомиться и обсудить задачу.",
                30);
        meetingTypeService.create(
                "Консультация",
                "Подробный разбор вопроса и совместный план действий.",
                60);
    }
}
