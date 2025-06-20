import * as React from "react";

interface UseNavigationMenuAnimationOptions {
  /**
   * Duration of the animation in milliseconds
   * @default 300
   */
  animationDuration?: number;
  /**
   * Debounce time for state changes in milliseconds
   * @default 50
   */
  debounceTime?: number;
}

export function useNavigationMenuAnimation(
  options: UseNavigationMenuAnimationOptions = {}
) {
  const { animationDuration = 300, debounceTime = 50 } = options;
  
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [shouldPreventClick, setShouldPreventClick] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const startAnimation = React.useCallback(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    setIsAnimating(true);
    setShouldPreventClick(true);

    // Debounce to prevent rapid state changes
    timeoutRef.current = setTimeout(() => {
      setShouldPreventClick(false);
    }, debounceTime);

    // Clear animation state after full animation duration
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);
  }, [animationDuration, debounceTime]);

  const handleInteraction = React.useCallback(
    (event: React.MouseEvent, originalHandler?: (event: React.MouseEvent) => void) => {
      if (shouldPreventClick) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      originalHandler?.(event);
      return true;
    },
    [shouldPreventClick]
  );

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return {
    isAnimating,
    shouldPreventClick,
    startAnimation,
    handleInteraction,
  };
}
