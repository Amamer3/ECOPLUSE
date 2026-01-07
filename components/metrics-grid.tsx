import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

export interface Metric {
  title: string
  value: string
  change?: string
  trend?: "up" | "down"
  icon?: LucideIcon
}

interface MetricsGridProps {
  metrics: Metric[]
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6 h-24" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col items-start justify-center min-h-[120px]">
            {/* Big Number with Marketing360 Red Accent */}
            <div className="text-3xl font-bold text-[#e15554] tracking-tight">
              {metric.value}
            </div>
            {/* Label */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">
              {metric.title}
            </p>
            {/* Change Indicator */}
            {metric.change && (
              <div className="flex items-center mt-2 text-xs">
                <span className={`${metric.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'} font-medium`}>
                  {metric.change}
                </span>
                <span className="text-muted-foreground ml-1">vs last period</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
