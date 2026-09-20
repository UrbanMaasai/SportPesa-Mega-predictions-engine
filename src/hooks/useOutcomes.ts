/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';

/** Type for outcome values */
type OutcomeValue = '1' | 'X' | '2';

/**
 * Custom hook for managing actual outcomes/resolutions state.
 * Persists to localStorage and provides type-safe interface.
 * 
 * @returns Object containing outcomes state and update function
 */
export function useOutcomes() {
  const [outcomes, setOutcomes] = useState<Record<string, OutcomeValue>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mjp_outcomes');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('mjp_outcomes', JSON.stringify(outcomes));
  }, [outcomes]);

  const updateOutcome = useCallback((matchNo: string, outcome: OutcomeValue) => {
    setOutcomes(prev => ({
      ...prev,
      [matchNo]: outcome
    }));
  }, []);

  const clearOutcome = useCallback((matchNo: string) => {
    setOutcomes(prev => {
      const updated = { ...prev };
      delete updated[matchNo];
      return updated;
    });
  }, []);

  const clearAllOutcomes = useCallback(() => {
    setOutcomes({});
  }, []);

  return {
    outcomes,
    updateOutcome,
    clearOutcome,
    clearAllOutcomes
  };
}
