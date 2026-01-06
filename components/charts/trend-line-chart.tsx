"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface TrendLineChartProps {
    data: any[]
    series: {
        key: string
        label: string
        color: string
        strokeWidth?: number
        strokeDasharray?: string
    }[]
    title?: string
}

export function TrendLineChart({ data, series, title }: TrendLineChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground border rounded-lg bg-muted/10">
                No visualization data available
            </div>
        )
    }

    // Determine domain for YAxis to add some padding
    const allValues = data.flatMap(d => series.map(s => d[s.key] as number))
    const min = Math.min(...allValues)
    const max = Math.max(...allValues)
    const padding = (max - min) * 0.1

    return (
        <ChartContainer
            config={
                Object.fromEntries(series.map(s => [s.key, { label: s.label, color: s.color }]))
            }
            className="h-[350px] w-full"
        >
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        dy={10}
                        padding={{ left: 10, right: 10 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        tickFormatter={(value) =>
                            new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                notation: "compact",
                                maximumFractionDigits: 1
                            }).format(value)
                        }
                        domain={[min - padding, max + padding]}
                        width={60}
                    />
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                formatter={(value, name) => (
                                    <div className="flex min-w-[130px] items-center text-xs text-muted-foreground">
                                        {name}
                                        <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                            {typeof value === 'number'
                                                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
                                                : value}
                                        </div>
                                    </div>
                                )}
                            />
                        }
                    />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        content={({ payload }) => (
                            <div className="flex items-center justify-end gap-4 pb-4">
                                {payload?.map((entry, index) => (
                                    <div key={`item-${index}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: entry.color }}
                                        />
                                        {entry.value}
                                    </div>
                                ))}
                            </div>
                        )}
                    />
                    {series.map((s) => (
                        <Line
                            key={s.key}
                            type="monotone"
                            dataKey={s.key}
                            stroke={s.color}
                            strokeWidth={s.strokeWidth || 2}
                            strokeDasharray={s.strokeDasharray}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0, fill: s.color }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
    )
}
