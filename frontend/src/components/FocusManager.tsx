import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * FocusManager Component
 * 
 * Ensures:
 * 1. No unnecessary input automatically receives focus on page load or route transition.
 * 2. When the user intentionally clicks an input, normal caret and typing work completely normally.
 * 3. When the user clicks outside an editable field (on cards, headings, buttons, dashboard sections,
 *    labels, or background), the input naturally loses focus and the blinking caret disappears.
 * 4. Non-editable elements cannot retain accidental text focus.
 * 5. Full keyboard accessibility (Tab, Enter, Escape, Arrow keys) is preserved.
 */
export const FocusManager: React.FC = () => {
  const location = useLocation();

  // Route change: clean up any lingering focus from the previous page
  useEffect(() => {
    const activeEl = document.activeElement;
    if (activeEl && activeEl !== document.body) {
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLButtonElement ||
        activeEl instanceof HTMLAnchorElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable)
      ) {
        activeEl.blur();
      }
    }
  }, [location.pathname, location.search]);

  // Click-outside listener: blur active editable inputs when clicking outside
  useEffect(() => {
    const isTargetEditable = (target: Node | null): boolean => {
      if (!target) return false;
      const el = target instanceof HTMLElement ? target : target.parentElement;
      if (!el) return false;

      // 1. Direct editable elements
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        return true;
      }
      if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
        return true;
      }

      // 2. Child inside an editable element or contenteditable
      if (el.closest('input, textarea, select, [contenteditable="true"]')) {
        return true;
      }

      // 3. Label explicitly associated with an input
      const label = el.closest('label');
      if (label) {
        const htmlFor = label.getAttribute('for') || (label as HTMLLabelElement).htmlFor;
        if (htmlFor) {
          const associatedInput = document.getElementById(htmlFor);
          if (
            associatedInput instanceof HTMLInputElement ||
            associatedInput instanceof HTMLTextAreaElement ||
            associatedInput instanceof HTMLSelectElement
          ) {
            return true;
          }
        }
        if (label.querySelector('input, textarea, select')) {
          return true;
        }
      }

      return false;
    };

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl instanceof HTMLInputElement ||
          activeEl instanceof HTMLTextAreaElement ||
          activeEl instanceof HTMLSelectElement ||
          (activeEl instanceof HTMLElement && activeEl.isContentEditable))
      ) {
        const target = event.target as Node | null;
        // If clicking outside the currently focused editable element
        if (target && !activeEl.contains(target)) {
          if (!isTargetEditable(target)) {
            activeEl.blur();
          }
        }
      }
    };

    // Keyboard Escape key dismisses focus from inputs
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const activeEl = document.activeElement;
        if (
          activeEl instanceof HTMLInputElement ||
          activeEl instanceof HTMLTextAreaElement
        ) {
          activeEl.blur();
        }
      }
    };

    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, { capture: true, passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, { capture: true } as any);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
};
