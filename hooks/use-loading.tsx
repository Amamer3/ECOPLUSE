"use client"

import React, { createContext, useContext, useMemo, useState } from "react"

type LoadingContextValue = {
  isLoading: boolean
  message?: string
  showLoading: (message?: string) => void
  hideLoading: () => void
  withLoading: <T>(fn: () => Promise<T>, message?: string) => Promise<T>
}

const LoadingContext = createContext<LoadingContextValue | null>(null)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | undefined>(undefined)

  const showLoading = (msg?: string) => {
    setMessage(msg)
    setIsLoading(true)
  }

  const hideLoading = () => {
    setIsLoading(false)
    setMessage(undefined)
  }

  const withLoading = async <T,>(fn: () => Promise<T>, msg?: string): Promise<T> => {
    try {
      showLoading(msg)
      const result = await fn()
      return result
    } finally {
      hideLoading()
    }
  }

  const value = useMemo(
    () => ({ isLoading, message, showLoading, hideLoading, withLoading }),
    [isLoading, message]
  )

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  )
}

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext)
  if (!ctx) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return ctx
}