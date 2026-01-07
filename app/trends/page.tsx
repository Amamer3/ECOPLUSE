"use client"

import { MetricsGrid, Metric } from "@/components/metrics-grid"
import { TrendBarChart } from "@/components/charts/trend-bar-chart"
import { TrendAreaChart } from "@/components/charts/trend-area-chart"
import { TrendingUp, BarChart2, Activity, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getCountryLabel } from "@/lib/countries"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"
import { AnalysisTriggerDialog } from "@/components/analysis-trigger-dialog"

// Reuse the interface from page.tsx (or move to a shared types file realistically)
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
            mean_growth_rate?: number
            min: number
            max: number
            latest: number
            change: number
            change_pct: string
        }
        ai_analysis: {
            trend: string
            trend_strength: string
            trend_description: string
            volatility: string
            forecast_confidence: string
        }
        forecast: Array<{ date: string; value: number; type: string; confidence: number }>
    }
    timestamp: string
}

export default function TrendsPage() {
    const searchParams = useSearchParams()
    const country = searchParams?.get("country") || 'US'
    const [analysis, setAnalysis] = useState<N8nSingleResponse | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Load analysis from localStorage only
        try {
            const savedData = localStorage.getItem("analysisPageData")
            if (savedData) {
                const parsedData = JSON.parse(savedData)
                if (parsedData && parsedData.data && parsedData.full_analysis) {
                    // Check if country matches
                    if (parsedData.data.country === country || parsedData.data.country === getCountryLabel(country)) {
                        setAnalysis(parsedData as N8nSingleResponse)
                        console.log("[Trends] Loaded analysis from localStorage for country:", country)
                    } else {
                        console.log("[Trends] Stored analysis is for different country, not displaying")
                        setAnalysis(null)
                    }
                }
            } else {
                console.log("[Trends] No analysis data found in localStorage")
                setAnalysis(null)
            }
        } catch (error) {
            console.error("[Trends] Error loading from localStorage:", error)
            setAnalysis(null)
        } finally {
            setLoading(false)
        }
    }, [country])

    const handleAnalysisSuccess = () => {
        // Reload from localStorage after new analysis
        try {
            const savedData = localStorage.getItem("analysisPageData")
            if (savedData) {
                const parsedData = JSON.parse(savedData)
                if (parsedData && parsedData.data && parsedData.full_analysis) {
                    setAnalysis(parsedData as N8nSingleResponse)
                    console.log("[Trends] Analysis updated from localStorage")
                }
            }
        } catch (error) {
            console.error("[Trends] Error reloading from localStorage:", error)
        }
    }

    let metrics: Metric[] = []
    let forecastData: { label: string, value: number }[] = []

    if (analysis) {
        try {
            const { data: info, full_analysis: detailed } = analysis

            metrics = [
                {
                    title: "Market Trend",
                    value: info.trend.toUpperCase(),
                    trend: info.trend === 'increasing' ? "up" : "down",
                    icon: TrendingUp,
                },
                {
                    title: "Trend Strength",
                    value: detailed.ai_analysis.trend_strength.toUpperCase(),
                    trend: undefined,
                    icon: Zap,
                },
                {
                    title: "Volatility Index",
                    value: detailed.ai_analysis.volatility.toUpperCase(),
                    trend: undefined,
                    icon: Activity,
                },
                {
                    title: "Forecast Confidence",
                    value: detailed.ai_analysis.forecast_confidence || "N/A",
                    trend: undefined,
                    icon: BarChart2,
                }
            ]

            // Transform forecast for charts with validation
            if (Array.isArray(detailed.forecast)) {
                forecastData = detailed.forecast
                    .filter(f => f && typeof f.date === "string" && typeof f.value === "number")
                    .map(f => ({
                        label: f.date,
                        value: f.value
                    }))
            }
        } catch (error) {
            console.error("[Trends] Error processing analysis data:", error)
            setAnalysis(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                    <Spinner className="h-8 w-8 mx-auto text-[#e15554]" />
                    <p className="text-muted-foreground font-semibold">Loading trends...</p>
                </div>
            </div>
        )
    }

    if (!analysis) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Market Trends</h1>
                    </div>
                    <AnalysisTriggerDialog onSuccess={handleAnalysisSuccess} />
                </div>
                <div className="p-12 text-center border rounded-xl bg-muted/10 text-muted-foreground">
                    No trend analysis data available currently. Please run an analysis from the dashboard.
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Market Trends: {analysis.data.indicator}</h1>
                        <p className="text-muted-foreground mt-1">
                            {getCountryLabel(analysis.data.country) || analysis.data.country} • {analysis.full_analysis.ai_analysis.trend_description}
                        </p>
                    </div>
                </div>
                <AnalysisTriggerDialog onSuccess={handleAnalysisSuccess} />
            </div>

            <MetricsGrid metrics={metrics} />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Area Chart for Trend Flow */}
                <Card>
                    <CardHeader>
                        <CardTitle>Trend Progression</CardTitle>
                        <CardDescription>Visualizing the continuous movement and momentum.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TrendAreaChart data={forecastData} title={analysis.data.indicator} color="#e15554" />
                    </CardContent>
                </Card>

                {/* Bar Chart for Distinct Values */}
                <Card>
                    <CardHeader>
                        <CardTitle>Projected Values</CardTitle>
                        <CardDescription>Forecasted milestones for the upcoming periods.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TrendBarChart data={forecastData} title={analysis.data.indicator} color="#e15554" />
                    </CardContent>
                </Card>
            </div>

            {/* Additional Market Analysis Block */}
            <Card className="bg-muted/50 border-none">
                <CardHeader>
                    <CardTitle className="text-base">Market Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        The current market trend for <strong>{analysis.data.indicator}</strong> in <strong>{getCountryLabel(analysis.data.country) || analysis.data.country}</strong> is characterized as
                        <span className="font-semibold text-foreground"> {analysis.full_analysis.ai_analysis.trend}</span> with
                        <span className="font-semibold text-foreground"> {analysis.full_analysis.ai_analysis.trend_strength}</span> momentum.
                        Volatility is observed to be <strong>{analysis.full_analysis.ai_analysis.volatility}</strong>.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
