"use client"

import React from "react"
import { Spinner } from "@/components/ui/spinner"

export function LoadingOverlay({
  show,
  message,
}: {
  show: boolean
  message?: string
}) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-5 shadow-lg">
        <Spinner className="h-6 w-6 text-primary" />
        {message ? (
          <p className="text-sm text-muted-foreground font-medium">{message}</p>
        ) : null}
      </div>
    </div>
  )
}