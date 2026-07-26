/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility functions for smooth scrolling and element navigation
 */

export interface ScrollOptions {
  behavior?: 'smooth' | 'auto';
  block?: 'start' | 'center' | 'end' | 'nearest';
  inline?: 'start' | 'center' | 'end' | 'nearest';
}

/**
 * Scroll to a specific element by ID with smooth animation
 * @param elementId - The ID of the element to scroll to
 * @param options - Scroll options (default: smooth scroll to center)
 */
export const scrollToElement = (
  elementId: string,
  options: ScrollOptions = {
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  }
) => {
  const element = document.getElementById(elementId);
  if (element) {
    setTimeout(() => {
      element.scrollIntoView(options);
      // Add a subtle highlight effect
      element.classList.add('scroll-highlight');
      setTimeout(() => {
        element.classList.remove('scroll-highlight');
      }, 2000);
    }, 100);
  }
};

/**
 * Scroll to the first match table row
 */
export const scrollToFirstMatch = () => {
  const tableBody = document.querySelector('table tbody');
  const firstRow = tableBody?.querySelector('tr');
  if (firstRow) {
    firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

/**
 * Find and scroll to a specific match row by match number
 * @param matchNo - The match number to scroll to
 */
export const scrollToMatch = (matchNo: string) => {
  const matchId = `match-row-${matchNo}`;
  scrollToElement(matchId);
};

/**
 * Scroll to the outcomes/predictions section
 */
export const scrollToOutcomesSection = () => {
  const element = document.querySelector('[data-section="outcomes"]');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/**
 * Scroll to the analysis panel on the right sidebar
 */
export const scrollToAnalysisPanel = () => {
  const element = document.querySelector('[data-section="analysis"]');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/**
 * Get the viewport position of an element
 */
export const getElementPosition = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    isVisible: rect.top < window.innerHeight && rect.bottom > 0
  };
};

/**
 * Check if an element is visible in the viewport
 */
export const isElementVisible = (elementId: string): boolean => {
  const element = document.getElementById(elementId);
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
};
