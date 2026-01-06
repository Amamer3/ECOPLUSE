"use client"

import { useState, useEffect } from "react"
import { AnalysisHistoryTable } from "@/components/analysis-history-table"
import { AnalysisTriggerDialog } from "@/components/analysis-trigger-dialog"
import { toast } from "sonner"

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyses()
  }, [])

  const fetchAnalyses = async () => {
    try {
      const response = await fetch("/api/analysis/list")
      if (!response.ok) throw new Error("Failed to fetch analyses")
      const data = await response.json()
      setAnalyses(data)
    } catch (error) {
      toast.error("Failed to load analysis history")
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (id: string) => {
    // Navigate to details page or open modal
    window.location.href = `/analysis/${id}`
  }

  const handleDownload = async (id: string) => {
    try {
      const response = await fetch(`/api/analysis/${id}/download`)
      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analysis-${id}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Download started")
    } catch (error) {
      toast.error("Failed to download analysis")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis History</h1>
          <p className="text-muted-foreground mt-2">View and manage your economic analyses</p>
        </div>
        <AnalysisTriggerDialog onSuccess={fetchAnalyses} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <AnalysisHistoryTable analyses={analyses} onViewDetails={handleViewDetails} onDownload={handleDownload} />
      )}
    </div>
  )
}
