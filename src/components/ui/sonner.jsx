"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      richColors
      position="top-right"
      closeButton
      duration={3000}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "pointer-events-auto transition-all duration-300 will-change-transform data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-right border shadow-lg",
          title: "font-semibold",
          description: "text-sm",
          actionButton: "transition-transform hover:scale-105",
          cancelButton: "transition-transform hover:scale-105",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)"
        }
      }
      {...props} />
  );
}

export { Toaster }
