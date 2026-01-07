"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AnalysisHistoryTable } from "@/components/analysis-history-table"
import { AnalysisTriggerDialog } from "@/components/analysis-trigger-dialog"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

const HISTORY_STORAGE_KEY = "analysisHistory"

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchAnalysesFromStorage()
  }, [searchParams?.get("country")])

  const fetchAnalysesFromStorage = () => {
    setLoading(true)
    try {
      console.log("[History] Reading from localStorage with key:", HISTORY_STORAGE_KEY)
      
      let allAnalyses: any[] = []

      // Try to read from analysisHistory first
      const storedData = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (storedData) {
        allAnalyses = JSON.parse(storedData)
        console.log("[History] Loaded", allAnalyses.length, "analyses from analysisHistory")
      } else {
        console.log("[History] analysisHistory not found, checking analysisPageData as fallback")
        
        // Fallback: check if there's a current analysis in analysisPageData
        const pageData = localStorage.getItem("analysisPageData")
        if (pageData) {
          try {
            const currentAnalysis = JSON.parse(pageData)
            if (currentAnalysis && currentAnalysis.data && currentAnalysis.full_analysis) {
              // Migrate current analysis to history
              const historyEntry = {
                id: currentAnalysis.data.indicator,
                ...currentAnalysis,
              }
              allAnalyses = [historyEntry]
              localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allAnalyses))
              console.log("[History] Migrated analysisPageData to analysisHistory")
            }
          } catch (parseError) {
            console.error("[History] Error parsing analysisPageData:", parseError)
          }
        } else {
          console.log("[History] No analyses found in either storage location")
        }
      }

      // Filter by country if selected
      const country = searchParams?.get("country")
      let filteredAnalyses = allAnalyses

      if (country) {
        filteredAnalyses = allAnalyses.filter(
          (analysis) => analysis.data?.country === country || analysis.country === country
        )
        console.log("[History] Filtered to", filteredAnalyses.length, "analyses for country:", country)
      }

      // Sort by creation date (newest first)
      filteredAnalyses.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt || 0).getTime()
        const dateB = new Date(b.timestamp || b.createdAt || 0).getTime()
        return dateB - dateA
      })

      // Transform data to match table format
      const transformedAnalyses = filteredAnalyses.map((analysis) => {
        const data = analysis.data || analysis
        return {
          id: analysis.id || data.indicator || "UNKNOWN",
          country: data.country || "UNKNOWN",
          indicator: data.indicator || "UNKNOWN",
          startDate: analysis.full_analysis?.metadata?.start_date || analysis.startDate || "N/A",
          endDate: analysis.full_analysis?.metadata?.end_date || analysis.endDate || "N/A",
          status: "completed" as const,
          createdAt: analysis.timestamp || analysis.createdAt || new Date().toISOString(),
          completedAt: analysis.timestamp || new Date().toISOString(),
          fullData: analysis, // Store full analysis for reference
        }
      })

      console.log("[History] Displaying", transformedAnalyses.length, "analyses")
      setAnalyses(transformedAnalyses)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load analysis history"
      console.error("[History] Storage read error:", errorMessage)
      toast.error(errorMessage)
      setAnalyses([])
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
      // Validate ID
      if (!id || typeof id !== "string" || id.trim() === "") {
        toast.error("Invalid analysis ID")
        return
      }

      console.log("[History] Downloading analysis:", id)

      // Find the analysis in localStorage
      const storedData = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (!storedData) {
        throw new Error("Analysis not found")
      }

      const allAnalyses = JSON.parse(storedData)
      const analysis = allAnalyses.find(
        (a: any) => a.id === id || a.data?.indicator === id
      )

      if (!analysis) {
        throw new Error("Analysis not found")
      }

      // Create and download JSON file
      const jsonString = JSON.stringify(analysis, null, 2)
      const blob = new Blob([jsonString], { type: "application/json; charset=utf-8" })

      if (!blob || blob.size === 0) {
        throw new Error("Download resulted in empty file")
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analysis-${id}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Download started")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to download analysis"
      console.error("[History] Download error:", errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleAnalysisSuccess = () => {
    // Refresh the list when a new analysis is triggered
    console.log("[History] Analysis success, refreshing list from storage")
    fetchAnalysesFromStorage()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis History</h1>
          <p className="text-muted-foreground mt-2">View and manage all analyses</p>
        </div>
        {/* <AnalysisTriggerDialog onSuccess={handleAnalysisSuccess} /> */}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Spinner className="h-8 w-8 mx-auto text-[#e15554]" />
            <p className="text-muted-foreground font-semibold">Loading analysis history...</p>
          </div>
        </div>
      ) : (
        <AnalysisHistoryTable analyses={analyses} onViewDetails={handleViewDetails} onDownload={handleDownload} />
      )}
    </div>
  )
}
