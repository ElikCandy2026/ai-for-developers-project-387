import { expect, type APIRequestContext } from '@playwright/test';

export type MeetingType = {
  id: string;
  name: string;
};

export type Availability = {
  days: Array<{ slots: Array<{ start: string }> }>;
};

export async function listMeetingTypes(request: APIRequestContext): Promise<MeetingType[]> {
  const response = await request.get('/api/meeting-types');
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as MeetingType[];
}

export async function fetchAvailability(
  request: APIRequestContext,
  meetingTypeId: string,
): Promise<Availability> {
  const response = await request.get(`/api/meeting-types/${meetingTypeId}/availability`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as Availability;
}

export function firstAvailableSlot(availability: Availability): string | undefined {
  return availability.days.flatMap((day) => day.slots)[0]?.start;
}
