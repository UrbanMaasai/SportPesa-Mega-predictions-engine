/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useMemo } from 'react';

/** Sort direction type */
export type SortDirection = 'asc' | 'desc';

/**
 * Generic hook for managing sorting state and computation.
 * 
 * @template T - Type of data items to sort
 * @param initialField - Initial sort field (optional)
 * @param initialDirection - Initial sort direction (default: 'asc')
 * @returns Object containing sort state and sorted data computation
 */
export function useSort<T>(initialField?: keyof T, initialDirection: SortDirection = 'asc') {
  const [sortField, setSortField] = useState<keyof T | undefined>(initialField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  const toggleSort = useCallback((field: keyof T) => {
    setSortField(prevField => {
      if (prevField === field) {
        // Toggle direction if same field
        setSortDirection(prevDir => prevDir === 'asc' ? 'desc' : 'asc');
        return field;
      } else {
        // New field, reset to ascending
        setSortDirection('asc');
        return field;
      }
    });
  }, []);

  const clearSort = useCallback(() => {
    setSortField(undefined);
    setSortDirection('asc');
  }, []);

  const getSortedData = useCallback((data: T[]): T[] => {
    if (!sortField) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === bVal) {
        return 0;
      }

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [sortField, sortDirection]);

  return {
    sortField,
    sortDirection,
    toggleSort,
    clearSort,
    getSortedData
  };
}
