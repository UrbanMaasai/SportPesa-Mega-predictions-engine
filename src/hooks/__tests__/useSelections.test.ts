/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelections } from '../useSelections';

describe('useSelections', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty object when no localStorage value exists', () => {
    const { result } = renderHook(() => useSelections());
    expect(result.current.selections).toEqual({});
  });

  it('should initialize from localStorage when value exists', () => {
    const savedSelections = { '1': ['1', 'X'], '2': ['2'] };
    localStorage.setItem('mjp_selections', JSON.stringify(savedSelections));
    
    const { result } = renderHook(() => useSelections());
    expect(result.current.selections).toEqual(savedSelections);
  });

  it('should update selection for a match', () => {
    const { result } = renderHook(() => useSelections());
    
    act(() => {
      result.current.updateSelection('1', ['1', 'X']);
    });
    
    expect(result.current.selections['1']).toEqual(['1', 'X']);
  });

  it('should persist selections to localStorage', () => {
    const { result } = renderHook(() => useSelections());
    
    act(() => {
      result.current.updateSelection('1', ['1']);
    });
    
    const stored = JSON.parse(localStorage.getItem('mjp_selections') || '{}');
    expect(stored['1']).toEqual(['1']);
  });

  it('should clear selection for a specific match', () => {
    const { result } = renderHook(() => useSelections());
    
    act(() => {
      result.current.updateSelection('1', ['1']);
      result.current.updateSelection('2', ['X']);
    });
    
    act(() => {
      result.current.clearSelection('1');
    });
    
    expect(result.current.selections['1']).toBeUndefined();
    expect(result.current.selections['2']).toEqual(['X']);
  });

  it('should clear all selections', () => {
    const { result } = renderHook(() => useSelections());
    
    act(() => {
      result.current.updateSelection('1', ['1']);
      result.current.updateSelection('2', ['X']);
    });
    
    act(() => {
      result.current.clearAllSelections();
    });
    
    expect(result.current.selections).toEqual({});
  });
});
