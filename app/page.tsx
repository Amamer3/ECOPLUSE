"use client"

import { Suspense } from "react"
import { MetricsGrid, Metric } from "@/components/metrics-grid"
import dynamic from "next/dynamic"
const TrendLineChart = dynamic(() => import("@/components/charts/trend-line-chart").then(mod => mod.TrendLineChart), { ssr: false })
const TrendBarChart = dynamic(() => import("@/components/charts/trend-bar-chart").then(mod => mod.TrendBarChart), { ssr: false })
import { AnalysisTriggerDialog } from "@/components/analysis-trigger-dialog"
import { Spinner } from "@/components/ui/spinner"
import { Activity, CheckCircle, AlertCircle, TrendingUp, TrendingDown, DollarSign, Clock, Brain, AlertTriangle, Info } from "lucide-react"
import { getCountryLabel } from "@/lib/countries"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

interface Analysis {
  id: string
  country: string
  indicator: string
  status: "pending" | "running" | "completed" | "failed"
  createdAt: string
  startDate: string
  endDate: string
}

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

function DashboardContent() {
  const searchParams = useSearchParams()
  const country = searchParams?.get("country") || 'US'
  const [detailedAnalysis, setDetailedAnalysis] = useState<N8nSingleResponse | null>(null)
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
            setDetailedAnalysis(parsedData as N8nSingleResponse)
            console.log("[Dashboard] Loaded analysis from localStorage for country:", country)
          } else {
            console.log("[Dashboard] Stored analysis is for different country, not displaying")
            setDetailedAnalysis(null)
          }
        }
      } else {
        console.log("[Dashboard] No analysis data found in localStorage")
        setDetailedAnalysis(null)
      }
    } catch (error) {
      console.error("[Dashboard] Error loading from localStorage:", error)
      setDetailedAnalysis(null)
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
          setDetailedAnalysis(parsedData as N8nSingleResponse)
          console.log("[Dashboard] Analysis updated from localStorage")
        }
      }
    } catch (error) {
      console.error("[Dashboard] Error reloading from localStorage:", error)
    }
  }

  let metrics: Metric[] = []
  let chartData: any[] = []
  let overviewTitle = "Economic Performance Overview"

  if (detailedAnalysis) {
    try {
      const info = detailedAnalysis.data
      
      // Build title
      overviewTitle = `${info.indicator || 'Economic'} Overview - ${getCountryLabel(info.country) || info.country || country}`

      // Build metrics with safe data access
      metrics = [
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
          value: detailedAnalysis.full_analysis?.ai_analysis?.volatility?.toUpperCase() || "UNKNOWN",
          trend: undefined,
          icon: AlertCircle,
        }
      ]

      // Build chart data with validation
      if (Array.isArray(detailedAnalysis.full_analysis?.forecast)) {
        chartData = detailedAnalysis.full_analysis.forecast
          .filter((f: any) => f && typeof f.date === "string" && typeof f.value === "number")
          .map((f: any) => {
            const confidence = Math.min(Math.max(f.confidence || 0.85, 0), 1)
            const margin = f.value * (1 - confidence)
            return {
              label: f.date,
              value: f.value,
              upper: f.value + Math.abs(margin),
              lower: f.value - Math.abs(margin)
            }
          })
      }
      console.log("[Dashboard] Successfully processed analysis data")
    } catch (error) {
      console.error("[Dashboard] Error processing analysis data:", error)
      setDetailedAnalysis(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Spinner className="h-8 w-8 mx-auto text-[#e15554]" />
          <p className="text-muted-foreground font-semibold">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!detailedAnalysis) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Economic Dashboard</h1>
            <p className="text-muted-foreground mt-2">Get started by running an analysis</p>
          </div>
          {/* <AnalysisTriggerDialog onSuccess={handleAnalysisSuccess} /> */}
        </div>
        <div className="p-12 bg-accent/5 rounded-[40px] text-center space-y-4 shadow-inner">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto opacity-20" />
          <p className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">No Data Available</p>
          <p className="text-[10px] text-muted-foreground/40 max-w-xs mx-auto leading-relaxed font-bold tracking-tight">Run the real-time AI modeling engine to unlock deep economic interpretations, risk heatmaps, and trend strength validation indices.</p>
        </div>
      </div>
    )
  }

  const seriesConfig = [
    { key: "value", label: "Projected Trend", color: "#e15554", strokeWidth: 3 },
    { key: "upper", label: "Confidence", color: "#e15554", strokeWidth: 1, strokeDasharray: "4 4", hideInLegend: true },
    { key: "lower", label: "Confidence", color: "#e15554", strokeWidth: 1, strokeDasharray: "4 4", hideInLegend: true }
  ]

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-muted pb-8 pt-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground/90 uppercase">{overviewTitle}</h1>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
            <Link href="/" className="hover:text-primary transition-colors">Economic Dashboard</Link>
            <span className="opacity-20">/</span>
            <span className="text-[#e15554]">Intelligence System</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1 font-black text-[9px] uppercase tracking-[0.2em] border-[#e15554]/20 text-[#e15554]">
            Real-Time Engine
          </Badge>
          {/* <AnalysisTriggerDialog onSuccess={handleAnalysisSuccess} /> */}
        </div>
      </div>

      {/* Metrics Row */}
      <MetricsGrid metrics={metrics} />

      {/* Split Chart Row */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Trend Analysis */}
        <Card className="border-none shadow-none bg-accent/5 overflow-hidden">
          <CardHeader className="pb-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-[#e15554] tracking-tighter uppercase">Predictive Analysis</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Growth Forecast Index</CardDescription>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#e15554]/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-[#e15554]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TrendLineChart data={chartData} series={seriesConfig} type="area" />
          </CardContent>
        </Card>

        {/* Volume Analysis */}
        <Card className="border-none shadow-none bg-accent/5 overflow-hidden">
          <CardHeader className="pb-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-[#e15554] tracking-tighter uppercase">Volume Metrics</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Periodic Distribution</CardDescription>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#e15554]/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-[#e15554]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TrendBarChart data={chartData} title="Volume Score" color="#e15554" />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - AI & Stats */}
      <div className="grid gap-8 lg:grid-cols-3">
          {/* AI Insights (Wide) */}
          <Card className="lg:col-span-2 border-none shadow-none bg-[#e15554]/5 rounded-3xl overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-black/40 flex items-center justify-center shadow-sm">
                  <Brain className="h-6 w-6 text-[#e15554]" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black tracking-tighter uppercase">AI Intelligence Report</CardTitle>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Synthesized Economic Insights</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="p-6 bg-white dark:bg-black/20 rounded-2xl shadow-sm border border-muted-foreground/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#e15554]" />
                <p className="text-base leading-relaxed font-bold text-foreground/80">
                  {detailedAnalysis.full_analysis.ai_analysis.insights}
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] pb-3 border-b border-muted">Key Drivers</h4>
                  <ul className="space-y-4">
                    {detailedAnalysis.full_analysis.ai_analysis.key_observations.slice(0, 4).map((obs: any, i: number) => (
                      <li key={i} className="flex gap-4 items-start text-sm font-semibold text-muted-foreground">
                        <span className="text-[#e15554] mt-1 text-xs">■</span>
                        {obs}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-[0.3em] pb-3 border-b border-rose-100">Market Risks</h4>
                  <ul className="space-y-4">
                    {detailedAnalysis.full_analysis.ai_analysis.risk_factors.slice(0, 4).map((risk: any, i: number) => (
                      <li key={i} className="flex gap-4 items-start text-sm font-semibold text-rose-500/80">
                        <span className="text-rose-400 mt-1 text-xs">■</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics (Narrow) */}
          <Card className="border-none shadow-none bg-accent/5 rounded-3xl p-4">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-black tracking-tighter uppercase">Data Accuracy</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-[#e15554]">Statistical Integrity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-10">
              <div className="space-y-6">
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Global Mean</span>
                  <span className="text-2xl font-black tracking-tighter group-hover:text-[#e15554] transition-colors">
                    {detailedAnalysis.full_analysis.statistics.mean.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between items-center group border-t border-muted pt-6">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Volatility (Std)</span>
                  <span className="text-2xl font-black tracking-tighter group-hover:text-[#e15554] transition-colors text-rose-400">
                    {detailedAnalysis.full_analysis.statistics.std.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="pt-8 space-y-4">
                <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase opacity-50 tracking-tighter">
                  <span>Low Bound</span>
                  <span>High Bound</span>
                </div>
                <div className="h-4 w-full bg-muted rounded-full relative p-1 shadow-inner">
                  <div className="absolute left-[30%] right-[25%] h-2 bg-[#e15554] rounded-full mt-0 shadow-[0_0_15px_rgba(225,85,84,0.5)]" />
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold font-mono text-muted-foreground">{detailedAnalysis.full_analysis.statistics.min.toLocaleString()}</span>
                  <div className="h-4 w-px bg-muted mx-auto" />
                  <span className="text-[10px] font-bold font-mono text-muted-foreground">{detailedAnalysis.full_analysis.statistics.max.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Spinner className="h-8 w-8 mx-auto text-[#e15554]" /></div>}>
      <DashboardContent />
    </Suspense>
  )
}
