import { NextResponse } from "next/server"
import { fetchFromN8n, N8nError } from "@/lib/n8n"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const country = url.searchParams.get("country")

    // Validate country parameter if provided
    if (country && typeof country !== "string") {
      return NextResponse.json(
        { error: "Invalid country parameter" },
        { status: 400 }
      )
    }

    const response = await fetchFromN8n({ 
      action: "list_analyses", 
      ...(country ? { country } : {}) 
    })

    let analyses = []

    // Handle different response formats
    if (!response) {
      console.warn("[list] Empty response from webhook")
      return NextResponse.json([], { status: 200 })
    }

    if (Array.isArray(response)) {
      analyses = response
    } else if (response && response.data && response.full_analysis) {
      // Handle single analysis response format by wrapping in array
      analyses = [{
        id: response.data.indicator || response.data.country || "latest",
        country: response.data.country || "Unknown",
        indicator: response.data.indicator || "Unknown",
        status: "completed",
        createdAt: response.timestamp || new Date().toISOString(),
        startDate: response.full_analysis.metadata?.start_date || "N/A",
        endDate: response.full_analysis.metadata?.end_date || "N/A"
      }]
    } else if (response && Array.isArray(response.data)) {
      analyses = response.data
    } else if (response.success === false) {
      // Webhook returned error response
      console.warn("[list] Webhook returned error:", response.message)
      return NextResponse.json([], { status: 200 })
    }

    // Validate analyses array
    if (!Array.isArray(analyses)) {
      console.warn("[list] Analyses is not an array, returning empty")
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(analyses)
  } catch (error) {
    if (error instanceof N8nError) {
      console.error("[list] N8n error:", error.message, error.statusCode)
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    console.error("[list] Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch analyses"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
