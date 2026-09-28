import { describe, expect, it } from 'vitest';
import {
  buildDrugSearchText,
  formatDrugLocation,
  matchesDrugSearch,
  normalizeSearchValue,
} from '../src/lib/search';

const locations = {
  a3: { id: 'a3', label: 'Drawer A3' },
  fridge: { id: 'fridge', label: 'Main Fridge' },
};

const drug = {
  displayName: 'Glyceryl Trinitrate',
  aliases: ['GTN', 'Nitroglycerin'],
  strength: '400 micrograms',
  form: 'Spray',
  route: 'Sublingual',
  locationIds: ['a3'],
  locationNote: '',
};

describe('catalogue search', () => {
  it('normalizes punctuation, accents and case', () => {
    expect(normalizeSearchValue('  DÉPO–Medrone  ')).toBe('depo medrone');
  });

  it('matches aliases and locations', () => {
    expect(matchesDrugSearch(drug, 'gtn', locations)).toBe(true);
    expect(matchesDrugSearch(drug, 'drawer a3', locations)).toBe(true);
  });

  it('requires every search token', () => {
    expect(matchesDrugSearch(drug, 'spray 400', locations)).toBe(true);
    expect(matchesDrugSearch(drug, 'spray oral', locations)).toBe(false);
  });

  it('builds display locations with optional directions', () => {
    expect(formatDrugLocation({ ...drug, locationIds: ['a3', 'fridge'], locationNote: 'Top shelf' }, locations))
      .toBe('Drawer A3 · Main Fridge · Top shelf');
  });

  it('creates one normalized searchable string', () => {
    expect(buildDrugSearchText(drug, locations)).toContain('nitroglycerin');
  });
});

