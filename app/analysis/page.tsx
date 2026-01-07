"use client"

import { useState, useEffect } from "react"
import { AnalysisTriggerDialog } from "@/components/analysis-trigger-dialog"
import { BarChart3, Brain, Activity, DollarSign, TrendingUp, AlertCircle, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import dynamic from "next/dynamic"
const TrendLineChart = dynamic(() => import("@/components/charts/trend-line-chart").then(mod => mod.TrendLineChart), { ssr: false })
import { MetricsGrid, Metric } from "@/components/metrics-grid"
import { Spinner } from "@/components/ui/spinner"
import { useLoading } from "@/hooks/use-loading"

interface N8nSingleResponse {
    success: boolean
    data: {
        indicator: string
        country: string
        latest_value: number
        change_pct: string
        trend: string
        forecast_direction: string
        alert_count: number
    }
    full_analysis: {
        metadata: {
            series_id: string
            start_date: string
            end_date: string
            indicator_name: string
            country_name: string
        }
        statistics: {
            count: number
            mean: number
            min: number
            max: number
            latest: number
            previous: number
            std: number
            change: number
            change_pct: string
        }
        ai_analysis: {
            trend: string
            trend_strength: string
            trend_description: string
            volatility: string
            seasonality_detected: boolean
            anomalies: Array<{ date: string; value: number; reason: string }>
            forecast_direction: string
            forecast_confidence: string
            insights: string
            key_observations: string[]
            risk_factors: string[]
            economic_interpretation: string
        }
        forecast: Array<{ date: string; value: number; type: string; confidence: number }>
        alerts: any
    }
    timestamp: string
}

const STORAGE_KEY = "analysisPageData"
const HISTORY_STORAGE_KEY = "analysisHistory"

export default function AnalysisPage() {
    const [analysis, setAnalysis] = useState<N8nSingleResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const { withLoading } = useLoading()

    // Load data from localStorage on mount
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY)
            if (savedData) {
                const parsedData = JSON.parse(savedData)
                console.log("[Analysis Page] Loaded data from localStorage:", parsedData)
                setAnalysis(parsedData as N8nSingleResponse)
            }
        } catch (error) {
            console.error("[Analysis Page] Error loading from localStorage:", error)
        }
    }, [])

    const handleAnalysisSuccess = (analysisData?: any) => {
        if (analysisData && analysisData.full_analysis && analysisData.data) {
            console.log("[Analysis Page] ===== RECEIVED DATA FROM TRIGGER =====")
            console.log("[Analysis Page] Success:", analysisData.success)
            console.log("[Analysis Page] Data:", analysisData.data)
            console.log("[Analysis Page] Full Analysis:", analysisData.full_analysis)
            console.log("[Analysis Page] Timestamp:", analysisData.timestamp)
            console.log("[Analysis Page] ===== SETTING STATE AND SAVING TO STORAGE =====")
            
            // Set state
            setAnalysis(analysisData as N8nSingleResponse)
            setLoading(false)
            
            // Save current analysis to localStorage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(analysisData))
                console.log("[Analysis Page] Current analysis saved to localStorage")
            } catch (error) {
                console.error("[Analysis Page] Error saving to localStorage:", error)
            }

            // Add to history list
            try {
                const historyData = localStorage.getItem(HISTORY_STORAGE_KEY) || "[]"
                const history = JSON.parse(historyData)
                
                // Create history entry with analysis ID based on indicator
                const historyEntry = {
                    id: analysisData.data.indicator,
                    ...analysisData,
                }

                // Check if this analysis already exists in history
                const existingIndex = history.findIndex(
                    (item: any) => item.id === historyEntry.id && 
                    item.data?.country === analysisData.data.country
                )

                if (existingIndex >= 0) {
                    // Update existing entry
                    history[existingIndex] = historyEntry
                    console.log("[Analysis Page] Updated existing history entry")
                } else {
                    // Add new entry
                    history.unshift(historyEntry)
                    console.log("[Analysis Page] Added new entry to history")
                }

                localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
                console.log("[Analysis Page] History saved to localStorage:", history.length, "entries")
            } catch (error) {
                console.error("[Analysis Page] Error updating history:", error)
            }
        }
    }

    const handleDownload = async () => {
        if (!analysis) {
            toast.error("No analysis data to download")
            return
        }
        try {
            const { withLoading } = useLoading()
            await withLoading(async () => {
                // Use API route to download CSV using indicator as id
                const idParam = analysis?.data?.indicator?.trim()
                if (!idParam) {
                    toast.error("Invalid analysis ID")
                    return
                }

                const res = await fetch(`/api/analysis/${idParam}/download`)
                if (!res.ok) {
                    console.error("[Analysis Page] Download API error:", res.status, res.statusText)
                    toast.error("Failed to start download")
                    return
                }

                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `analysis-${idParam}-${Date.now()}.csv`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success("Download started")
            }, "Preparing CSV download...")
        } catch (error) {
            console.error("[Analysis Page] Download error:", error)
            toast.error("Failed to download analysis")
        }
    }

    if (!analysis) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
                <div className="p-4 rounded-full bg-primary/10 text-primary">
                    <BarChart3 className="w-12 h-12" />
                </div>
                <div className="space-y-2 max-w-lg">
                    <h1 className="text-3xl font-bold tracking-tight">Economic Analysis</h1>
                    <p className="text-muted-foreground">
                        Run detailed time-series analysis on global economic indicators. Select a country, indicator, and date range to generate insights.
                    </p>
                </div>
                <AnalysisTriggerDialog onSuccess={handleAnalysisSuccess} />
            </div>
        )
    }

    const info = analysis.data
    const details = analysis.full_analysis

    // Build metrics
    const metrics: Metric[] = [
        {
            title: "Current Value",
            value: info.latest_value != null ? info.latest_value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : "N/A",
            change: info.change_pct ? `${Number(info.change_pct) > 0 ? '+' : ''}${info.change_pct}%` : "N/A",
            trend: info.change_pct ? (Number(info.change_pct) > 0 ? "up" : "down") : undefined,
            icon: DollarSign,
        },
        {
            title: "Market Trend",
            value: info.trend ? info.trend.toUpperCase() : "UNKNOWN",
            trend: info.trend === 'increasing' ? "up" : (info.trend === 'decreasing' ? "down" : undefined),
            icon: TrendingUp,
        },
        {
            title: "Outlook",
            value: info.forecast_direction ? info.forecast_direction.toUpperCase() : "UNKNOWN",
            trend: info.forecast_direction === 'up' ? "up" : (info.forecast_direction === 'down' ? "down" : undefined),
            icon: Activity,
        },
        {
            title: "Volatility",
            value: details.ai_analysis.volatility.toUpperCase(),
            trend: undefined,
            icon: AlertCircle,
        }
    ]

    // Prepare Chart Data
    const chartData = details.forecast.map(f => {
        const confidence = f.confidence || 0.85
        const margin = f.value * (1 - confidence)
        return {
            label: f.date,
            value: f.value,
            upper: f.value + margin,
            lower: f.value - margin
        }
    })

    const seriesConfig = [
        { key: "value", label: "Projected", color: "#e15554", strokeWidth: 3 },
        { key: "upper", label: "Upper Bound", color: "hsl(var(--muted-foreground))", strokeWidth: 1.5, strokeDasharray: "4 4", hideInLegend: true },
        { key: "lower", label: "Lower Bound", color: "hsl(var(--muted-foreground))", strokeWidth: 1.5, strokeDasharray: "4 4", hideInLegend: true }
    ]

    return (
        <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto pb-10 sm:pb-12 px-4 sm:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-muted pb-6 sm:pb-8 pt-3 sm:pt-4 gap-4 sm:gap-6">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-accent/10">
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-foreground/90 uppercase">
                            Analysis: {info.indicator}
                        </h1>
                        <nav className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                            <span>{info.indicator}</span>
                            <span className="opacity-20">/</span>
                            <span>{info.country}</span>
                            <span className="opacity-20">/</span>
                            <span className="text-[#e15554]">{new Date(analysis.timestamp).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} Report</span>
                        </nav>
                    </div>
                </div>
                <div className="flex w-full sm:w-auto flex-wrap items-center justify-end gap-2 sm:gap-4">
                    <Badge variant="outline" className="px-3 py-1 font-black text-[9px] uppercase tracking-[0.2em] border-[#e15554]/20 text-[#e15554]">
                        Intelligence System
                    </Badge>
                    <AnalysisTriggerDialog onSuccess={handleAnalysisSuccess} />
                    <Button onClick={handleDownload} variant="ghost" size="icon" className="rounded-full">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="px-1">
                <MetricsGrid metrics={metrics} />
            </div>

            {/* Main Content Area */}
            <div className="grid gap-6 sm:gap-8 lg:grid-cols-12">

                {/* Left Column: Chart & Anomalies */}
                <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                    {/* Chart Card */}
                    <Card className="border-none shadow-none bg-accent/5 overflow-hidden rounded-3xl">
                        <CardHeader className="p-4 md:p-8 pb-3 md:pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-black text-[#e15554] tracking-tighter uppercase">Trend Projection</CardTitle>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Economic Growth Indices</div>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-[#e15554]/10 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-[#e15554]" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 md:p-8 pt-2 md:pt-4">
                            <TrendLineChart data={chartData} series={seriesConfig} type="area" />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: AI Insights & Statistics */}
                <div className="lg:col-span-4 space-y-6 sm:space-y-8">
                    {/* AI Insights Card */}
                    <Card className="border-none shadow-none bg-[#e15554]/5 rounded-3xl overflow-hidden">
                        <CardHeader className="p-4 md:p-6 pb-3 md:pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-white dark:bg-black/40 flex items-center justify-center">
                                    <Brain className="h-5 w-5 text-[#e15554]" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black tracking-tighter uppercase">AI Insights</CardTitle>
                                    <CardDescription className="text-[9px] font-bold uppercase tracking-[0.15em]">Key Takeaways</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
                            <p className="text-xs sm:text-sm leading-relaxed font-semibold text-foreground/80">
                                {details.ai_analysis.insights}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Statistics Card */}
                    <Card className="border-none shadow-none bg-accent/5 rounded-3xl">
                        <CardHeader className="p-4 md:p-6 pb-3 md:pb-4">
                            <CardTitle className="text-lg font-black tracking-tighter uppercase">Statistics</CardTitle>
                            <CardDescription className="text-[9px] font-bold uppercase tracking-[0.15em]">Data Integrity</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6 pt-0 space-y-4 md:space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mean</span>
                                    <span className="text-lg font-black">{details.statistics.mean.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Std Dev</span>
                                    <span className="text-lg font-black text-rose-400">{details.statistics.std.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
