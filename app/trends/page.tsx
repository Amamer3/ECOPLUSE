import { fetchFromN8n } from "@/lib/n8n"
import { MetricsGrid, Metric } from "@/components/metrics-grid"
import { TrendBarChart } from "@/components/charts/trend-bar-chart"
import { TrendAreaChart } from "@/components/charts/trend-area-chart"
import { TrendingUp, BarChart2, Activity, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

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

export default async function TrendsPage() {
    let analysis: N8nSingleResponse | null = null
    let metrics: Metric[] = []
    let forecastData: { label: string, value: number }[] = []

    try {
        const response = await fetchFromN8n({ action: "list_analyses" })
        if (response && response.data && response.full_analysis) {
            analysis = response as N8nSingleResponse
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

            // Transform forecast for charts
            forecastData = detailed.forecast.map(f => ({
                label: f.date,
                value: f.value
            }))
        }
    } catch (e) {
        console.error("Failed to fetch trends", e)
    }

    if (!analysis) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Market Trends</h1>
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
                            {analysis.data.country} • {analysis.full_analysis.ai_analysis.trend_description}
                        </p>
                    </div>
                </div>
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
                        <TrendAreaChart data={forecastData} title={analysis.data.indicator} color="var(--primary)" />
                    </CardContent>
                </Card>

                {/* Bar Chart for Distinct Values */}
                <Card>
                    <CardHeader>
                        <CardTitle>Projected Values</CardTitle>
                        <CardDescription>Forecasted milestones for the upcoming periods.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TrendBarChart data={forecastData} title={analysis.data.indicator} color="var(--primary)" />
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
                        The current market trend for <strong>{analysis.data.indicator}</strong> in <strong>{analysis.data.country}</strong> is characterized as
                        <span className="font-semibold text-foreground"> {analysis.full_analysis.ai_analysis.trend}</span> with
                        <span className="font-semibold text-foreground"> {analysis.full_analysis.ai_analysis.trend_strength}</span> momentum.
                        Volatility is observed to be <strong>{analysis.full_analysis.ai_analysis.volatility}</strong>.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
