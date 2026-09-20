/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { getMatchExtraDetails } from '../matchDetails';
import type { Match } from '../../types';

describe('getMatchExtraDetails', () => {
  const mockMatch: Match = {
    match_no: '1',
    home: 'Arsenal',
    away: 'Chelsea',
    league: 'Premier League',
    time: '15:00',
    id: 1
  };

  it('should return match extra details object with all required fields', () => {
    const details = getMatchExtraDetails(mockMatch);
    
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

  it('should return stadium info for Arsenal', () => {
    const details = getMatchExtraDetails(mockMatch);
    expect(details.stadium).toBe('Emirates Stadium');
    expect(details.city).toBe('London, UK');
  });

  it('should return valid referee data', () => {
    const details = getMatchExtraDetails(mockMatch);
    expect(details.referee).toBeTruthy();
    expect(details.refereeRole).toBeTruthy();
    expect(details.refereeCardsAvg).toMatch(/\d+\.\d+ Y \/ \d+\.\d+ R/);
  });

  it('should return broadcast channels as array', () => {
    const details = getMatchExtraDetails(mockMatch);
    expect(Array.isArray(details.broadcastChannels)).toBe(true);
    expect(details.broadcastChannels.length).toBeGreaterThan(0);
  });

  it('should handle different match IDs consistently', () => {
    const match1: Match = { ...mockMatch, id: 1, match_no: '1' };
    const match2: Match = { ...mockMatch, id: 2, match_no: '2' };
    
    const details1 = getMatchExtraDetails(match1);
    const details2 = getMatchExtraDetails(match2);
    
    // Different match IDs should potentially give different results
    expect(details1).toBeDefined();
    expect(details2).toBeDefined();
  });
});
