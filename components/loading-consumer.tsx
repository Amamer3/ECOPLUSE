"use client"

import React from "react"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { useLoading } from "@/hooks/use-loading"

export function LoadingConsumer() {
  const { isLoading, message } = useLoading()
  return <LoadingOverlay show={isLoading} message={message} />
}