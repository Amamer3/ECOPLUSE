"use client"

import * as Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import { useRef } from "react"

interface TrendAreaChartProps {
    data: {
        label: string
        value: number
    }[]
    title?: string
    color?: string
}

export function TrendAreaChart({ data, title, color = "#e15554" }: TrendAreaChartProps) {
    const chartRef = useRef<HighchartsReact.RefObject>(null)

    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground border rounded-xl bg-accent/5">
                No data available
            </div>
        )
    }

    const options: Highcharts.Options = {
        chart: {
            type: 'area',
            backgroundColor: 'transparent',
            height: 300,
            style: {
                fontFamily: 'inherit'
            },
            spacingTop: 10,
            spacingBottom: 10
        },
        title: {
            text: undefined
        },
        credits: {
            enabled: false
        },
        xAxis: {
            categories: data.map(d => d.label),
            gridLineWidth: 0,
            lineColor: 'rgba(128,128,128,0.1)',
            tickWidth: 0,
            labels: {
                style: {
                    color: 'hsl(var(--muted-foreground))',
                    fontSize: '11px',
                    fontWeight: '600'
                }
            }
        },
        yAxis: {
            title: {
                text: undefined
            },
            gridLineDashStyle: 'Dash',
            gridLineColor: 'rgba(128,128,128,0.1)',
            labels: {
                style: {
                    color: 'hsl(var(--muted-foreground))',
                    fontSize: '11px',
                    fontWeight: '600'
                }
            }
        },
        legend: {
            enabled: false
        },
        tooltip: {
            useHTML: true,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderWidth: 0,
            shadow: true,
            headerFormat: '<div style="font-size: 11px; font-weight: 800; margin-bottom: 8px; color: #666; text-transform: uppercase;">{point.key}</div>',
            pointFormat: '<div style="display: flex; align-items: center; gap: 8px;">' +
                '<span style="color:{point.color}">●</span>' +
                '<span style="font-size: 12px; font-weight: 600; color: #333;">' + (title || 'Value') + ':</span>' +
                '<span style="font-size: 12px; font-weight: 800; color: #111; margin-left: auto;">{point.y:,.0f}</span>' +
                '</div>',
            style: {
                fontFamily: 'inherit'
            }
        },
        plotOptions: {
            area: {
                fillColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    stops: [
                        [0, color],
                        [1, Highcharts.color(color).setOpacity(0.1).get('rgba') as string]
                    ]
                },
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: true,
                            radius: 5
                        }
                    }
                },
                lineWidth: 2,
                states: {
                    hover: {
                        lineWidth: 2
                    }
                },
                threshold: null
            }
        },
        series: [{
            name: title || 'Value',
            data: data.map(d => d.value),
            color: color,
            type: 'area'
        }]
    }

    return (
        <div className="h-[300px] w-full">
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
                ref={chartRef}
            />
        </div>
    )
}

