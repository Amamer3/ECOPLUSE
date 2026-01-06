import { MetricsGrid, Metric } from "@/components/metrics-grid"
import { TrendLineChart } from "@/components/charts/trend-line-chart"
import { AnalysisTriggerDialog } from "@/components/analysis-trigger-dialog"
import { fetchFromN8n } from "@/lib/n8n"
import { Activity, CheckCircle, AlertCircle, TrendingUp, TrendingDown, DollarSign, Clock, Brain, AlertTriangle, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

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

export default async function DashboardPage() {
  let analyses: Analysis[] = []
  let metrics: Metric[] = []
  let chartData: any[] = []
  let overviewTitle = "Overview"
  let detailedAnalysis: N8nSingleResponse | null = null

  try {
    const response = await fetchFromN8n({ action: "list_analyses" })

    // Check if response is the single analysis detailed format
    if (response && (response.data && response.full_analysis)) {
      detailedAnalysis = response as N8nSingleResponse
      const info = detailedAnalysis.data

      overviewTitle = `${info.indicator} Overview - ${info.country}`

      // Create metrics from the real data
      metrics = [
        {
          title: "Latest Value",
          value: info.latest_value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
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
          value: `${info.forecast_direction.toUpperCase()} (${detailedAnalysis.full_analysis.ai_analysis.forecast_confidence})`,
          trend: info.forecast_direction === 'up' ? "up" : "down",
          icon: Activity,
        },
        {
          title: "Avg. Volatility",
          value: detailedAnalysis.full_analysis.ai_analysis.volatility.toUpperCase(),
          trend: undefined,
          icon: AlertCircle,
        }
      ]

      // Map forecast data for the chart with confidence bands
      if (Array.isArray(detailedAnalysis.full_analysis.forecast)) {
        chartData = detailedAnalysis.full_analysis.forecast.map(f => {
          const confidence = f.confidence || 0.85
          // Calculate stylized confidence intervals
          // If confidence is 0.9, margin is 10% of value, etc.
          const margin = f.value * (1 - confidence)

          return {
            label: f.date,
            value: f.value,
            upper: f.value + margin,
            lower: f.value - margin
          }
        })
      }

    } else if (Array.isArray(response)) {
      // Handle standard list format
      analyses = response
      // Default metrics...
      metrics = [
        { title: "Total Analyses", value: analyses.length.toString(), icon: Activity }
      ] as Metric[]
    }
  } catch (error) {
    console.error("Failed to fetch analyses:", error)
  }

  const seriesConfig = [
    { key: "value", label: "Projected", color: "hsl(var(--primary))", strokeWidth: 3 },
    { key: "upper", label: "Upper Bound", color: "hsl(var(--emerald-500))", strokeWidth: 2, strokeDasharray: "4 4" },
    { key: "lower", label: "Lower Bound", color: "hsl(var(--red-400))", strokeWidth: 2, strokeDasharray: "4 4" }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{overviewTitle}</h1>
          <p className="text-muted-foreground mt-2">Real-time economic indicators and performance metrics</p>
        </div>
        <AnalysisTriggerDialog />
      </div>

      <MetricsGrid metrics={metrics} />

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Chart Section */}
        <div className="col-span-4 bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Economic Trends & Forecast</h3>
            <div className="text-sm text-muted-foreground">Financial Projection Model (Confidence Bands)</div>
          </div>
          <TrendLineChart data={chartData} series={seriesConfig} />
        </div>

        {/* Statistics or Recent Reports */}
        <div className="col-span-3 bg-card rounded-xl border p-6">
          {detailedAnalysis ? (
            // Detailed Statistics View
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Statistical Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Mean</span>
                  <div className="text-xl font-bold">
                    {detailedAnalysis.full_analysis.statistics.mean.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Std Deviation</span>
                  <div className="text-xl font-bold">
                    {detailedAnalysis.full_analysis.statistics.std.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Minimum</span>
                  <div className="text-xl font-bold">
                    {detailedAnalysis.full_analysis.statistics.min.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Maximum</span>
                  <div className="text-xl font-bold">
                    {detailedAnalysis.full_analysis.statistics.max.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Change Analysis</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Absolute Change</span>
                  <span className="font-mono text-green-600">+{detailedAnalysis.full_analysis.statistics.change.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">Percentage</span>
                  <span className="font-mono text-green-600">{detailedAnalysis.full_analysis.statistics.change_pct}%</span>
                </div>
              </div>
            </div>
          ) : (
            // Fallback List View
            <>
              <h3 className="text-lg font-semibold mb-6">Recent Reports</h3>
              <div className="text-sm text-muted-foreground">No detailed analysis available.</div>
            </>
          )}
        </div>
      </div>

      {/* AI Analysis Section */}
      {detailedAnalysis && (
        <div className="grid gap-4 md:grid-cols-2">

          {/* Insights & Interpretation */}
          <Card className="md:col-span-1">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle>AI Insights & Interpretation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
                <h4 className="font-semibold text-sm mb-1">Executive Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {detailedAnalysis.full_analysis.ai_analysis.insights}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1 text-primary">Economic Interpretation</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {detailedAnalysis.full_analysis.ai_analysis.economic_interpretation}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Trend Description</h4>
                <p className="text-sm text-muted-foreground">
                  {detailedAnalysis.full_analysis.ai_analysis.trend_description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Observations & Risks */}
          <Card className="md:col-span-1">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                <CardTitle>Key Observations & Risks</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Key Obs */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  Key Observations
                </h4>
                <ul className="space-y-2">
                  {detailedAnalysis.full_analysis.ai_analysis.key_observations.map((obs, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">•</span>
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Factors
                </h4>
                <ul className="space-y-2">
                  {detailedAnalysis.full_analysis.ai_analysis.risk_factors.map((risk, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-red-400">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Anomalies */}
              {detailedAnalysis.full_analysis.ai_analysis.anomalies.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold text-sm mb-2 text-yellow-600">Detected Anomalies</h4>
                  {detailedAnalysis.full_analysis.ai_analysis.anomalies.map((anom, i) => (
                    <div key={i} className="text-xs bg-yellow-500/10 p-2 rounded text-yellow-700 border border-yellow-200">
                      <strong>{new Date(anom.date).toLocaleDateString()}:</strong> {anom.reason} ({Number(anom.value).toLocaleString('en-US', { style: 'currency', currency: 'USD' })})
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
