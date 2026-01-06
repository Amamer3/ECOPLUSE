import { AnalysisTriggerDialog } from "@/components/analysis-trigger-dialog"
import { BarChart3 } from "lucide-react"

export default function AnalysisPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
                <BarChart3 className="w-12 h-12" />
            </div>
            <div className="space-y-2 max-w-lg">
                <h1 className="text-3xl font-bold tracking-tight">Economic Analysis</h1>
                <p className="text-muted-foreground">
                    Run detailed time-series analysis on global economic indicators. Select a country, indicator, and date range to generate insights.
                </p>
            </div>
            <AnalysisTriggerDialog />
        </div>
    )
}
