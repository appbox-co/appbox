"use client"

import { Button } from "@/components/ui/button"
import { captureEvent } from "@/lib/posthog"

export function PosthogExample() {
  const handleClick = () => {
    // Track the button click event
    captureEvent("example_button_clicked", {
      location: "example_component",
      timestamp: new Date().toISOString()
    })

    // You could also add your business logic here
    console.log("Button clicked!")
  }

  return (
    <div className="my-4">
      <Button onClick={handleClick}>Track Click Event</Button>
    </div>
  )
}
