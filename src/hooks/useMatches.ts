/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { Match } from '../types';

/**
 * Custom hook for managing matches data fetching state.
 * Handles loading and error states with external update capability.
 * 
 * @param initialMatches - Optional initial matches array
 * @returns Object containing matches state and manipulation functions
 */
export function useMatches(initialMatches: Match[] = []) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateMatches = useCallback((newMatches: Match[]) => {
    setMatches(newMatches);
  }, []);

  const addMatch = useCallback((match: Match) => {
    setMatches(prev => [...prev, match]);
  }, []);

  const removeMatch = useCallback((matchNo: string) => {
    setMatches(prev => prev.filter(m => m.match_no !== matchNo));
  }, []);

  const clearMatches = useCallback(() => {
    setMatches([]);
  }, []);

  return {
    matches,
    loading,
    error,
    setLoading,
    setError,
    updateMatches,
    addMatch,
    removeMatch,
    clearMatches
  };
}
