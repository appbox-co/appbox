import * as React from 'react'
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@radix-ui/react-icons'

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
    if (typeof window === 'undefined') return

    // Check if device supports touch events
    const checkTouch = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      )
    }

    setIsTouchDevice(checkTouch())

    // Also listen for first touch event as a fallback
    const handleFirstTouch = () => {
      setIsTouchDevice(true)
      window.removeEventListener('touchstart', handleFirstTouch)
    }

    window.addEventListener('touchstart', handleFirstTouch, { once: true })

    return () => {
      window.removeEventListener('touchstart', handleFirstTouch)
    }
  }, [])

  return (
    <TouchDeviceContext.Provider value={isTouchDevice}>
      {children}
    </TouchDeviceContext.Provider>
  )
}

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  // Use a single instance of TouchDeviceProvider
  return (
    <TouchDeviceProvider>
      <NavigationMenuPrimitive.Root
        ref={ref}
        className={cn(
          'relative z-10 flex max-w-max flex-1 items-center justify-center',
          'hover-trigger',
          className
        )}
        {...props}
      >
        {children}
        <NavigationMenuViewport />
      </NavigationMenuPrimitive.Root>
    </TouchDeviceProvider>
  )
})
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      'group flex flex-1 list-none items-center justify-center space-x-1',
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  'group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50'
)

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, onClick, ...props }, ref) => {
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
      ref={ref}
      className={cn(navigationMenuTriggerStyle(), 'group', className)}
      onClick={handleClick}
      {...props}
    >
      {children}{' '}
      <ChevronDownIcon
        className="relative top-[1px] ml-1 h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  )
})
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      'left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ',
      className
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = NavigationMenuPrimitive.Link

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className="absolute left-0 top-full flex justify-center z-50">
    <NavigationMenuPrimitive.Viewport
      className={cn(
        'origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-background/60 backdrop-blur text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]',
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      'top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in',
      className
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
))
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
  NavigationMenuViewport,
}
