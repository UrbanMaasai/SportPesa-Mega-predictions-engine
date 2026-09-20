/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { getMatchExtraDetails } from '../utils/matchDetails';
import type { Match } from '../types';

describe('getMatchExtraDetails', () => {
  const createMockMatch = (overrides: Partial<Match> = {}): Match => ({
    id: 1,
    match_no: '1',
    kickoff: '2024-01-15T15:00:00Z',
    home: 'Arsenal',
    away: 'Chelsea',
    odds: { '1': 2.1, 'X': 3.2, '2': 3.5 },
    ...overrides
  });

  it('should return all required fields for a match', () => {
    const match = createMockMatch();
    const details = getMatchExtraDetails(match);

    expect(details).toHaveProperty('referee');
    expect(details).toHaveProperty('refereeRole');
    expect(details).toHaveProperty('refereeCardsAvg');
    expect(details).toHaveProperty('stadium');
    expect(details).toHaveProperty('capacity');
    expect(details).toHaveProperty('city');
    expect(details).toHaveProperty('pitchType');
    expect(details).toHaveProperty('broadcast');
    expect(details).toHaveProperty('broadcastChannels');
    expect(details).toHaveProperty('weather');
    expect(details).toHaveProperty('temperature');
    expect(details).toHaveProperty('keyH2HNote');
  });

  it('should return correct stadium for Arsenal', () => {
    const match = createMockMatch({ home: 'Arsenal' });
    const details = getMatchExtraDetails(match);

    expect(details.stadium).toBe('Emirates Stadium');
    expect(details.city).toBe('London, UK');
  });

  it('should return correct stadium for Manchester City', () => {
    const match = createMockMatch({ home: 'Manchester City' });
    const details = getMatchExtraDetails(match);

    expect(details.stadium).toBe('Etihad Stadium');
  });

  it('should return correct stadium for Liverpool', () => {
    const match = createMockMatch({ home: 'Liverpool' });
    const details = getMatchExtraDetails(match);

    expect(details.stadium).toBe('Anfield');
  });

  it('should return correct stadium for Gor Mahia', () => {
    const match = createMockMatch({ home: 'Gor Mahia' });
    const details = getMatchExtraDetails(match);

    expect(details.stadium).toBe('Kasarani Stadium');
    expect(details.city).toBe('Nairobi, Kenya');
  });

  it('should return consistent details for the same match ID', () => {
    const match1 = createMockMatch({ id: 5, match_no: '5' });
    const match2 = createMockMatch({ id: 5, match_no: '5' });

    const details1 = getMatchExtraDetails(match1);
    const details2 = getMatchExtraDetails(match2);

    expect(details1).toEqual(details2);
  });

  it('should return different details for different match IDs', () => {
    const match1 = createMockMatch({ id: 1 });
    const match2 = createMockMatch({ id: 2 });

    const details1 = getMatchExtraDetails(match1);
    const details2 = getMatchExtraDetails(match2);

    // At least some properties should be different due to seeded randomization
    expect(
      details1.referee !== details2.referee ||
      details1.weather !== details2.weather ||
      details1.stadium !== details2.stadium
    ).toBe(true);
  });

  it('should handle missing match ID by using match_no', () => {
    const match = createMockMatch({ id: 0, match_no: '10' });
    const details = getMatchExtraDetails(match);

    expect(details).toBeDefined();
    expect(details.stadium).toBeTruthy();
  });

  it('should include broadcast channels as an array', () => {
    const match = createMockMatch();
    const details = getMatchExtraDetails(match);

    expect(Array.isArray(details.broadcastChannels)).toBe(true);
    expect(details.broadcastChannels.length).toBeGreaterThan(0);
  });

  it('should return temperature with humidity and wind info', () => {
    const match = createMockMatch();
    const details = getMatchExtraDetails(match);

    expect(details.temperature).toMatch(/°C/);
    expect(details.temperature).toMatch(/Humidity/);
  });
});
