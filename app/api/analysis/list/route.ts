import { NextResponse } from "next/server"
import { fetchFromN8n } from "@/lib/n8n"

export async function GET() {
  try {
    const response = await fetchFromN8n({ action: "list_analyses" })

    let analyses = []

    if (Array.isArray(response)) {
      analyses = response
    } else if (response && response.data && response.full_analysis) {
      // Handle single analysis response format by wrapping in array
      analyses = [{
        id: response.data.indicator || "latest",
        country: response.data.country,
        indicator: response.data.indicator,
        status: "completed",
        createdAt: response.timestamp || new Date().toISOString(),
        startDate: response.full_analysis.metadata?.date_range?.start || "N/A",
        endDate: response.full_analysis.metadata?.date_range?.end || "N/A"
      }]
    } else if (response && Array.isArray(response.data)) {
      analyses = response.data
    }

    return NextResponse.json(analyses)
  } catch (error) {
    console.error("[v0] Error fetching analyses:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
