import { useEffect, useRef } from "react";

export interface Shortcut {
  /** Key value to match (e.g. "/", "p", "Escape") */
  key: string;
  /** Action to run when the shortcut fires. Return false to let the event propagate to other handlers. */
  action: () => void | boolean;
  /** Allow this shortcut to fire even when the user is typing in an input/textarea (default: false) */
  allowInInput?: boolean;
}

/**
 * Registers global keyboard shortcuts from a declarative list.
 *
 * Usage:
 *   useKeyboardShortcuts([
 *     { key: "/", action: openSearch },
 *     { key: "p", action: togglePositions },
 *     { key: "Escape", action: closePanel, allowInInput: true },
 *   ]);
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const ref = useRef(shortcuts);
  ref.current = shortcuts;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable;

      for (const shortcut of ref.current) {
        if (e.key !== shortcut.key) continue;

        // Skip non-allowInInput shortcuts when the user is focused in a text field
        if (isTyping && !shortcut.allowInInput) continue;

        // Skip when modifier keys are held (except for special keys like Escape)
        if (
          !shortcut.allowInInput &&
          (e.metaKey || e.ctrlKey || e.altKey)
        ) continue;

        const handled = shortcut.action();
        if (handled !== false) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);
}
