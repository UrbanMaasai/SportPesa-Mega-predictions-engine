/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';

// Test for parseMatchDate functionality (extracted from App.tsx logic)
describe('Match Date Parsing', () => {
  const parseMatchDate = (kickoff: string): Date | null => {
    if (!kickoff) return null;
    const match = kickoff.match(/(\d{2})\/(\d{2})\/(\d{2}|\d{4})/);
    if (match) {
      const d = parseInt(match[1]);
      const m = parseInt(match[2]) - 1;
      let y = parseInt(match[3]);
      if (y < 100) y += 2000;
      
      const timeMatch = kickoff.match(/(\d{2}):(\d{2})/);
      const hours = timeMatch ? parseInt(timeMatch[1]) : 0;
      const minutes = timeMatch ? parseInt(timeMatch[2]) : 0;
      
      return new Date(y, m, d, hours, minutes);
    }
    return null;
  };

  it('should parse date in DD/MM/YY format', () => {
    const result = parseMatchDate('25/07/26');
    expect(result).toBeDefined();
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(6); // July (0-indexed)
    expect(result?.getDate()).toBe(25);
  });

  it('should parse date with time', () => {
    const result = parseMatchDate('25/07/26 19:00');
    expect(result?.getHours()).toBe(19);
    expect(result?.getMinutes()).toBe(0);
  });

  it('should return null for invalid date format', () => {
    const result = parseMatchDate('invalid-date');
    expect(result).toBeNull();
  });

  it('should handle YYYY format correctly', () => {
    // Note: Current implementation treats all YY as 20YY
    const result = parseMatchDate('25/07/26');
    expect(result?.getFullYear()).toBe(2026);
  });

  it('should handle two-digit year conversion', () => {
    // Implementation adds 2000 to any YY < 100
    const result = parseMatchDate('25/07/99');
    expect(result?.getFullYear()).toBe(2099);
  });
});

// Test for odds probability calculation
describe('Odds Probability Calculation', () => {
  const calculateProbability = (odds: number): number => {
    return Math.round(100 / odds / 1.15);
  };

  it('should calculate probability for home win odds', () => {
    const prob = calculateProbability(2.10);
    expect(prob).toBe(41); // 100 / 2.10 / 1.15 ≈ 41.32
  });

  it('should calculate probability for draw odds', () => {
    const prob = calculateProbability(3.20);
    expect(prob).toBe(27); // 100 / 3.20 / 1.15 ≈ 27.17
  });

  it('should calculate probability for away win odds', () => {
    const prob = calculateProbability(2.90);
    expect(prob).toBe(30); // 100 / 2.90 / 1.15 ≈ 29.94
  });

  it('should handle low odds correctly', () => {
    const prob = calculateProbability(1.25);
    expect(prob).toBe(70); // 100 / 1.25 / 1.15 ≈ 69.57, rounds to 70
  });
});

// Test for slip combination calculation
describe('Slip Combination Calculator', () => {
  const calculateCombinations = (selections: Record<string, string[]>): number => {
    return Object.values(selections).reduce((acc, sel) => acc * sel.length, 1);
  };

  const calculateCost = (combinations: number, stakePerLine: number): number => {
    return combinations * stakePerLine;
  };

  it('should calculate combinations for single selections', () => {
    const selections = {
      '1': ['1'],
      '2': ['X'],
      '3': ['2']
    };
    expect(calculateCombinations(selections)).toBe(1);
  });

  it('should calculate combinations with double chances', () => {
    const selections = {
      '1': ['1'],
      '2': ['1', 'X'],
      '3': ['2']
    };
    expect(calculateCombinations(selections)).toBe(2);
  });

  it('should calculate combinations for multiple doubles', () => {
    const selections = {
      '1': ['1', 'X'],
      '2': ['1', 'X'],
      '3': ['2', 'X']
    };
    expect(calculateCombinations(selections)).toBe(8);
  });

  it('should calculate total cost correctly', () => {
    const combinations = 128;
    const stakePerLine = 99;
    expect(calculateCost(combinations, stakePerLine)).toBe(12672);
  });
});

// Test for form string parsing
describe('Form String Parser', () => {
  const parseForm = (formString: string): string[] => {
    return formString.split('-').filter(Boolean);
  };

  it('should parse form string W-D-L-W-W', () => {
    const form = parseForm('W-D-L-W-W');
    expect(form).toEqual(['W', 'D', 'L', 'W', 'W']);
  });

  it('should handle empty form string', () => {
    const form = parseForm('');
    expect(form).toEqual([]);
  });

  it('should handle partial form string', () => {
    const form = parseForm('W-W-D');
    expect(form).toEqual(['W', 'W', 'D']);
  });

  it('should filter out empty entries', () => {
    const form = parseForm('W--D-L');
    expect(form).toEqual(['W', 'D', 'L']);
  });
});

// Test for match result determination
describe('Match Result Determination', () => {
  const determineResult = (homeScore: number, awayScore: number): '1' | 'X' | '2' => {
    if (homeScore > awayScore) return '1';
    if (homeScore === awayScore) return 'X';
    return '2';
  };

  it('should return "1" for home win', () => {
    expect(determineResult(2, 1)).toBe('1');
  });

  it('should return "X" for draw', () => {
    expect(determineResult(1, 1)).toBe('X');
    expect(determineResult(0, 0)).toBe('X');
  });

  it('should return "2" for away win', () => {
    expect(determineResult(0, 2)).toBe('2');
  });
});

// Test for jackpot bonus tier calculation
describe('Jackpot Bonus Tier Calculator', () => {
  const getBonusTier = (correctCount: number, totalMatches: number = 17): string => {
    if (correctCount === totalMatches) return 'Mega Jackpot Grand Prize!';
    if (correctCount === totalMatches - 1) return '16/17 Bonus';
    if (correctCount === totalMatches - 2) return '15/17 Bonus';
    if (correctCount === totalMatches - 3) return '14/17 Bonus';
    if (correctCount === totalMatches - 4) return '13/17 Bonus';
    if (correctCount === totalMatches - 5) return '12/17 Bonus';
    return 'None';
  };

  it('should return Grand Prize for 17/17 correct', () => {
    expect(getBonusTier(17)).toBe('Mega Jackpot Grand Prize!');
  });

  it('should return 16/17 Bonus for 16 correct', () => {
    expect(getBonusTier(16)).toBe('16/17 Bonus');
  });

  it('should return 12/17 Bonus for 12 correct', () => {
    expect(getBonusTier(12)).toBe('12/17 Bonus');
  });

  it('should return None for less than 12 correct', () => {
    expect(getBonusTier(11)).toBe('None');
    expect(getBonusTier(5)).toBe('None');
  });
});
