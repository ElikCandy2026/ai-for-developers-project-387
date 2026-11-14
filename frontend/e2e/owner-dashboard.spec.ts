import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchAvailability, firstAvailableSlot, listMeetingTypes } from './api';

type Bounds = {
  left: number;
  right: number;
};

type LayoutMetrics = {
  viewportWidth: number;
  scrollWidth: number;
  profile: Bounds | null;
  cards: Bounds[];
  rows: Bounds[];
};

const SUBPIXEL_TOLERANCE = 1;

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 320, height: 812 },
  { width: 768, height: 1024 },
];

const LONG_GUEST_NAME = 'Анастасия Константинопольская';
const LONG_GUEST_EMAIL = 'anastasia.konstantinopolskaya@example.com';
const LONG_DESCRIPTION = `Интеграция, сроки и бюджет проекта. ${'Подробноеописание'.repeat(6)}`;
const LONG_NOTE =
  'Обсудить интеграцию, сроки и бюджет проекта: ' +
  'https://example.com/integration/scope/timeline/budget/details';

async function seedMeetingTypeWithLongDescription(
  request: APIRequestContext,
  name: string,
): Promise<void> {
  const response = await request.post('/api/meeting-types', {
    data: {
      name,
      description: LONG_DESCRIPTION,
      durationMinutes: 30,
    },
  });
  expect(response.ok()).toBeTruthy();
}

async function seedBookingWithLongContacts(request: APIRequestContext): Promise<void> {
  for (const meetingType of await listMeetingTypes(request)) {
    const availability = await fetchAvailability(request, meetingType.id);
    const start = firstAvailableSlot(availability);
    if (!start) {
      continue;
    }

    const response = await request.post('/api/bookings', {
      data: {
        meetingTypeId: meetingType.id,
        start,
        guestName: LONG_GUEST_NAME,
        guestEmail: LONG_GUEST_EMAIL,
        notes: LONG_NOTE,
      },
    });
    expect(response.ok()).toBeTruthy();
    return;
  }

  throw new Error('No available slot to seed a booking with long contacts');
}

async function measureOwnerPage(page: Page): Promise<LayoutMetrics> {
  return page.evaluate(() => {
    const toBounds = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    };
    const profile = document.querySelector('.owner-profile-card');

    return {
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      profile: profile ? toBounds(profile) : null,
      cards: Array.from(
        document.querySelectorAll('.stat-card, .form-card, .bookings-card, .types-card'),
      ).map(toBounds),
      rows: Array.from(document.querySelectorAll('.booking-row, .type-list-row')).map(toBounds),
    };
  });
}

for (const viewport of VIEWPORTS) {
  test(`owner dashboard fits ${viewport.width}px without horizontal scrolling`, async ({
    page,
    request,
  }) => {
    const typeName = `Длинное описание ${viewport.width}`;
    await seedMeetingTypeWithLongDescription(request, typeName);
    await seedBookingWithLongContacts(request);

    await page.setViewportSize(viewport);
    await page.goto('/#owner');
    await expect(page.getByRole('heading', { name: 'Ваш календарь звонков' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Записаться' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Кабинет владельца' })).toBeVisible();
    await expect(page.locator('.booking-row').first()).toBeVisible();
    await expect(page.locator('.type-list-row', { hasText: typeName })).toBeVisible();
    await expect(
      page.locator('.booking-notes', { hasText: 'https://example.com' }).first(),
    ).toBeVisible();

    const geometry = await measureOwnerPage(page);

    expect(geometry.scrollWidth).toBeLessThanOrEqual(
      geometry.viewportWidth + SUBPIXEL_TOLERANCE,
    );
    expect(geometry.profile).not.toBeNull();
    expect(geometry.cards.length).toBeGreaterThan(0);
    expect(geometry.rows.length).toBeGreaterThan(0);

    const profile = geometry.profile;
    if (!profile) {
      throw new Error('The owner profile card is missing');
    }

    for (const bounds of [profile, ...geometry.cards, ...geometry.rows]) {
      expect(bounds.left).toBeGreaterThanOrEqual(-SUBPIXEL_TOLERANCE);
      expect(bounds.right).toBeLessThanOrEqual(geometry.viewportWidth + SUBPIXEL_TOLERANCE);
    }
  });
}
