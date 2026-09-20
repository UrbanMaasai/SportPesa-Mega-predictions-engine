/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';

/** Smart filter type */
export type SmartFilter = 'all' | 'favorites' | 'volatile' | 'draws' | 'value';

/**
 * Custom hook for managing match filters state.
 * Handles search query, league filter, and smart filter state.
 * 
 * @returns Object containing filter state and manipulation functions
 */
export function useMatchFilters() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [leagueFilter, setLeagueFilter] = useState<string>('All');
  const [smartFilter, setSmartFilter] = useState<SmartFilter>('all');

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setLeagueFilter('All');
    setSmartFilter('all');
  }, []);

  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const updateLeagueFilter = useCallback((league: string) => {
    setLeagueFilter(league);
  }, []);

  const updateSmartFilter = useCallback((filter: SmartFilter) => {
    setSmartFilter(filter);
  }, []);

  return {
    searchQuery,
    leagueFilter,
    smartFilter,
    resetFilters,
    updateSearchQuery,
    updateLeagueFilter,
    updateSmartFilter
  };
}
