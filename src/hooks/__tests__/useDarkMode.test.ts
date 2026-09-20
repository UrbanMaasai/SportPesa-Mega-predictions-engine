/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from '../useDarkMode';

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with false when no localStorage value exists', () => {
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(false);
  });

  it('should initialize with true when localStorage has true', () => {
    localStorage.setItem('mjp_dark_mode', 'true');
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(true);
  });

  it('should toggle dark mode state', () => {
    const { result } = renderHook(() => useDarkMode());
    
    expect(result.current.isDark).toBe(false);
    
    act(() => {
      result.current.toggleDark();
    });
    
    expect(result.current.isDark).toBe(true);
  });

  it('should persist to localStorage on toggle', () => {
    const { result } = renderHook(() => useDarkMode());
    
    act(() => {
      result.current.toggleDark();
    });
    
    expect(localStorage.getItem('mjp_dark_mode')).toBe('true');
  });

  it('should apply dark class to documentElement', () => {
    const { result } = renderHook(() => useDarkMode());
    
    act(() => {
      result.current.toggleDark();
    });
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
