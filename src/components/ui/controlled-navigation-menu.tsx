import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { ChevronDownIcon } from "lucide-react";
import {
  ComponentProps,
  createContext,
  MouseEvent,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "~/lib/utils";

interface ControlledNavigationMenuProps
  extends ComponentProps<typeof NavigationMenuPrimitive.Root> {
  viewport?: boolean;
  /**
   * Duration to wait before allowing state changes during animations
   * @default 150
   */
  animationDebounce?: number;
}

const ControlledNavigationMenuContext = createContext<{
  isAnimating: boolean;
  preventClick: boolean;
  startAnimation: () => void;
} | null>(null);

function ControlledNavigationMenu({
  className,
  children,
  viewport = true,
  animationDebounce = 150,
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  ...props
}: ControlledNavigationMenuProps) {
  const [internalValue, setInternalValue] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [preventClick, setPreventClick] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const value = controlledValue ?? internalValue;
  const onValueChange = controlledOnValueChange ?? setInternalValue;

  const startAnimation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsAnimating(true);
    setPreventClick(true);

    timeoutRef.current = setTimeout(() => {
      setPreventClick(false);
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, 150); // Additional time for animation to complete
    }, animationDebounce);
  }, [animationDebounce]);

  const handleValueChange = useCallback(
    (newValue: string) => {
      if (preventClick && newValue !== value) {
        return; // Prevent value changes during animation debounce
      }
      startAnimation();
      onValueChange(newValue);
    },
    [preventClick, value, onValueChange, startAnimation],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      isAnimating,
      preventClick,
      startAnimation,
    }),
    [isAnimating, preventClick, startAnimation],
  );

  return (
    <ControlledNavigationMenuContext value={contextValue}>
      <NavigationMenuPrimitive.Root
        data-slot="navigation-menu"
        data-viewport={viewport}
        className={cn(
          "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
          className,
        )}
        value={value}
        onValueChange={handleValueChange}
        {...props}
      >
        {children}
        {viewport && <ControlledNavigationMenuViewport />}
      </NavigationMenuPrimitive.Root>
    </ControlledNavigationMenuContext>
  );
}

function ControlledNavigationMenuTrigger({
  className,
  children,
  onClick,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  const context = use(ControlledNavigationMenuContext);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (context?.preventClick) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClick?.(event);
    },
    [context?.preventClick, onClick],
  );

  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(
        "group bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[state=open]:hover:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:focus:bg-accent data-[state=open]:bg-accent/50 focus-visible:ring-ring/50 inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50",
        "group",
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {children}{" "}
      <ChevronDownIcon
        className="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  );
}

function ControlledNavigationMenuViewport({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div className={cn("absolute top-full left-0 isolate z-50 flex justify-center")}>
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "origin-top-center bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border shadow md:w-[var(--radix-navigation-menu-viewport-width)]",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export {
  ControlledNavigationMenu,
  ControlledNavigationMenuTrigger,
  ControlledNavigationMenuViewport,
};
