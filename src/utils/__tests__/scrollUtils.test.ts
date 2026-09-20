/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  scrollToElement, 
  scrollToFirstMatch, 
  scrollToMatch, 
  scrollToOutcomesSection, 
  scrollToAnalysisPanel,
  getElementPosition,
  isElementVisible 
} from '../scrollUtils';

describe('scrollUtils', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('scrollToElement', () => {
    it('should scroll to element when it exists', () => {
      const mockElement = {
        scrollIntoView: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        }
      };
      
      document.getElementById = vi.fn().mockReturnValue(mockElement);
      
      scrollToElement('test-id');
      
      // Wait for setTimeout
      vi.advanceTimersByTime(150);
      
      expect(mockElement.scrollIntoView).toHaveBeenCalled();
      expect(mockElement.classList.add).toHaveBeenCalledWith('scroll-highlight');
    });

    it('should not error when element does not exist', () => {
      document.getElementById = vi.fn().mockReturnValue(null);
      
      expect(() => scrollToElement('non-existent')).not.toThrow();
    });
  });

  describe('scrollToFirstMatch', () => {
    it('should scroll to first match row when table exists', () => {
      const mockRow = {
        scrollIntoView: vi.fn()
      };
      
      const mockTbody = {
        querySelector: vi.fn().mockReturnValue(mockRow)
      };
      
      document.querySelector = vi.fn().mockImplementation((selector) => {
        if (selector === 'table tbody') return mockTbody;
        return null;
      });
      
      scrollToFirstMatch();
      
      expect(mockRow.scrollIntoView).toHaveBeenCalledWith({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    });

    it('should handle missing table gracefully', () => {
      document.querySelector = vi.fn().mockReturnValue(null);
      
      expect(() => scrollToFirstMatch()).not.toThrow();
    });
  });

  describe('scrollToMatch', () => {
    it('should scroll to specific match by number', () => {
      const mockElement = {
        scrollIntoView: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        }
      };
      
      document.getElementById = vi.fn().mockReturnValue(mockElement);
      
      scrollToMatch('5');
      
      expect(document.getElementById).toHaveBeenCalledWith('match-row-5');
    });
  });

  describe('getElementPosition', () => {
    it('should return position data for existing element', () => {
      const mockElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          top: 100,
          left: 50,
          width: 200,
          height: 100,
          bottom: 200,
          right: 250
        })
      };
      
      document.getElementById = vi.fn().mockReturnValue(mockElement);
      
      const position = getElementPosition('test-id');
      
      expect(position).toEqual({
        top: 100,
        left: 50,
        width: 200,
        height: 100,
        isVisible: true
      });
    });

    it('should return null for non-existent element', () => {
      document.getElementById = vi.fn().mockReturnValue(null);
      
      const position = getElementPosition('non-existent');
      
      expect(position).toBeNull();
    });
  });

  describe('isElementVisible', () => {
    it('should return true for visible element', () => {
      const mockElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          top: 100,
          left: 50,
          width: 200,
          height: 100,
          bottom: 200,
          right: 250
        })
      };
      
      document.getElementById = vi.fn().mockReturnValue(mockElement);
      Object.defineProperty(window, 'innerHeight', { value: 800 });
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      
      const visible = isElementVisible('test-id');
      
      expect(visible).toBe(true);
    });

    it('should return false for non-existent element', () => {
      document.getElementById = vi.fn().mockReturnValue(null);
      
      const visible = isElementVisible('non-existent');
      
      expect(visible).toBe(false);
    });
  });
});
