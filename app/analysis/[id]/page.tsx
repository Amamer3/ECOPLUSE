"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Calendar, Download, Globe, Activity, DollarSign, TrendingUp, TrendingDown, AlertCircle, Brain, Info, AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import dynamic from "next/dynamic"
const TrendLineChart = dynamic(() => import("@/components/charts/trend-line-chart").then(mod => mod.TrendLineChart), { ssr: false })
import { MetricsGrid, Metric } from "@/components/metrics-grid"
import { AnalysisTriggerDialog } from "@/components/analysis-trigger-dialog"
import { Spinner } from "@/components/ui/spinner"
import { useLoading } from "@/hooks/use-loading"

// Define the comprehensive response interface matching the webhook
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

export default function AnalysisDetailPage() {
    const { id } = useParams()
    const [analysis, setAnalysis] = useState<N8nSingleResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const { withLoading } = useLoading()
    const [refreshKey, setRefreshKey] = useState(0)

    const handleAnalysisSuccess = (analysisData?: any) => {
        // If we have analysis data from trigger response, use it directly
        if (analysisData && analysisData.full_analysis && analysisData.data) {
            console.log("[Analysis] Received data from trigger:", analysisData)
            console.log("[Analysis] Setting analysis state with data")
            setAnalysis(analysisData as N8nSingleResponse)
            setLoading(false)
            
            // Save to history list
            try {
                const HISTORY_STORAGE_KEY = "analysisHistory"
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
                    console.log("[Analysis] Updated existing history entry")
                } else {
                    // Add new entry
                    history.unshift(historyEntry)
                    console.log("[Analysis] Added new entry to history")
                }

                localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
                console.log("[Analysis] History saved to localStorage")
            } catch (error) {
                console.error("[Analysis] Error updating history:", error)
            }
            
            console.log("[Analysis] Analysis state updated, loading set to false")
        } else {
            console.log("[Analysis] No analysis data from trigger, incrementing refresh key")
            // Otherwise increment refresh key to trigger re-fetch
            setRefreshKey(prev => prev + 1)
        }
    }

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                // Validate ID
                if (!id || typeof id !== "string" || id.trim() === "") {
                    throw new Error("Invalid analysis ID")
                }

                const response = await fetch(`/api/analysis/${id}`)
                
                if (!response.ok) {
                    console.error(`[Analysis] API error: ${response.status} ${response.statusText}`)
                    if (response.status === 404) {
                        throw new Error("Analysis not found")
                    } else if (response.status === 400) {
                        throw new Error("Invalid analysis ID")
                    }
                    throw new Error("Failed to fetch analysis")
                }

                const data = await response.json()

                // Handle API error response
                if (data.error) {
                    console.error("[Analysis] API returned error:", data.error)
                    throw new Error(data.error)
                }

                // Validate data
                if (!data || typeof data !== "object") {
                    console.error("[Analysis] Invalid response structure")
                    throw new Error("Invalid response format")
                }

                // Check if it's the single response format
                if (data && data.full_analysis && data.data) {
                    // Validate required fields
                    if (!data.data.country || !data.data.indicator) {
                        console.warn("[Analysis] Missing required fields")
                        throw new Error("Incomplete analysis data")
                    }
                    setAnalysis(data as N8nSingleResponse)
                } else if (Array.isArray(data) && data.length > 0 && data[0]?.full_analysis) {
                    // Fallback if list returned
                    setAnalysis(data[0] as N8nSingleResponse)
                } else {
                    console.error("[Analysis] Unexpected response format:", typeof data)
                    throw new Error("Unable to parse analysis data")
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to load analysis"
                console.error("[Analysis] Fetch error:", errorMessage)
                toast.error(errorMessage)
                setAnalysis(null)
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchAnalysis()
        }
    }, [id, refreshKey])

    const handleDownload = async () => {
        if (!analysis) {
            toast.error("No analysis data to download")
            return
        }
        try {
            const { withLoading } = useLoading()
            await withLoading(async () => {
                 // Use API route to download CSV
                 // Ensure id is valid
                 const idParam = typeof id === "string" ? id.trim() : ""
                 if (!idParam) {
                     toast.error("Invalid analysis ID")
                     return
                 }

                const res = await fetch(`/api/analysis/${idParam}/download`)
                if (!res.ok) {
                    console.error("[Analysis] Download API error:", res.status, res.statusText)
                    toast.error("Failed to start download")
                    return
                }

                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                // Default filename; server also sets Content-Disposition
                a.download = `analysis-${idParam}-${Date.now()}.csv`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success("Download started")
            }, "Preparing CSV download...")
        } catch (error) {
            console.error("[Analysis] Download error:", error)
            toast.error("Failed to download analysis")
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <Spinner className="h-12 w-12 mx-auto text-[#e15554]" />
                    <p className="text-muted-foreground font-semibold">Loading analysis...</p>
                </div>
            </div>
        )
    }

    if (!analysis) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h2 className="text-xl font-semibold">Analysis details not available</h2>
                <p className="text-muted-foreground text-sm max-w-md text-center">
                    The analysis data could not be retrieved in the expected format.
                </p>
                <Button asChild variant="outline">
                    <Link href="/">Back to Dashboard</Link>
                </Button>
            </div>
        )
    }

    const { data: info, full_analysis: details } = analysis

    // Prepare Metrics
    const metrics: Metric[] = [
        {
            title: "Latest Value",
            value: info.latest_value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }), // Assuming USD for generic
            change: `${Number(info.change_pct) > 0 ? '+' : ''}${info.change_pct}%`,
            trend: Number(info.change_pct) > 0 ? "up" : "down",
            icon: DollarSign,
        },
        {
            title: "Trend",
            value: info.trend.charAt(0).toUpperCase() + info.trend.slice(1),
            trend: info.trend === 'increasing' ? "up" : "down",
            icon: info.trend === 'increasing' ? TrendingUp : TrendingDown,
        },
        {
            title: "Forecast",
            value: `${info.forecast_direction.toUpperCase()} (${details.ai_analysis.forecast_confidence})`,
            trend: info.forecast_direction === 'up' ? "up" : "down",
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
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-muted pb-8 pt-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-accent/10">
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-foreground/90 uppercase">
                            Deep Analysis: {info.indicator}
                        </h1>
                        <nav className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                            <span>{info.indicator}</span>
                            <span className="opacity-20">/</span>
                            <span>{info.country}</span>
                            <span className="opacity-20">/</span>
                            <span className="text-[#e15554]">{new Date(analysis.timestamp).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} Report</span>
                        </nav>
                    </div>
                </div>
                <div className="flex items-center gap-4">
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
            <div className="grid gap-8 lg:grid-cols-12">

                {/* Left Column: Chart & Anomalies */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Chart Card */}
                    <Card className="border-none shadow-none bg-accent/5 overflow-hidden rounded-3xl">
                        <CardHeader className="p-8 pb-4">
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
                        <CardContent className="p-8 pt-0">
                            <TrendLineChart data={chartData} series={seriesConfig} type="area" />
                        </CardContent>
                    </Card>

                    {/* Anomalies Section (Deep Analysis Feature) */}
                    {details.ai_analysis.anomalies && details.ai_analysis.anomalies.length > 0 && (
                        <Card className="border-none shadow-none bg-orange-500/5 overflow-hidden rounded-3xl">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                    <CardTitle className="text-lg font-black tracking-tighter uppercase">Contextual Anomalies</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {details.ai_analysis.anomalies.map((anomaly, idx) => (
                                        <div key={idx} className="p-4 bg-white dark:bg-black/20 rounded-xl border border-orange-500/10 flex items-start gap-4">
                                            <div className="h-2 w-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                            <div>
                                                <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{anomaly.date}</div>
                                                <div className="text-sm font-bold text-foreground/80 mt-1">{anomaly.reason}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Stats & Metadata */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Statistical Card */}
                    <Card className="border-none shadow-none bg-accent/5 overflow-hidden rounded-3xl h-full">
                        <CardHeader className="p-8 pb-6">
                            <CardTitle className="text-xl font-black tracking-tighter uppercase">Stat Breakdown</CardTitle>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aggregated Analysis Data</div>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mean</span>
                                    <div className="text-2xl font-black text-[#e15554] tracking-tighter">
                                        {details.statistics.mean.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volatility</span>
                                    <div className="text-2xl font-black text-[#e15554] tracking-tighter">
                                        {details.statistics.std.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Highest</span>
                                    <div className="text-2xl font-black text-foreground/90 tracking-tighter">
                                        {details.statistics.max.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lowest</span>
                                    <div className="text-2xl font-black text-foreground/90 tracking-tighter">
                                        {details.statistics.min.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-muted/20 space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                                    <span className="text-muted-foreground">Period Delta</span>
                                    <span className="text-emerald-500">+{details.statistics.change.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                                    <span className="text-muted-foreground">Relative Shift</span>
                                    <span className="text-emerald-500">{details.statistics.change_pct}% Growth</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* AI intelligence Section (Dashboard Style) */}
            <Card className="border-none shadow-none bg-[#e15554]/5 rounded-4xl overflow-hidden">
                <CardHeader className="p-10 pb-0">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-3xl bg-white dark:bg-black/40 flex items-center justify-center shadow-sm">
                            <Brain className="h-8 w-8 text-[#e15554]" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tighter uppercase whitespace-pre-wrap">Deep Intelligence Synthesizer</CardTitle>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-1">Multi-Vector Synthetic Report</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-10 space-y-12">
                    {/* Primary Insight */}
                    <div className="p-10 bg-white dark:bg-black/20 rounded-4xl shadow-sm border border-muted-foreground/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-[#e15554]" />
                        <h4 className="text-[10px] font-black uppercase text-[#e15554] tracking-[0.4em] mb-4">Core Observation</h4>
                        <p className="text-xl leading-relaxed font-bold text-foreground/90 italic">
                            "{details.ai_analysis.insights}"
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Observations */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-muted">
                                <Info className="h-4 w-4 text-[#e15554]" />
                                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.5em]">Critical Observations</h4>
                            </div>
                            <ul className="space-y-6">
                                {details.ai_analysis.key_observations.map((obs, i) => (
                                    <li key={i} className="flex gap-4 group">
                                        <div className="h-5 w-5 rounded-full border-2 border-[#e15554] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#e15554] transition-colors">
                                            <div className="h-1.5 w-1.5 rounded-full bg-[#e15554] group-hover:bg-white" />
                                        </div>
                                        <p className="text-sm font-bold text-foreground/70 leading-relaxed group-hover:text-foreground transition-colors">{obs}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Risks & Strategy */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-muted text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.5em]">Strategic Risk Factors</h4>
                            </div>
                            <div className="grid gap-3">
                                {details.ai_analysis.risk_factors.map((risk, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center gap-4 group hover:bg-red-500/10 transition-colors">
                                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 group-hover:scale-150 transition-transform" />
                                        <span className="text-xs font-black uppercase tracking-wider text-red-600/80 group-hover:text-red-600">
                                            {risk}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-6 bg-[#e15554] rounded-2xl">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">Economic Interpretation</h5>
                                <p className="text-sm font-bold text-white leading-relaxed">
                                    {details.ai_analysis.economic_interpretation}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

