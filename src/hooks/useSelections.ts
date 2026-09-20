/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing match selections state.
 * Handles localStorage persistence and provides CRUD operations.
 * 
 * @returns Object containing selections state and manipulation functions
 */
export function useSelections() {
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mjp_selections');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('mjp_selections', JSON.stringify(selections));
  }, [selections]);

  const updateSelection = useCallback((matchNo: string, outcomes: string[]) => {
    setSelections(prev => ({
      ...prev,
      [matchNo]: outcomes
    }));
  }, []);

  const clearSelection = useCallback((matchNo: string) => {
    setSelections(prev => {
      const updated = { ...prev };
      delete updated[matchNo];
      return updated;
    });
  }, []);

  const clearAllSelections = useCallback(() => {
    setSelections({});
  }, []);

  return {
    selections,
    updateSelection,
    clearSelection,
    clearAllSelections
  };
}
