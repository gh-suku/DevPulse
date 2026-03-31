// src/hooks/useKeyboardShortcuts.ts
// Issue #12: Add keyboard shortcuts for common actions
import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(({ key, ctrl, shift, alt, callback }) => {
        const ctrlMatch = ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
        const altMatch = alt ? event.altKey : !event.altKey;

        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          callback();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Common keyboard shortcuts
export const SHORTCUTS = {
  QUICK_ACTIONS: { key: 'k', ctrl: true, description: 'Quick actions' },
  CLOSE_MODAL: { key: 'Escape', description: 'Close modal' },
  NEW_TASK: { key: 'n', ctrl: true, description: 'New task' },
  NEW_GOAL: { key: 'g', ctrl: true, description: 'New goal' },
  SEARCH: { key: 'f', ctrl: true, description: 'Search' },
  SAVE: { key: 's', ctrl: true, description: 'Save' },
};
