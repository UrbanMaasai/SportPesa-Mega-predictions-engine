/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { getLeagueStats } from './leagueData';

describe('getLeagueStats', () => {
  it('should return league stats with all required properties', () => {
    const stats = getLeagueStats('Premier League', 'Arsenal', 'Chelsea');

    expect(stats).toHaveProperty('leagueName');
    expect(stats).toHaveProperty('standings');
    expect(stats).toHaveProperty('topScorers');
    expect(stats.leagueName).toBe('Premier League');
  });

  it('should generate correct number of teams for Premier League (20 teams)', () => {
    const stats = getLeagueStats('Premier League', 'Arsenal', 'Chelsea');

    expect(stats.standings.length).toBe(20);
  });

  it('should generate correct number of teams for Bundesliga (18 teams)', () => {
    const stats = getLeagueStats('Bundesliga', 'Bayern Munich', 'Dortmund');

    expect(stats.standings.length).toBe(18);
  });

  it('should place home team at specified rank', () => {
    const stats = getLeagueStats('Premier League', 'Arsenal', 'Chelsea', 1, 5);

    const arsenalEntry = stats.standings.find(s => s.team === 'Arsenal');
    expect(arsenalEntry?.position).toBe(1);
  });

  it('should place away team at specified rank', () => {
    const stats = getLeagueStats('Premier League', 'Arsenal', 'Chelsea', 1, 5);

    const chelseaEntry = stats.standings.find(s => s.team === 'Chelsea');
    expect(chelseaEntry?.position).toBe(5);
  });

  it('should include top scorers for Premier League', () => {
    const stats = getLeagueStats('Premier League', 'Arsenal', 'Chelsea');

    expect(stats.topScorers.length).toBeGreaterThan(0);
    expect(stats.topScorers[0]).toHaveProperty('name');
    expect(stats.topScorers[0]).toHaveProperty('team');
    expect(stats.topScorers[0]).toHaveProperty('goals');
  });

  it('should include Haaland as top scorer in Premier League', () => {
    const stats = getLeagueStats('Premier League', 'Man City', 'Liverpool');

    const haaland = stats.topScorers.find(s => s.name === 'Erling Haaland');
    expect(haaland).toBeDefined();
    expect(haaland?.team).toBe('Man City');
  });

  it('should ensure home team has a scorer represented', () => {
    const stats = getLeagueStats('Premier League', 'Arsenal', 'Chelsea');

    const hasHomeScorer = stats.topScorers.some(s => s.team === 'Arsenal');
    expect(hasHomeScorer).toBe(true);
  });

  it('should handle unknown league with generated data', () => {
    const stats = getLeagueStats('Unknown League', 'Team A', 'Team B');

    expect(stats.leagueName).toBe('Unknown League');
    expect(stats.standings.length).toBeGreaterThanOrEqual(18);
    expect(stats.topScorers.length).toBeGreaterThan(0);
  });

  it('should generate form data for each team', () => {
    const stats = getLeagueStats('Premier League', 'Arsenal', 'Chelsea');

    stats.standings.forEach(team => {
      expect(team.form).toBeDefined();
      expect(Array.isArray(team.form)).toBe(true);
      expect(team.form.length).toBeLessThanOrEqual(5);
    });
  });

  it('should use custom form settings when provided', () => {
    const stats = getLeagueStats('Premier League', 'Arsenal', 'Chelsea', 1, 2, 'W-W-W-D-W', 'L-L-D-L-W');

    const arsenalEntry = stats.standings.find(s => s.team === 'Arsenal');
    const chelseaEntry = stats.standings.find(s => s.team === 'Chelsea');

    expect(arsenalEntry?.form).toEqual(['W', 'W', 'W', 'D', 'W']);
    expect(chelseaEntry?.form).toEqual(['L', 'L', 'D', 'L', 'W']);
  });

  it('should calculate points correctly (3 for win, 1 for draw)', () => {
    const stats = getLeagueStats('Premier League', 'Arsenal', 'Chelsea');

    stats.standings.forEach(team => {
      const expectedPoints = team.won * 3 + team.drawn;
      expect(team.points).toBe(expectedPoints);
    });
  });

  it('should ensure played matches is consistent', () => {
    const stats = getLeagueStats('Premier League', 'Arsenal', 'Chelsea');

    stats.standings.forEach(team => {
      expect(team.played).toBe(32);
      expect(team.won + team.drawn + team.lost).toBeLessThanOrEqual(team.played);
    });
  });

  it('should position standings correctly by rank', () => {
    const stats = getLeagueStats('Premier League', 'Arsenal', 'Chelsea', 1, 20);

    expect(stats.standings[0].team).toBe('Arsenal');
    expect(stats.standings[19].team).toBe('Chelsea');
  });
});
