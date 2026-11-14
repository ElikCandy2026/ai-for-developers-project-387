import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

type MeetingType = {
  id: string;
  name: string;
};

type Availability = {
  days: Array<{ slots: Array<{ start: string }> }>;
};

type Geometry = {
  viewportWidth: number;
  scrollWidth: number;
  profile: { left: number; right: number } | null;
  rows: Array<{ left: number; right: number }>;
};

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
];

const LONG_GUEST_NAME = 'Анастасия Константинопольская';
const LONG_GUEST_EMAIL = 'anastasia.konstantinopolskaya@example.com';

async function seedBookingWithLongContacts(request: APIRequestContext): Promise<void> {
  const typesResponse = await request.get('/api/meeting-types');
  expect(typesResponse.ok()).toBeTruthy();
  const meetingTypes = (await typesResponse.json()) as MeetingType[];
  expect(meetingTypes.length).toBeGreaterThan(0);

  for (const meetingType of meetingTypes) {
    const availabilityResponse = await request.get(
      `/api/meeting-types/${meetingType.id}/availability`,
    );
    expect(availabilityResponse.ok()).toBeTruthy();
    const availability = (await availabilityResponse.json()) as Availability;
    const firstSlot = availability.days.flatMap((day) => day.slots)[0];
    if (!firstSlot) {
      continue;
    }

    const bookingResponse = await request.post('/api/bookings', {
      data: {
        meetingTypeId: meetingType.id,
        start: firstSlot.start,
        guestName: LONG_GUEST_NAME,
        guestEmail: LONG_GUEST_EMAIL,
        notes: 'Обсудить интеграцию, сроки и бюджет проекта.',
      },
    });
    expect(bookingResponse.ok()).toBeTruthy();
    return;
  }

  throw new Error('No available slot to seed a booking with long contacts');
}

async function measureOwnerPage(page: Page): Promise<Geometry> {
  return page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const toBounds = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    };
    const profile = document.querySelector('.owner-profile-card');

    return {
      viewportWidth,
      scrollWidth: document.documentElement.scrollWidth,
      profile: profile ? toBounds(profile) : null,
      rows: Array.from(document.querySelectorAll('.booking-row')).map(toBounds),
    };
  });
}

for (const viewport of VIEWPORTS) {
  test(`owner dashboard fits ${viewport.width}px without horizontal scrolling`, async ({
    page,
    request,
  }) => {
    await seedBookingWithLongContacts(request);

    await page.setViewportSize(viewport);
    await page.goto('/#owner');
    await expect(page.getByRole('heading', { name: 'Ваш календарь звонков' })).toBeVisible();
    await expect(page.locator('.booking-row').first()).toBeVisible();

    const geometry = await measureOwnerPage(page);

    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.profile).not.toBeNull();
    expect(geometry.profile!.left).toBeGreaterThanOrEqual(-1);
    expect(geometry.profile!.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.rows.length).toBeGreaterThan(0);
    for (const row of geometry.rows) {
      expect(row.left).toBeGreaterThanOrEqual(-1);
      expect(row.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    }
  });
}
