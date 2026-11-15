import { describe, expect, it } from 'vitest';

import { formatDateRange, ownerInitials } from './format';

describe('formatDateRange', () => {
  it('uses the genitive month for a range inside one month', () => {
    expect(formatDateRange('2026-11-12', '2026-11-25')).toBe('12–25 ноября 2026');
  });

  it('uses the genitive month for both months across a month boundary', () => {
    expect(formatDateRange('2026-11-28', '2026-12-03')).toBe('28 ноября — 3 декабря 2026');
  });
});

describe('ownerInitials', () => {
  it('takes the first letters of the first two name parts in upper case', () => {
    expect(ownerInitials('Пафнутий Евлампиевич')).toBe('ПЕ');
  });

  it('ignores extra spaces and lower-case letters', () => {
    expect(ownerInitials('  мария   лебедева  ')).toBe('МЛ');
  });

  it('uses a single letter for a one-word name and nothing for an empty name', () => {
    expect(ownerInitials('Пафнутий')).toBe('П');
    expect(ownerInitials('')).toBe('');
  });
});
