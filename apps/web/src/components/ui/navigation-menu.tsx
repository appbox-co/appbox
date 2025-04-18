import * as React from "react"
import { ChevronDownIcon } from "@radix-ui/react-icons"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Add this interface near the top of the file
interface MSNavigator extends Navigator {
  msMaxTouchPoints?: number
}

// Store touch detection in a React context instead of DOM dataset
const TouchDeviceContext = React.createContext(false)

// Custom hook to access touch device state
export function useTouchDevice() {
  return React.useContext(TouchDeviceContext)
}

// Move touch detection to a provider component
function TouchDeviceProvider({ children }: { children: React.ReactNode }) {
  const [isTouchDevice, setIsTouchDevice] = React.useState(false)

  // Use a ref to track if we've mounted to avoid hydration mismatches
  const hasMounted = React.useRef(false)

  React.useEffect(() => {
    // Mark as mounted
    hasMounted.current = true

    // Only run in browser
    if (typeof window === "undefined") return

    // Check if device supports touch events
    const checkTouch = () => {
      return (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        ((navigator as MSNavigator).msMaxTouchPoints ?? 0) > 0
      )
    }

    setIsTouchDevice(checkTouch())

    // Also listen for first touch event as a fallback
    const handleFirstTouch = () => {
      setIsTouchDevice(true)
      window.removeEventListener("touchstart", handleFirstTouch)
    }

    window.addEventListener("touchstart", handleFirstTouch, { once: true })

    return () => {
      window.removeEventListener("touchstart", handleFirstTouch)
    }
  }, [])

  return (
    <TouchDeviceContext.Provider value={isTouchDevice}>
      {children}
    </TouchDeviceContext.Provider>
  )
}

function NavigationMenu({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>) {
  // Use a single instance of TouchDeviceProvider
  return (
    <TouchDeviceProvider>
      <NavigationMenuPrimitive.Root
        data-slot="menu"
        className={cn(
          "relative z-10 flex max-w-max flex-1 items-center justify-center",
          "hover-trigger",
          className
        )}
        {...props}
      >
        {children}
        <NavigationMenuViewport />
      </NavigationMenuPrimitive.Root>
    </TouchDeviceProvider>
  )
}
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

function NavigationMenuList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="list"
      className={cn(
        "group flex flex-1 list-none items-center justify-center space-x-1",
        className
      )}
      {...props}
    />
  )
}
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-active:bg-accent/50 data-[state=open]:bg-accent/50 group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
)

function NavigationMenuTrigger({
  className,
  children,
  onClick,
  ...props
}: React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>) {
  // Use the touch device context
  const isTouchDevice = React.useContext(TouchDeviceContext)

  // Use a ref to track if we've mounted to avoid hydration mismatches
  const hasMounted = React.useRef(false)

  React.useEffect(() => {
    hasMounted.current = true
  }, [])

  // Handle click with touch device awareness - only after mounting
  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Only prevent default after client-side hydration
      if (hasMounted.current && !isTouchDevice) {
        e.preventDefault()
      }

      // Still call the original onClick if provided
      if (onClick) {
        onClick(e)
      }
    },
    [isTouchDevice, onClick]
  )

  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="trigger"
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      onClick={handleClick}
      {...props}
    >
      {children}{" "}
      <ChevronDownIcon
        className="relative top-px ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  )
}
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="content"
      className={cn(
        "data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 left-0 top-0 w-full md:absolute md:w-auto ",
        className
      )}
      {...props}
    />
  )
}
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = NavigationMenuPrimitive.Link

function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div className="absolute left-0 top-full z-50 flex justify-center">
      <NavigationMenuPrimitive.Viewport
        data-slot="viewport"
        className={cn(
          "origin-top-center bg-background/60 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border shadow-md backdrop-blur-sm md:w-[var(--radix-navigation-menu-viewport-width)]",
          className
        )}
        {...props}
      />
    </div>
  )
}
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="indicator"
      className={cn(
        "data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in top-full z-1 flex h-1.5 items-end justify-center overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="bg-border relative top-[60%] size-2 rotate-45 rounded-tl-sm shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  )
}
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport
}
