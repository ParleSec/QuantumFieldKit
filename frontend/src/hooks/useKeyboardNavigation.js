import { useEffect, useCallback } from 'react';

export const useKeyboardNavigation = (options = {}) => {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    enabled = true,
    preventDefault = true,
  } = options;

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const { key, ctrlKey, metaKey, shiftKey } = event;

    // Handle different key combinations
    switch (key) {
      case 'Escape':
        if (onEscape) {
          if (preventDefault) event.preventDefault();
          onEscape(event);
        }
        break;
      
      case 'Enter':
        if (onEnter) {
          if (preventDefault) event.preventDefault();
          onEnter(event);
        }
        break;
      
      case 'ArrowUp':
        if (onArrowUp) {
          if (preventDefault) event.preventDefault();
          onArrowUp(event);
        }
        break;
      
      case 'ArrowDown':
        if (onArrowDown) {
          if (preventDefault) event.preventDefault();
          onArrowDown(event);
        }
        break;
      
      case 'ArrowLeft':
        if (onArrowLeft) {
          if (preventDefault) event.preventDefault();
          onArrowLeft(event);
        }
        break;
      
      case 'ArrowRight':
        if (onArrowRight) {
          if (preventDefault) event.preventDefault();
          onArrowRight(event);
        }
        break;
      
      case 'Tab':
        if (onTab) {
          if (preventDefault) event.preventDefault();
          onTab(event, shiftKey);
        }
        break;
      
      default:
        break;
    }

    // Handle common shortcuts
    if (ctrlKey || metaKey) {
      switch (key) {
        case 'k':
        case 'K':
          // Command palette shortcut
          if (options.onCommandPalette) {
            event.preventDefault();
            options.onCommandPalette(event);
          }
          break;
        
        case '/':
          // Search shortcut
          if (options.onSearch) {
            event.preventDefault();
            options.onSearch(event);
          }
          break;
        
        default:
          break;
      }
    }
  }, [
    enabled,
    preventDefault,
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    options.onCommandPalette,
    options.onSearch,
  ]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  return { handleKeyDown };
};

export default useKeyboardNavigation;
