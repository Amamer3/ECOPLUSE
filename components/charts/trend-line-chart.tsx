"use client"

import * as Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsMore from "highcharts/highcharts-more"
import { useEffect, useRef } from "react"

// Initialize Highcharts modules
if (typeof Highcharts === 'object' && typeof HighchartsMore === 'function') {
    (HighchartsMore as any)(Highcharts)
}

interface TrendLineChartProps {
    data: any[]
    series: {
        key: string
        label: string
        color: string
        strokeWidth?: number
        strokeDasharray?: string
        hideInLegend?: boolean
    }[]
    title?: string
    type?: 'line' | 'area'
}

export function TrendLineChart({ data, series, title, type = 'line' }: TrendLineChartProps) {
    const chartRef = useRef<HighchartsReact.RefObject>(null)
    // Add container ref for responsive height
    const containerRef = useRef<HTMLDivElement>(null)

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[220px] sm:h-[280px] md:h-[320px] lg:h-[360px] flex items-center justify-center text-muted-foreground border rounded-xl bg-accent/5">
                No visualization data available
            </div>
        )
    }

    // Observe container height and update chart size accordingly
    useEffect(() => {
        const container = containerRef.current
        const chart = chartRef.current?.chart as Highcharts.Chart | undefined
        if (!container || !chart) return

        const handleResize = () => {
            const height = container.clientHeight
            chart.setSize(undefined, height, false)
        }
        // Initial size sync
        handleResize()
        // Observe container changes
        const ro = new ResizeObserver(handleResize)
        ro.observe(container)
        return () => ro.disconnect()
    }, [])

    const options: Highcharts.Options = {
        chart: {
            type: 'line',
            backgroundColor: 'transparent',
            height: 350,
            style: {
                fontFamily: 'inherit'
            },
            spacingTop: 20,
            spacingBottom: 20
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
                formatter: function () {
                    return new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        notation: "compact",
                        maximumFractionDigits: 1
                    }).format(this.value as number)
                },
                style: {
                    color: 'hsl(var(--muted-foreground))',
                    fontSize: '11px',
                    fontWeight: '600'
                }
            }
        },
        legend: {
            align: 'right',
            verticalAlign: 'top',
            layout: 'horizontal',
            itemStyle: {
                color: 'hsl(var(--muted-foreground))',
                fontSize: '10px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            },
            symbolRadius: 4,
            symbolHeight: 8,
            symbolWidth: 8
        },
        tooltip: {
            shared: true,
            useHTML: true,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderWidth: 0,
            shadow: true,
            headerFormat: '<div style="font-size: 11px; font-weight: 800; margin-bottom: 8px; color: #666; text-transform: uppercase;">{point.key}</div>',
            pointFormat: '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">' +
                '<span style="color:{point.color}">●</span>' +
                '<span style="font-size: 12px; font-weight: 600; color: #333;">{series.name}:</span>' +
                '<span style="font-size: 12px; font-weight: 800; color: #111; margin-left: auto;">${point.y:,.0f}</span>' +
                '</div>',
            style: {
                fontFamily: 'inherit'
            }
        },
        plotOptions: {
            line: {
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: true,
                            radius: 6,
                            lineWidth: 0
                        }
                    }
                },
                lineWidth: 3,
                states: {
                    hover: {
                        lineWidth: 3
                    }
                }
            },
            area: {
                fillColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    stops: [
                        [0, Highcharts.color('#e15554').setOpacity(0.2).get('rgba') as string],
                        [1, Highcharts.color('#e15554').setOpacity(0).get('rgba') as string]
                    ]
                },
                lineWidth: 3,
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: true,
                            radius: 6,
                            lineWidth: 0
                        }
                    }
                }
            },
            arearange: {
                fillOpacity: 0.1,
                lineWidth: 0,
                linkedTo: ':previous',
                color: '#e15554',
                marker: {
                    enabled: false
                }
            }
        },
        series: (() => {
            const result: Highcharts.SeriesOptionsType[] = []
            const hasRange = series.some(s => s.key === 'upper') && series.some(s => s.key === 'lower')

            // Add main lines
            series.filter(s => s.key !== 'upper' && s.key !== 'lower').forEach(s => {
                const baseColor = s.color || '#e15554';
                result.push({
                    name: s.label,
                    data: data.map(d => d[s.key]),
                    color: baseColor,
                    lineWidth: s.strokeWidth || 3,
                    dashStyle: s.strokeDasharray ? 'Dash' as any : 'Solid' as any,
                    showInLegend: !s.hideInLegend,
                    type: type,
                    zIndex: 5,
                    fillColor: type === 'area' ? {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, Highcharts.color(baseColor).setOpacity(0.25).get('rgba') as string],
                            [1, Highcharts.color(baseColor).setOpacity(0).get('rgba') as string]
                        ]
                    } : undefined
                } as any)
            })

            // Add range if available
            if (hasRange) {
                result.push({
                    name: 'Confidence Interval',
                    type: 'arearange',
                    data: data.map(d => [d.upper, d.lower]),
                    color: '#e15554',
                    fillOpacity: 0.1,
                    lineWidth: 0,
                    showInLegend: false,
                    zIndex: 0
                } as any)
            }

            return result
        })()
    }

    return (
        <div ref={containerRef} className="w-full h-[220px] sm:h-[280px] md:h-[320px] lg:h-[360px]">
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
                ref={chartRef}
            />
        </div>
    )
}



