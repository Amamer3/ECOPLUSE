import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-[#e15554]/10">
              <AlertCircle className="h-8 w-8 text-[#e15554]" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter">404</h1>
            <p className="text-xl font-semibold text-foreground/70">Page Not Found</p>
          </div>
        </div>

        <p className="text-muted-foreground max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Please return to the dashboard to continue.
        </p>

        <Link href="/">
          <Button size="lg" className="bg-[#e15554] hover:bg-[#e15554]/90">
            Return to Dashboard
          </Button>
        </Link>

        <div className="pt-8 border-t border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Quick Navigation</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analysis" className="text-sm font-semibold text-[#e15554] hover:text-[#e15554]/80 transition-colors">
              Analysis
            </Link>
            <span className="hidden sm:inline text-muted-foreground">/</span>
            <Link href="/history" className="text-sm font-semibold text-[#e15554] hover:text-[#e15554]/80 transition-colors">
              History
            </Link>
            <span className="hidden sm:inline text-muted-foreground">/</span>
            <Link href="/trends" className="text-sm font-semibold text-[#e15554] hover:text-[#e15554]/80 transition-colors">
              Trends
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
