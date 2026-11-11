import { describe, expect, it } from 'vitest';

import { ownerInitials } from './format';

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
