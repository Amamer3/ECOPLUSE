import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface Metric {
  title: string
  value: string
  change?: string
  trend?: "up" | "down"
  icon: any
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
            <CardHeader className="h-20 bg-muted/40" />
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            {metric.change && (
              <p className="flex items-center text-xs text-muted-foreground pt-1">
                <span
                  className={
                    metric.trend === "up"
                      ? "text-green-500 flex items-center mr-1"
                      : metric.trend === "down"
                        ? "text-red-500 flex items-center mr-1"
                        : "text-muted-foreground flex items-center mr-1"
                  }
                >
                  {metric.trend === "up" ? (
                    <ArrowUpIcon className="h-3 w-3 mr-0.5" />
                  ) : metric.trend === "down" ? (
                    <ArrowDownIcon className="h-3 w-3 mr-0.5" />
                  ) : null}
                  {metric.change}
                </span>
                from last quarter
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
