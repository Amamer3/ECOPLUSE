"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Calendar, Download, Globe, Activity, DollarSign, TrendingUp, TrendingDown, AlertCircle, Brain, Info, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { TrendLineChart } from "@/components/charts/trend-line-chart"
import { MetricsGrid, Metric } from "@/components/metrics-grid"

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
    const params = useParams()
    const id = params.id as string
    const [analysis, setAnalysis] = useState<N8nSingleResponse | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const response = await fetch(`/api/analysis/${id}`)
                if (!response.ok) {
                    if (response.status === 404) throw new Error("Analysis not found")
                    throw new Error("Failed to fetch analysis")
                }
                const data = await response.json()
                // Check if it's the single response format
                if (data && data.full_analysis) {
                    setAnalysis(data)
                } else if (Array.isArray(data) && data.length > 0) {
                    // Fallback if list returned, try to use first item if it matches or has result
                    // For now assuming the API returns the SingleResponse structure as per logs
                    setAnalysis(data[0] as unknown as N8nSingleResponse)
                } else {
                    // If it's the old format or something else, we might need a transformer
                    // But based on user input, we receive the N8nSingleResponse
                    setAnalysis(data)
                }
            } catch (error) {
                console.error(error)
                toast.error("Error loading analysis details")
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchAnalysis()
        }
    }, [id])

    const handleDownload = () => {
        if (!analysis) return
        const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `analysis-${analysis.data.indicator}-${analysis.data.country}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Download started")
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-muted-foreground">Loading analysis details...</div>
            </div>
        )
    }

    if (!analysis || !analysis.full_analysis) {
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
        { key: "value", label: "Projected", color: "hsl(var(--primary))", strokeWidth: 3 },
        { key: "upper", label: "Upper Bound", color: "hsl(var(--emerald-500))", strokeWidth: 2, strokeDasharray: "4 4" },
        { key: "lower", label: "Lower Bound", color: "hsl(var(--red-400))", strokeWidth: 2, strokeDasharray: "4 4" }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{info.indicator} Analysis</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{info.country}</span>
                        <span>•</span>
                        <span>{new Date(analysis.timestamp).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <Button onClick={handleDownload} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download JSON
                    </Button>
                </div>
            </div>

            <MetricsGrid metrics={metrics} />

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* Chart Section */}
                <div className="col-span-4 bg-card rounded-xl border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Economic Trends & Forecast</h3>
                        <div className="text-sm text-muted-foreground">Historical & Projected</div>
                    </div>
                    <TrendLineChart data={chartData} series={seriesConfig} />
                </div>

                {/* Statistics Panel */}
                <div className="col-span-3 bg-card rounded-xl border p-6">
                    <h3 className="text-lg font-semibold mb-6">Statistical Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-sm text-muted-foreground">Mean</span>
                            <div className="text-xl font-bold">
                                {details.statistics.mean.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm text-muted-foreground">Std Deviation</span>
                            <div className="text-xl font-bold">
                                {details.statistics.std.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm text-muted-foreground">Minimum</span>
                            <div className="text-xl font-bold">
                                {details.statistics.min.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm text-muted-foreground">Maximum</span>
                            <div className="text-xl font-bold">
                                {details.statistics.max.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 border-t mt-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Absolute Change</span>
                            <span className="font-mono text-green-600">+{details.statistics.change.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-muted-foreground">Percentage Change</span>
                            <span className="font-mono text-green-600">{details.statistics.change_pct}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Insights & Risks */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary" />
                            <CardTitle>AI Insights</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {details.ai_analysis.insights}
                        </p>
                        <h4 className="font-semibold text-sm mt-4 mb-2 text-primary">Economic Interpretation</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {details.ai_analysis.economic_interpretation}
                        </p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-1">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-500" />
                            <CardTitle>Observations & Risks</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-2">Key Observations</h4>
                                <ul className="space-y-1">
                                    {details.ai_analysis.key_observations.map((obs, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                            <span className="text-primary">•</span> {obs}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm mb-2 text-red-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Risk Factors
                                </h4>
                                <ul className="space-y-1">
                                    {details.ai_analysis.risk_factors.map((risk, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                            <span className="text-red-400">•</span> {risk}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
