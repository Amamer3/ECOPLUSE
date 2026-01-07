"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlayCircle } from "lucide-react"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { countries } from "@/lib/countries" 

const indicators = [
  { value: "GDP", label: "GDP Growth" },
  { value: "INFLATION", label: "Inflation Rate" },
  { value: "UNEMPLOYMENT", label: "Unemployment Rate" },
  { value: "INTEREST", label: "Interest Rate" },
  { value: "EXPORTS", label: "Export Volume" },
  { value: "IMPORTS", label: "Import Volume" },
]

interface AnalysisTriggerDialogProps {
  onSuccess?: (analysisData?: any) => void
}

export function AnalysisTriggerDialog({ onSuccess }: AnalysisTriggerDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [formData, setFormData] = useState({
    country: "",
    indicator: "",
    startDate: "",
    endDate: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.country || !formData.indicator || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields")
      return
    }

    // Validate dates
    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)

    if (isNaN(startDate.getTime())) {
      toast.error("Invalid start date")
      return
    }

    if (isNaN(endDate.getTime())) {
      toast.error("Invalid end date")
      return
    }

    if (startDate >= endDate) {
      toast.error("Start date must be before end date")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/analysis/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Server error: ${response.status}`
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      // Check for error in response
      if (result.error) {
        throw new Error(result.error)
      }

      console.log("[Trigger] Analysis started:", result)
      toast.success("Analysis started successfully")
      setOpen(false)
      setFormData({ country: "", indicator: "", startDate: "", endDate: "" })

      // If callback provided, use it (for detail page)
      if (onSuccess) {
        console.log("[Trigger] Calling onSuccess callback with data")
        onSuccess(result)
      } else {
        // Otherwise refresh page (for dashboard)
        console.log("[Trigger] No callback, refreshing page")
        setTimeout(() => {
          router.refresh()
        }, 300)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start analysis"
      console.error("[Trigger] Error:", errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlayCircle className="h-4 w-4" />
          Run Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Trigger Economic Analysis</DialogTitle>
          <DialogDescription>Configure and run a new time-series economic analysis</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="country">Country *</Label>
              <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="indicator">Economic Indicator *</Label>
              <Select
                value={formData.indicator}
                onValueChange={(value) => setFormData({ ...formData, indicator: value })}
              >
                <SelectTrigger id="indicator">
                  <SelectValue placeholder="Select an indicator" />
                </SelectTrigger>
                <SelectContent>
                  {indicators.map((indicator) => (
                    <SelectItem key={indicator.value} value={indicator.value}>
                      {indicator.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Starting...
                </>
              ) : (
                "Start Analysis"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
